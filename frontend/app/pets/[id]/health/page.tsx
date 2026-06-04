"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { petsApi, healthRecordsApi } from "@/lib/api";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

const RECORD_TYPES = [
  { value: "vaccination", label: "💉 Asi", color: "bg-blue-100 text-blue-700" },
  { value: "vet_visit", label: "🏥 Vet Ziyareti", color: "bg-green-100 text-green-700" },
  { value: "medication", label: "💊 Ilac", color: "bg-purple-100 text-purple-700" },
  { value: "surgery", label: "🔪 Ameliyat", color: "bg-red-100 text-red-700" },
  { value: "lab_test", label: "🧪 Tahlil", color: "bg-amber-100 text-amber-700" },
  { value: "other", label: "📋 Diger", color: "bg-gray-100 text-gray-700" },
];

const TYPE_MAP = Object.fromEntries(RECORD_TYPES.map(r => [r.value, r]));

export default function HealthRecordsPage({ params }: { params: { id: string } }) {
  const { status } = useSession();
  if (status === "unauthenticated") redirect("/auth/login");

  const petId = params.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    record_type: "vaccination", title: "", description: "",
    record_date: "", vet_name: "", next_due_date: "", notes: "",
  });

  const { data: pet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => petsApi.get(petId).then(r => r.data),
  });

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["health-records", petId],
    queryFn: () => healthRecordsApi.list(petId).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => healthRecordsApi.create(petId, {
      ...form,
      record_date: form.record_date || undefined,
      next_due_date: form.next_due_date || undefined,
      description: form.description || undefined,
      vet_name: form.vet_name || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-records", petId] });
      setShowForm(false);
      setForm({ record_type: "vaccination", title: "", description: "", record_date: "", vet_name: "", next_due_date: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: string) => healthRecordsApi.delete(petId, recordId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-records", petId] }),
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const upcoming = records.filter((r: any) => r.next_due_date && new Date(r.next_due_date) >= new Date());
  const past = records.filter((r: any) => !r.next_due_date || new Date(r.next_due_date) < new Date());

  return (
    <AppLayout backHref={`/pets/${petId}`} backLabel={pet?.name ?? "Geri"}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Saglik Kayitlari</h1>
            <p className="text-sm text-gray-400 mt-0.5">{pet?.name} — Asi, vet ziyareti, ilac takibi</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-amber-200">
            {showForm ? "Iptal" : "+ Kayit Ekle"}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
            <h2 className="font-bold text-gray-900">Yeni Kayit</h2>

            {/* Type */}
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map(rt => (
                <button key={rt.value} type="button" onClick={() => set("record_type", rt.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    form.record_type === rt.value ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}>
                  {rt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Baslik *">
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  className={inputClass} placeholder="Kuduz asisi, Genel muayene..." />
              </Field>
              <Field label="Tarih">
                <input type="date" value={form.record_date} onChange={e => set("record_date", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Veteriner">
                <input value={form.vet_name} onChange={e => set("vet_name", e.target.value)}
                  className={inputClass} placeholder="Dr. Ahmet Yilmaz" />
              </Field>
              <Field label="Sonraki Tarih">
                <input type="date" value={form.next_due_date} onChange={e => set("next_due_date", e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label="Notlar">
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                rows={2} className={`${inputClass} resize-none`} placeholder="Ek bilgi..." />
            </Field>

            <button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white rounded-xl font-bold transition disabled:opacity-50">
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydi Ekle"}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-gray-700">Henuz kayit yok</p>
            <p className="text-sm text-gray-400 mt-1">Ilk saglik kaydini ekleyin</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📅 Yaklasan Randevular</h2>
                <div className="space-y-3">
                  {upcoming.map((r: any) => (
                    <RecordCard key={r.id} record={r} onDelete={() => deleteMutation.mutate(r.id)} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📚 Gecmis Kayitlar</h2>
                <div className="space-y-3">
                  {past.map((r: any) => (
                    <RecordCard key={r.id} record={r} onDelete={() => deleteMutation.mutate(r.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function RecordCard({ record, onDelete }: { record: any; onDelete: () => void }) {
  const typeInfo = TYPE_MAP[record.record_type] ?? TYPE_MAP.other;
  const isUpcoming = record.next_due_date && new Date(record.next_due_date) >= new Date();
  const daysUntil = record.next_due_date
    ? Math.ceil((new Date(record.next_due_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{record.title}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
              {record.record_date && <span>📅 {record.record_date}</span>}
              {record.vet_name && <span>👨‍⚕️ {record.vet_name}</span>}
              {record.next_due_date && (
                <span className={daysUntil !== null && daysUntil <= 7 ? "text-red-500 font-semibold" : "text-amber-600"}>
                  🔔 {daysUntil !== null && daysUntil >= 0 ? `${daysUntil} gunde` : "Gecti"}: {record.next_due_date}
                </span>
              )}
            </div>
            {record.notes && <p className="text-xs text-gray-400 mt-1 italic">{record.notes}</p>}
          </div>
        </div>
        <button onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition flex-shrink-0 p-1 rounded-lg hover:bg-red-50">
          ✕
        </button>
      </div>
    </div>
  );
}

const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-gray-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
