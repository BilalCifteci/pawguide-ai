from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.supply_chain import SupplyChainService
from app.schemas.supply_chain import BarcodeVerifyRequest, VerificationResponse

router = APIRouter()


@router.post("/verify/barcode", response_model=VerificationResponse)
async def verify_barcode(
    payload: BarcodeVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    service = SupplyChainService(db)
    result = await service.verify_barcode(payload.barcode)
    return VerificationResponse(
        is_authentic=result.is_authentic,
        confidence=result.confidence,
        message=result.message,
        verified_at=result.verified_at,
        product_name=result.product.name if result.product else None,
        product_brand=result.product.brand if result.product else None,
        chain_data=result.chain_data,
    )


@router.post("/verify/qr", response_model=VerificationResponse)
async def verify_qr(
    payload: BarcodeVerifyRequest,  # reuse same schema, barcode field = qr payload
    db: AsyncSession = Depends(get_db),
):
    service = SupplyChainService(db)
    result = await service.verify_qr(payload.barcode)
    return VerificationResponse(
        is_authentic=result.is_authentic,
        confidence=result.confidence,
        message=result.message,
        verified_at=result.verified_at,
        product_name=result.product.name if result.product else None,
        product_brand=result.product.brand if result.product else None,
        chain_data=result.chain_data,
    )
