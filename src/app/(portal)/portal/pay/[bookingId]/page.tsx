"use client";
// src/app/(portal)/portal/pay/[bookingId]/page.tsx
// Page de paiement self-service pour le client

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

type PaymentMethod = "CMI" | "MOBILE_MONEY" | "VIREMENT";
type Currency = "MAD" | "EUR" | "USD";

interface BookingPaymentInfo {
  id: string;
  assetName: string;
  assetCity: string;
  sector: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  depositAmount: number | null;
  totalPaid: number;
  remaining: number;
  customerName: string;
  organizationName: string;
}

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; description: string; available: boolean }> = {
  CMI: {
    label: "Carte bancaire",
    icon: "💳",
    description: "Visa, Mastercard, CMI — Paiement sécurisé 3D Secure",
    available: true,
  },
  MOBILE_MONEY: {
    label: "Mobile Money",
    icon: "📱",
    description: "Orange Money, Inwi Money, Maroc Telecom",
    available: true,
  },
  VIREMENT: {
    label: "Virement bancaire",
    icon: "🏦",
    description: "Virement SEPA ou national — délai 1-3 jours ouvrés",
    available: true,
  },
};

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "MAD", label: "Dirham marocain", symbol: "MAD" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "Dollar US", symbol: "$" },
];

const SECTOR_ICONS: Record<string, string> = {
  REAL_ESTATE: "🏢", VEHICLE: "🚗", HOSPITALITY: "🏨", EQUIPMENT: "🔧",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CMI");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>("MAD");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  // Récupérer les infos de la réservation
  const { data: booking, isLoading } = useQuery<BookingPaymentInfo>({
    queryKey: ["booking-payment-info", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/portal/bookings/${bookingId}/payment-info`);
      if (!res.ok) throw new Error("Réservation introuvable");
      return res.json();
    },
  });

  // Mutation pour créer l'intention de paiement
  const createIntent = useMutation({
    mutationFn: async () => {
      const amount = useCustomAmount && customAmount
        ? parseFloat(customAmount)
        : undefined;

      const res = await fetch("/api/v1/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          method: selectedMethod,
          currency: selectedCurrency,
          ...(amount && { customAmount: amount }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur lors de la création du paiement");
      }

      return res.json() as Promise<{
        paymentId: string;
        checkoutUrl: string;
        amount: number;
        isSimulation: boolean;
      }>;
    },
    onSuccess: (data) => {
      // Rediriger vers la page de checkout DGateway (ou simulation)
      window.location.href = data.checkoutUrl;
    },
  });

  const payAmount = useCustomAmount && customAmount
    ? parseFloat(customAmount)
    : booking?.remaining ?? 0;

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-4xl mb-3">❌</p>
        <p className="text-sm font-medium text-slate-700">Réservation introuvable</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Payer ma réservation</h1>
      </div>

      {/* Récapitulatif réservation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
            {SECTOR_ICONS[booking.sector] ?? "🏠"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">{booking.assetName}</p>
            <p className="text-xs text-slate-400">{booking.assetCity}</p>
            <p className="text-xs text-slate-500 mt-1">
              {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-400 mb-1">Total</p>
            <p className="text-sm font-bold text-slate-900">
              {booking.totalAmount.toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Payé</p>
            <p className="text-sm font-bold text-green-600">
              {booking.totalPaid.toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Restant</p>
            <p className="text-sm font-bold text-orange-600">
              {booking.remaining.toLocaleString("fr-FR")} MAD
            </p>
          </div>
        </div>
      </div>

      {booking.remaining <= 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm font-semibold text-green-700">Cette réservation est entièrement payée</p>
        </div>
      ) : (
        <>
          {/* Méthode de paiement */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Choisissez votre méthode de paiement</h2>
            <div className="space-y-3">
              {(Object.entries(METHOD_CONFIG) as [PaymentMethod, typeof METHOD_CONFIG[PaymentMethod]][]).map(([method, config]) => (
                <button
                  key={method}
                  type="button"
                  disabled={!config.available}
                  onClick={() => setSelectedMethod(method)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    selectedMethod === method
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  } ${!config.available ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${selectedMethod === method ? "text-orange-700" : "text-slate-800"}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedMethod === method ? "border-orange-500 bg-orange-500" : "border-slate-300"
                  }`}>
                    {selectedMethod === method && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Devise */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Devise</h2>
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCurrency(c.value)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    selectedCurrency === c.value
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {c.symbol} {c.value}
                </button>
              ))}
            </div>
          </div>

          {/* Montant */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Montant à payer</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={!useCustomAmount}
                  onChange={() => setUseCustomAmount(false)}
                  className="accent-orange-500"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">Payer le solde complet</p>
                  <p className="text-xs text-orange-600 font-semibold">
                    {booking.remaining.toLocaleString("fr-FR")} {selectedCurrency}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  checked={useCustomAmount}
                  onChange={() => setUseCustomAmount(true)}
                  className="accent-orange-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Paiement partiel</p>
                  {useCustomAmount && (
                    <div className="mt-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono">
                        {selectedCurrency}
                      </span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={String(booking.remaining)}
                        max={booking.remaining}
                        min={1}
                        className="w-full h-9 pl-14 pr-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Informations sécurité */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="text-xs font-medium text-slate-700">Paiement 100% sécurisé</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Vos données bancaires ne transitent jamais par nos serveurs.
                Paiement traité par DGateway — certifié PCI DSS.
              </p>
            </div>
          </div>

          {/* Erreur */}
          {createIntent.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠️ {createIntent.error?.message}
            </div>
          )}

          {/* Bouton paiement */}
          <button
            type="button"
            onClick={() => createIntent.mutate()}
            disabled={createIntent.isPending || (useCustomAmount && (!customAmount || parseFloat(customAmount) <= 0))}
            className="w-full h-14 bg-orange-600 text-white rounded-xl text-base font-semibold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {createIntent.isPending ? (
              <>⏳ Préparation du paiement...</>
            ) : (
              <>
                {METHOD_CONFIG[selectedMethod].icon} Payer {payAmount > 0 ? `${payAmount.toLocaleString("fr-FR")} ${selectedCurrency}` : ""}
              </>
            )}
          </button>

          <p className="text-xs text-center text-slate-400">
            En cliquant sur `Payer`, vous acceptez nos conditions générales de location.
          </p>
        </>
      )}
    </div>
  );
}