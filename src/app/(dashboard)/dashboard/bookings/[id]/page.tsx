"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FileText, Check, Ban, ArrowLeft, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmée",
  ACTIVE:    "Active",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const CONTRACT_STYLES: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  SENT:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SIGNED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-slate-100 text-slate-500",
};

const TIMELINE = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED"] as const;

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params.id as string;
  const qc     = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/bookings/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/v1/bookings/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Échec");
    },
    onSuccess: () => { toast.success("Statut mis à jour"); qc.invalidateQueries({ queryKey: ["booking", id] }); },
    onError:   () => toast.error("Erreur lors de la mise à jour"),
  });

  const generateContract = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/contracts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "Échec"); }
      return res.json();
    },
    onSuccess: (contract) => {
      toast.success("Contrat généré");
      qc.invalidateQueries({ queryKey: ["booking", id] });
      router.push(`/dashboard/contracts/${contract.id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return (
    <div>
      <PageHeader title="Chargement..." breadcrumb={["EnyaRent", "Réservations", "..."]} />
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!booking) return (
    <div>
      <PageHeader title="Introuvable" breadcrumb={["EnyaRent", "Réservations"]} />
      <div className="p-8"><p className="text-sm text-slate-500">Réservation introuvable.</p></div>
    </div>
  );

  const currentStep = TIMELINE.indexOf(booking.status as typeof TIMELINE[number]);
  const isCancelled = booking.status === "CANCELLED";

  return (
    <div>
      <PageHeader
        title={`Réservation — ${booking.asset?.name}`}
        breadcrumb={["EnyaRent", "Réservations", booking.asset?.name ?? id]}
        actions={
          <button onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={15} /> Retour
          </button>
        }
      />

      <div className="p-8 max-w-4xl space-y-6">

        {/* Infos + actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{booking.asset?.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{booking.asset?.assetType?.name}</p>
            </div>
            <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_STYLES[booking.status])}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{booking.customer?.name}</p>
              {booking.customer?.phone && <p className="text-xs text-slate-400">{booking.customer.phone}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-500">Période</p>
              <p className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">{fmt(booking.startDate)}</p>
              <p className="text-xs text-slate-400">au {fmt(booking.endDate)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Montant total</p>
              <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {parseFloat(booking.totalAmount).toLocaleString("fr-FR")} MAD
              </p>
            </div>
            {booking.depositAmount && (
              <div>
                <p className="text-xs text-slate-500">Caution</p>
                <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                  {parseFloat(booking.depositAmount).toLocaleString("fr-FR")} MAD
                </p>
              </div>
            )}
          </div>

          {!isCancelled && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              {booking.status === "PENDING" && (
                <button onClick={() => updateStatus.mutate("CONFIRMED")} disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Check size={14} /> Confirmer
                </button>
              )}
              {booking.status === "CONFIRMED" && (
                <button onClick={() => updateStatus.mutate("ACTIVE")} disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Check size={14} /> Activer
                </button>
              )}
              {booking.status === "ACTIVE" && (
                <button onClick={() => updateStatus.mutate("COMPLETED")} disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Check size={14} /> Terminer
                </button>
              )}
              {!["CANCELLED", "COMPLETED"].includes(booking.status) && (
                <button onClick={() => { if (confirm("Annuler cette réservation ?")) updateStatus.mutate("CANCELLED"); }}
                  disabled={updateStatus.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Ban size={14} /> Annuler
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-5">Progression</h3>
            <div className="flex items-center">
              {TIMELINE.map((s, idx) => {
                const done = idx < currentStep; const active = idx === currentStep;
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                        done   ? "bg-green-500 border-green-500 text-white"    :
                        active ? "bg-primary-600 border-primary-600 text-white" :
                                 "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400"
                      )}>
                        {done ? <Check size={12} /> : idx + 1}
                      </div>
                      <span className={cn("text-[10px] font-medium whitespace-nowrap",
                        active ? "text-primary-600" : done ? "text-green-600" : "text-slate-400")}>
                        {STATUS_LABELS[s]}
                      </span>
                    </div>
                    {idx < TIMELINE.length - 1 && (
                      <div className={cn("flex-1 h-0.5 mx-2 mb-4 transition-colors",
                        done ? "bg-green-400" : "bg-slate-200 dark:bg-slate-700")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contrat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contrat</h3>
            {!booking.contract && (
              <button onClick={() => generateContract.mutate()} disabled={generateContract.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors">
                <FileText size={13} />
                {generateContract.isPending ? "Génération PDF..." : "Générer le contrat"}
              </button>
            )}
          </div>
          {booking.contract ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Contrat {booking.contract.templateType}
                  </p>
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5",
                    CONTRACT_STYLES[booking.contract.status])}>
                    {booking.contract.status}
                  </span>
                </div>
              </div>
              <button onClick={() => router.push(`/dashboard/contracts/${booking.contract.id}`)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Voir le contrat
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucun contrat généré pour cette réservation.</p>
          )}
        </div>

        {/* Paiements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Paiements</h3>
          {booking.payments?.length > 0 ? (
            <div className="space-y-2">
              {booking.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard size={15} className="text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{p.type}</p>
                      <p className="text-xs text-slate-400">{fmt(p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {parseFloat(p.amount).toLocaleString("fr-FR")} {p.currency}
                    </p>
                    <p className="text-xs text-slate-400">{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucun paiement enregistré.</p>
          )}
        </div>

        {booking.notes && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{booking.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
