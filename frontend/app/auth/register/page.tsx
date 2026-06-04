"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (form.password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `/api/backend/auth/register`,
        {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
        }
      );
      // Auto-login after register
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Kayıt sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200 mb-4">
          <span className="text-3xl">🐾</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Hesap Olustur</h1>
        <p className="text-gray-500 text-sm mt-1">PawGuide AI'ya katil</p>
      </div>
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8 border border-gray-100">

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Ad Soyad", name: "full_name", type: "text", placeholder: "Ahmet Yılmaz" },
            { label: "E-posta", name: "email", type: "email", placeholder: "ornek@email.com" },
            { label: "Şifre", name: "password", type: "password", placeholder: "En az 8 karakter" },
            { label: "Şifre Tekrar", name: "confirmPassword", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                required
                value={(form as any)[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50 hover:bg-white transition"
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-sm shadow-amber-200 hover:shadow-md mt-2"
          >
            {loading ? "Kaydediliyor..." : "Kayit Ol"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Zaten hesabiniz var mi?{" "}
          <Link href="/auth/login" className="text-amber-500 hover:text-amber-600 font-semibold">
            Giris yap
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
