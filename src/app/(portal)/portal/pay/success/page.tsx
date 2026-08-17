"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function PaySuccessPage() {
  const params = useSearchParams();
  const bookingId = params.get("bookingId") ?? "";
  const paymentId = params.get("paymentId") ?? "";

  const { data } = useQuery({
    queryKey: ["payment-success", paymentId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/payments/${paymentId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!paymentId,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement confirmé !</h1>
        <p className="text-sm text-slate-500 mb-6">
          Votre paiement a été traité avec succès. Une quittance vous sera envoyée par email.
        </p>

        {data && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Montant payé</span>
              <span className="text-sm font-bold text-green-600">
                {Number(data.amount).toLocaleString("fr-FR")} {data.currency}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-400">Référence</span>
              <span className="text-xs font-mono text-slate-600">{paymentId.slice(-12).toUpperCase()}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href={bookingId ? `/portal/bookings/${bookingId}` : "/portal/bookings"}
            className="block w-full h-11 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
          >
            Voir ma réservation
          </Link>
          <Link
            href="/portal/documents"
            className="block w-full h-11 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            📄 Télécharger la quittance
          </Link>
        </div>
      </div>
    </div>
  );
}
