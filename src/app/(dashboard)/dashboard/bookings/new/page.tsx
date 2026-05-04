"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check, AlertCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

type BookingType = "MONTHLY" | "DAILY" | "NIGHTLY";

interface Step1 { assetId: string; assetName: string; startDate: string; endDate: string; type: BookingType; }
interface Step2 { customerId: string; customerName: string; }
interface Step3 { totalAmount: string; depositAmount: string; notes: string; }

const BOOKING_TYPES: { value: BookingType; label: string }[] = [
  { value: "MONTHLY",  label: "Mensuel" },
  { value: "DAILY",    label: "Journalier" },
  { value: "NIGHTLY",  label: "Nuitée" },
];

const STEPS = ["Asset & Dates", "Client", "Confirmation"];

const inputCls = "w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-600 transition-colors";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default function NewBookingPage() {
  const router = useRouter();
  const [step,  setStep]  = useState(1);
  const [s1,    setS1]    = useState<Partial<Step1>>({ type: "MONTHLY" });
  const [s2,    setS2]    = useState<Partial<Step2>>({});
  const [s3,    setS3]    = useState<Step3>({ totalAmount: "", depositAmount: "", notes: "" });
  const [query, setQuery] = useState("");

  const { data: assets = [] } = useQuery({
    queryKey: ["assets-picker"],
    queryFn: async () => {
      const res = await fetch("/api/v1/assets?limit=100");
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data ?? [];
    },
  });

  const { data: avail, isLoading: checkingAvail } = useQuery({
    queryKey: ["avail-check", s1.assetId, s1.startDate, s1.endDate],
    enabled: !!(s1.assetId && s1.startDate && s1.endDate),
    queryFn: async () => {
      const p = new URLSearchParams({ assetId: s1.assetId!, from: s1.startDate!, to: s1.endDate! });
      const res = await fetch(`/api/v1/availability?${p}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const hasConflict = (avail?.bookings?.length ?? 0) > 0 || (avail?.blocks?.length ?? 0) > 0;

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-pick", query],
    enabled:  query.length >= 2,
    queryFn: async () => {
      const res = await fetch(`/api/v1/customers?search=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId:       s1.assetId,
          customerId:    s2.customerId,
          startDate:     s1.startDate,
          endDate:       s1.endDate,
          type:          s1.type,
          totalAmount:   s3.totalAmount,
          depositAmount: s3.depositAmount || undefined,
          notes:         s3.notes         || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? err.error ?? "Échec");
      }
      return res.json();
    },
    onSuccess: (b) => {
      toast.success("Réservation créée");
      router.push(`/dashboard/bookings/${b.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canNext1  = !!(s1.assetId && s1.startDate && s1.endDate && s1.type && !hasConflict && !checkingAvail);
  const canNext2  = !!s2.customerId;
  const canSubmit = !!(s3.totalAmount && parseFloat(s3.totalAmount) > 0);

  return (
    <div>
      <PageHeader title="Nouvelle réservation" breadcrumb={["EnyaRent", "Réservations", "Nouvelle"]} />

      <div className="p-8 max-w-2xl">
        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, idx) => {
            const n = idx + 1;
            const done = step > n; const active = step === n;
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
                  done ? "bg-green-500 text-white" : active ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {done ? <Check size={12} /> : n}
                </div>
                <span className={cn("text-sm font-medium flex-shrink-0", active ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>
                  {label}
                </span>
                {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Étape 1 */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sélection de l'asset et des dates</h2>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Asset <span className="text-red-500">*</span></label>
              <select
                value={s1.assetId ?? ""}
                onChange={(e) => {
                  const name = e.target.options[e.target.selectedIndex].text;
                  setS1((p) => ({ ...p, assetId: e.target.value, assetName: name }));
                }}
                className={cn(inputCls, "cursor-pointer")}
              >
                <option value="">Sélectionner un asset</option>
                {assets.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Date de début <span className="text-red-500">*</span></label>
                <input type="date" value={s1.startDate ?? ""}
                  onChange={(e) => setS1((p) => ({ ...p, startDate: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Date de fin <span className="text-red-500">*</span></label>
                <input type="date" value={s1.endDate ?? ""} min={s1.startDate}
                  onChange={(e) => setS1((p) => ({ ...p, endDate: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Type de location <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {BOOKING_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setS1((p) => ({ ...p, type: t.value }))}
                    className={cn(
                      "flex-1 h-9 text-sm font-medium rounded-lg border transition-colors",
                      s1.type === t.value
                        ? "bg-primary-600 border-primary-600 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-600"
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {s1.assetId && s1.startDate && s1.endDate && (
              <div className={cn(
                "flex items-start gap-2 p-3 rounded-lg text-sm",
                checkingAvail ? "bg-slate-50 dark:bg-slate-800 text-slate-500" :
                hasConflict   ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                                "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              )}>
                {checkingAvail ? (
                  <span>Vérification des disponibilités...</span>
                ) : hasConflict ? (
                  <><AlertCircle size={15} className="flex-shrink-0 mt-0.5" /><span>Ces dates sont déjà occupées. Choisissez d'autres dates.</span></>
                ) : (
                  <><Check size={15} className="flex-shrink-0 mt-0.5" /><span>Disponible sur cette période.</span></>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button disabled={!canNext1} onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Étape 2 */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sélection du client</h2>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Rechercher un client</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, email, téléphone, CIN..."
                  className={cn(inputCls, "pl-8")} />
              </div>
            </div>

            {customers.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {customers.map((c: any) => (
                  <button key={c.id} type="button"
                    onClick={() => { setS2({ customerId: c.id, customerName: c.name }); setQuery(""); }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      s2.customerId === c.id && "bg-primary-50 dark:bg-primary-900/20"
                    )}>
                    <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                    <span className="block text-xs text-slate-400">{c.email ?? c.phone ?? c.cin ?? ""}</span>
                  </button>
                ))}
              </div>
            )}

            {s2.customerId && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-400">
                <Check size={15} />
                <span>Client sélectionné : <strong>{s2.customerName}</strong></span>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ChevronLeft size={16} /> Retour
              </button>
              <button disabled={!canNext2} onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Étape 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Récapitulatif</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div><p className="text-xs text-slate-500">Asset</p><p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{s1.assetName}</p></div>
                <div><p className="text-xs text-slate-500">Client</p><p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{s2.customerName}</p></div>
                <div><p className="text-xs text-slate-500">Début</p><p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{fmt(s1.startDate!)}</p></div>
                <div><p className="text-xs text-slate-500">Fin</p><p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{fmt(s1.endDate!)}</p></div>
                <div><p className="text-xs text-slate-500">Type</p><p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{s1.type}</p></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Montants (MAD)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Montant total <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" placeholder="0.00" value={s3.totalAmount}
                    onChange={(e) => setS3((p) => ({ ...p, totalAmount: e.target.value }))}
                    className={cn(inputCls, "tabular-nums")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Caution</label>
                  <input type="number" step="0.01" placeholder="0.00" value={s3.depositAmount}
                    onChange={(e) => setS3((p) => ({ ...p, depositAmount: e.target.value }))}
                    className={cn(inputCls, "tabular-nums")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={3} placeholder="Conditions particulières..." value={s3.notes}
                  onChange={(e) => setS3((p) => ({ ...p, notes: e.target.value }))}
                  className={cn(inputCls, "h-auto resize-none py-2.5")} />
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <ChevronLeft size={16} /> Retour
              </button>
              <button disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                <Check size={16} />
                {mutation.isPending ? "Création..." : "Confirmer la réservation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
