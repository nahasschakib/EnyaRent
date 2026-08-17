"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PayCancelPage() {
  const params = useSearchParams();
  const bookingId = params.get("bookingId") ?? "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Paiement annulé</h1>
        <p className="text-sm text-slate-500 mb-6">
          Votre paiement n&apos;a pas abouti. Aucun montant n&apos;a été débité.
          Vous pouvez réessayer à tout moment.
        </p>
        <div className="space-y-2">
          <Link
            href={bookingId ? `/portal/pay/${bookingId}` : "/portal"}
            className="block w-full h-11 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
          >
            Réessayer le paiement
          </Link>
          <Link
            href="/portal"
            className="block w-full h-11 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Retour à mon espace
          </Link>
        </div>
      </div>
    </div>
  );
}
