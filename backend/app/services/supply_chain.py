"""
Supply Chain Verification Service
───────────────────────────────────
Validates product authenticity via barcode/QR lookup.
Connects to manufacturer database for supply chain transparency.
"""
import hashlib
import hmac
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.food_product import FoodProduct


class VerificationResult:
    def __init__(
        self,
        is_authentic: bool,
        product: FoodProduct | None,
        confidence: float,
        message: str,
        chain_data: dict | None = None,
    ):
        self.is_authentic = is_authentic
        self.product = product
        self.confidence = confidence  # 0.0 – 1.0
        self.message = message
        self.chain_data = chain_data or {}
        self.verified_at = datetime.now(timezone.utc).isoformat()


class SupplyChainService:
    """
    Verifies product authenticity via barcode/QR code.
    Supports EAN-13, UPC-A, QR codes, and DataMatrix formats.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_barcode(self, barcode: str) -> VerificationResult:
        """
        Look up a product by barcode and verify authenticity.
        """
        # Normalize barcode
        barcode = barcode.strip().upper()

        # Query database
        stmt = select(FoodProduct).where(FoodProduct.barcode == barcode)
        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            return VerificationResult(
                is_authentic=False,
                product=None,
                confidence=0.0,
                message=(
                    "Barcode not found in our database. "
                    "This product may be unregistered or counterfeit."
                ),
            )

        if not product.is_authentic:
            return VerificationResult(
                is_authentic=False,
                product=product,
                confidence=0.95,
                message=(
                    f"⚠️ WARNING: {product.brand} – {product.name} has been flagged as "
                    "potentially counterfeit. Do not feed to your pet."
                ),
                chain_data={"flagged": True, "risk_level": "high"},
            )

        return VerificationResult(
            is_authentic=True,
            product=product,
            confidence=0.99 if product.is_verified else 0.80,
            message=(
                f"✅ {product.brand} – {product.name} is authentic and verified."
                if product.is_verified
                else f"✓ {product.brand} – {product.name} found in database (unverified by manufacturer)."
            ),
            chain_data={
                "manufacturer_id": product.manufacturer_id,
                "is_manufacturer_verified": product.is_verified,
            },
        )

    async def verify_qr(self, qr_payload: str) -> VerificationResult:
        """
        Verify a QR code payload. QR may contain:
        - Plain barcode
        - JSON: {barcode, manufacturer_id, signature, timestamp}
        """
        import json

        try:
            data = json.loads(qr_payload)
            barcode = data.get("barcode", "")
            manufacturer_id = data.get("manufacturer_id", "")
            signature = data.get("signature", "")
            timestamp = data.get("timestamp", "")

            # Verify HMAC signature if present
            if signature and manufacturer_id:
                is_sig_valid = self._verify_signature(
                    f"{barcode}{manufacturer_id}{timestamp}", signature, manufacturer_id
                )
                if not is_sig_valid:
                    return VerificationResult(
                        is_authentic=False,
                        product=None,
                        confidence=0.9,
                        message="QR code signature is invalid. This product may be counterfeit.",
                    )

            result = await self.verify_barcode(barcode)
            return result

        except (json.JSONDecodeError, KeyError):
            # Plain QR = treat as barcode
            return await self.verify_barcode(qr_payload)

    def _verify_signature(
        self, message: str, signature: str, manufacturer_id: str
    ) -> bool:
        """
        Verify HMAC-SHA256 signature from manufacturer.
        In production: fetch manufacturer public key from secure vault.
        """
        # In production: lookup manufacturer key from secure key store
        # For now: derive a deterministic key from manufacturer_id + SECRET_KEY
        key = hashlib.sha256(
            f"{settings.SECRET_KEY}:{manufacturer_id}".encode()
        ).digest()
        expected = hmac.new(key, message.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def flag_product(
        self, barcode: str, reason: str, reported_by_user_id: str
    ) -> dict:
        """
        Flag a product as potentially counterfeit.
        Requires admin review before marking as fake.
        """
        stmt = select(FoodProduct).where(FoodProduct.barcode == barcode)
        result = await self.db.execute(stmt)
        product = result.scalar_one_or_none()

        if not product:
            return {"success": False, "message": "Product not found."}

        # In production: create a fraud_report record and notify admins
        return {
            "success": True,
            "message": "Product flagged for review. Our team will investigate.",
            "product_id": str(product.id),
            "reported_reason": reason,
        }
