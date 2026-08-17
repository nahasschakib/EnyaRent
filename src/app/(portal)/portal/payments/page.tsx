"use client";
// src/app/(portal)/portal/payments/page.tsx

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Payment {
  id: string;
  bookingId: string;
  assetName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "En attente",  color: "#D97706", bg: "#FFFBEB" },
  PAID:      { label: "Payé",        color: "#16A34A", bg: "#F0FDF4" },
  FAILED:    { label: "Échoué",      color: "#DC2626", bg: "#FEF2F2" },
  REFUNDED:  { label: "Remboursé",   color: "#7C3AED", bg: "#F5F3FF" },
};

const TYPE_LABELS: Record<string, string> = {
  RENT:     "Loyer",
  DEPOSIT:  "Caution",
  EXTRA:    "Extra",
  REFUND:   "Remboursement",
};

export default function PortalPaymentsPage() {
  const { data, isLoading } = useQuery<{ data: Payment[] }>({
    queryKey: ["portal-payments"],
    queryFn: async () => {
      const res = await fetch("/api/v1/portal/payments");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const payments = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes paiements</h1>
        <p className="text-sm text-slate-400 mt-1">Historique de vos transactions</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-sm font-medium text-slate-700">Aucun paiement</p>
          <p className="text-xs text-slate-400 mt-1">Vos transactions apparaîtront ici</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {payments.map((payment) => {
            const status = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING;
            return (
              <div key={payment.id} className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                    💳
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{payment.assetName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {TYPE_LABELS[payment.type] ?? payment.type} ·{" "}
                      {new Date(payment.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {status.label}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {Number(payment.amount).toLocaleString("fr-FR")} {payment.currency}
                    </p>
                    {payment.status === "PENDING" && (
                      <Link
                        href={`/portal/pay/${payment.bookingId}`}
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Payer →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
