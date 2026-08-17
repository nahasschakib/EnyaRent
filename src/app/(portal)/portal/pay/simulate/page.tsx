"use client";
// src/app/(portal)/portal/pay/simulate/page.tsx
// Page de simulation DGateway — active uniquement en mode sans DGATEWAY_API_KEY
// Permet de tester le flux complet sans vrai compte DGateway

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function SimulatePage() {
  const params = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const intentId = params.get("intentId") ?? "";
  const reference = params.get("reference") ?? "";
  const amount = params.get("amount") ?? "0";
  const currency = params.get("currency") ?? "MAD";
  const method = params.get("method") ?? "CMI";
  const returnUrl = params.get("returnUrl") ?? "/portal";

  const METHOD_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    CMI: { label: "Carte bancaire CMI", icon: "💳", color: "#1E40AF" },
    MOBILE_MONEY: { label: "Mobile Money", icon: "📱", color: "#16A34A" },
    VIREMENT: { label: "Virement bancaire", icon: "🏦", color: "#D97706" },
  };

  const methodConfig = METHOD_LABELS[method] ?? METHOD_LABELS.CMI;

  // Simuler un paiement réussi
  const simulateSuccess = useMutation({
    mutationFn: async (gatewayRef: string) => {
      setProcessing(true);
      const res = await fetch("/api/webhooks/dgateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-simulation": "true",
        },
        body: JSON.stringify({
          event: "payment.completed",
          payment: {
            id: intentId,
            reference: reference,
            amount: parseFloat(amount),
            currency: currency.toLowerCase(),
            status: "completed",
            paid_at: new Date().toISOString(),
            gateway_reference: gatewayRef,
            method: method.toLowerCase(),
          },
        }),
      });
      if (!res.ok) throw new Error("Erreur simulation");
      return res.json();
    },
    onSuccess: () => {
      router.push(returnUrl);
    },
    onError: () => setProcessing(false),
  });

  // Simuler un paiement échoué
  const simulateFailure = useMutation({
    mutationFn: async () => {
      setProcessing(true);
      const res = await fetch("/api/webhooks/dgateway", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-simulation": "true" },
        body: JSON.stringify({
          event: "payment.failed",
          payment: {
            id: intentId,
            reference,
            amount: parseFloat(amount),
            currency: currency.toLowerCase(),
            status: "failed",
          },
        }),
      });
      if (!res.ok) throw new Error("Erreur simulation");
      return res.json();
    },
    onSuccess: () => {
      router.push(`/portal/pay/cancel?paymentId=${reference}`);
    },
    onError: () => setProcessing(false),
  });

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header simulation */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2">
          <span className="text-sm">🧪</span>
          <p className="text-xs font-medium text-amber-700">
            Mode simulation — Aucun vrai paiement n&apos;est effectué
          </p>
        </div>

        <div className="p-6">
          {/* Brand */}
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-orange-600">DGateway</p>
            <p className="text-xs text-slate-400">Plateforme de paiement sécurisée</p>
          </div>

          {/* Détails paiement */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{methodConfig.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{methodConfig.label}</p>
                <p className="text-xs text-slate-400">Paiement simulé EnyaRent</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-600">Montant à payer</span>
              <span className="text-xl font-bold text-slate-900">
                {parseFloat(amount).toLocaleString("fr-FR")} {currency}
              </span>
            </div>
          </div>

          {/* Formulaire simulé selon la méthode */}
          {method === "CMI" && (
            <div className="space-y-3 mb-6">
              <div>
                <label htmlFor="card-number" className="text-xs font-medium text-slate-600 block mb-1">Numéro de carte</label>
                <input
                  id="card-number"
                  type="text"
                  defaultValue="4111 1111 1111 1111"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                  title="Numéro de carte"
                  placeholder="4111 1111 1111 1111"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-expiration" className="text-xs font-medium text-slate-600 block mb-1">Expiration</label>
                  <input
                    id="card-expiration"
                    type="text"
                    defaultValue="12/28"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                    title="Date d'expiration"
                    placeholder="MM/AA"
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="card-cvv" className="text-xs font-medium text-slate-600 block mb-1">CVV</label>
                  <input
                    id="card-cvv"
                    type="text"
                    defaultValue="123"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                    title="Code CVV"
                    placeholder="123"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {method === "MOBILE_MONEY" && (
            <div className="mb-6">
              <label htmlFor="mobile-number" className="text-xs font-medium text-slate-600 block mb-1">Numéro de téléphone</label>
              <input
                id="mobile-number"
                type="text"
                defaultValue="+212 6XX XXX XXX"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                title="Numéro de téléphone"
                placeholder="+212 6XX XXX XXX"
                readOnly
              />
              <p className="text-xs text-slate-400 mt-1">Un SMS de confirmation sera envoyé</p>
            </div>
          )}

          {method === "VIREMENT" && (
            <div className="mb-6 bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Instructions de virement</p>
              <p className="text-xs text-blue-600">RIB : 007 780 0001234567890123</p>
              <p className="text-xs text-blue-600">Référence : {reference.slice(-8).toUpperCase()}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="space-y-2">
            <button
              onClick={() => simulateSuccess.mutate(`SIM-${Date.now()}`)}
              disabled={processing}
              className="w-full h-12 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing && simulateSuccess.isPending ? "⏳ Traitement..." : "✅ Simuler paiement réussi"}
            </button>
            <button
              onClick={() => simulateFailure.mutate()}
              disabled={processing}
              className="w-full h-10 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              ❌ Simuler un échec de paiement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}