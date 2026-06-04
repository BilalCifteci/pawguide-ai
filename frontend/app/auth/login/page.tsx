"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("E-posta veya sifre hatali.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200 mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PawGuide AI</h1>
          <p className="text-gray-500 text-sm mt-1">Tuklu dostlariniz icin akilli takip</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Giris Yap</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">E-posta</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50 hover:bg-white transition"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50 hover:bg-white transition"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">⚠️ {error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-sm shadow-amber-200 hover:shadow-md mt-2"
            >
              {loading ? "Giris yapiliyor..." : "Giris Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Hesabiniz yok mu?{" "}
          <Link href="/auth/register" className="text-amber-500 hover:text-amber-600 font-semibold">
            Kayit ol
          </Link>
        </p>
      </div>
    </div>
  );
}
