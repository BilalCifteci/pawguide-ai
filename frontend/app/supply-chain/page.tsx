"use client";

import { useState } from "react";
import { supplyChainApi } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await supplyChainApi.verifyBarcode(barcode.trim());
      setResult(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-xl font-semibold text-gray-900">Ürün Doğrulama</h1>
          <p className="text-gray-500 text-sm mt-1">
            Barcode veya QR kod ile mama orijinalliğini kontrol edin
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barkod / QR Kodu
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              placeholder="8690000000000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={verify}
            disabled={loading || !barcode.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {loading ? "Kontrol ediliyor..." : "Doğrula"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div
            className={`mt-4 p-4 rounded-lg border text-sm ${
              result.is_authentic
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="font-semibold text-base mb-1">{result.message}</p>
            {result.product_name && (
              <p className="text-xs opacity-70 mt-1">
                {result.product_brand} — {result.product_name}
              </p>
            )}
            <p className="text-xs opacity-60 mt-2">
              Güven skoru: {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
