"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PortalBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["portal-booking", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/portal/bookings/${id}/payment-info`);
      if (!res.ok) throw new Error("Introuvable");
      return res.json();
    },
  });

  if (isLoading) return <div className="p-8 text-slate-400">Chargement...</div>;
  if (!booking) return <div className="p-8 text-slate-400">Réservation introuvable</div>;

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING:   { label: "En attente",  color: "text-amber-600" },
    CONFIRMED: { label: "Confirmée",   color: "text-blue-600" },
    ACTIVE:    { label: "Active",      color: "text-orange-600" },
    COMPLETED: { label: "Terminée",    color: "text-green-600" },
    CANCELLED: { label: "Annulée",     color: "text-slate-400" },
  };

  const status = STATUS_LABELS[booking.status] ?? STATUS_LABELS.PENDING;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{booking.assetName}</h1>
        <p className="text-sm text-slate-400">{booking.assetCity}</p>
      </div>

      {/* Statut */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Statut</span>
          <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Période</span>
          <span className="text-sm font-medium text-slate-800">
            {new Date(booking.startDate).toLocaleDateString("fr-FR")} → {new Date(booking.endDate).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-sm font-bold text-slate-900">
            {booking.totalAmount.toLocaleString("fr-FR")} MAD
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Payé</span>
          <span className="text-sm font-semibold text-green-600">
            {booking.totalPaid.toLocaleString("fr-FR")} MAD
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-semibold text-slate-700">Reste à payer</span>
          <span className="text-lg font-bold text-orange-600">
            {booking.remaining.toLocaleString("fr-FR")} MAD
          </span>
        </div>
      </div>

      {/* Bouton paiement */}
      {booking.remaining > 0 && booking.status !== "CANCELLED" && (
        <Link
          href={`/portal/pay/${id}`}
          className="block w-full h-14 bg-orange-600 text-white rounded-xl text-base font-semibold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
        >
          💳 Payer {booking.remaining.toLocaleString("fr-FR")} MAD
        </Link>
      )}

      {booking.remaining <= 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-green-700">✅ Cette réservation est entièrement payée</p>
        </div>
      )}

      {/* Documents */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Documents</h2>
        <Link href="/portal/documents"
          className="text-sm text-orange-600 hover:underline flex items-center gap-1">
          📄 Voir mes documents →
        </Link>
      </div>
    </div>
  );
}
