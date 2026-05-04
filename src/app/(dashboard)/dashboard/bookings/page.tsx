"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Eye, Ban } from "lucide-react";
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

const STATUSES = [
  { value: "",           label: "Tous" },
  { value: "PENDING",    label: "En attente" },
  { value: "CONFIRMED",  label: "Confirmée" },
  { value: "ACTIVE",     label: "Active" },
  { value: "COMPLETED",  label: "Terminée" },
  { value: "CANCELLED",  label: "Annulée" },
];

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default function BookingsPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", page, search, status],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) p.set("search", search);
      if (status) p.set("status", status);
      const res = await fetch(`/api/v1/bookings?${p}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec");
    },
    onSuccess: () => {
      toast.success("Réservation annulée");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  const bookings = data?.data  ?? [];
  const total    = data?.total ?? 0;
  const pages    = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="Réservations"
        breadcrumb={["EnyaRent", "Réservations"]}
        actions={
          <button
            onClick={() => router.push("/dashboard/bookings/new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} />
            Nouvelle réservation
          </button>
        }
      />

      <div className="p-8 space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Rechercher asset ou client..."
              className="w-full h-9 pl-8 pr-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-primary-600"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => { setStatus(s.value); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  status === s.value
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-600"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Asset</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dates</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Aucune réservation trouvée
                  </td>
                </tr>
              ) : (
                bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{b.asset?.name ?? "—"}</span>
                      <span className="block text-xs text-slate-400">{b.asset?.assetType?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {b.customer?.name ?? "—"}
                      {b.customer?.phone && <span className="block text-xs text-slate-400">{b.customer.phone}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      <span className="block">{fmt(b.startDate)}</span>
                      <span className="text-slate-400">au {fmt(b.endDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {parseFloat(b.totalAmount).toLocaleString("fr-FR")} MAD
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING)}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/bookings/${b.id}`)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye size={15} />
                        </button>
                        {!["CANCELLED", "COMPLETED"].includes(b.status) && (
                          <button
                            onClick={() => { if (confirm("Annuler cette réservation ?")) cancel.mutate(b.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500">{total} réservation(s)</span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Préc.
                </button>
                <span className="px-3 py-1 text-xs text-slate-500">{page} / {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Suiv.
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
