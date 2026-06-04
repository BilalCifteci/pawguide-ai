import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-4">🐾</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-6">Bu sayfa bulunamadi.</p>
        <Link href="/dashboard"
          className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold transition shadow-sm shadow-amber-200">
          Ana Sayfaya Don
        </Link>
      </div>
    </div>
  );
}
