// src/lib/payment/dgateway.ts
// Couche d'abstraction DGateway
// MODE_SIMULATION=true → paiements simulés sans appel API réel
// MODE_SIMULATION=false → appels DGateway réels (nécessite DGATEWAY_API_KEY)

export type PaymentMethod = "CMI" | "MOBILE_MONEY" | "VIREMENT";
export type PaymentCurrency = "MAD" | "EUR" | "USD";

export interface CreatePaymentIntentParams {
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  reference: string;           // bookingId ou paymentId EnyaRent
  description: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  intentId: string;            // ID chez DGateway (ou simulé)
  checkoutUrl: string;         // URL de redirection client
  status: "PENDING" | "FAILED";
  reference: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  expiresAt: string;           // ISO datetime
}

export interface PaymentStatusResult {
  intentId: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
  paidAt?: string;
  amount: number;
  currency: PaymentCurrency;
  reference: string;
  gatewayRef?: string;         // Référence chez la banque/opérateur
}

// ─── Configuration ────────────────────────────────────────────────────────────

const IS_SIMULATION = !process.env.DGATEWAY_API_KEY || process.env.DGATEWAY_API_KEY === "";
const DGATEWAY_API_URL = process.env.DGATEWAY_API_URL ?? "https://dgatewayapi.desispay.com";
const DGATEWAY_API_KEY = process.env.DGATEWAY_API_KEY ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Mode simulation ──────────────────────────────────────────────────────────

function simulatePaymentIntent(params: CreatePaymentIntentParams): PaymentIntentResult {
  const intentId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  // En mode simulation, rediriger vers notre page de paiement simulé
  const checkoutUrl = `${APP_URL}/portal/pay/simulate?intentId=${intentId}&reference=${params.reference}&amount=${params.amount}&currency=${params.currency}&method=${params.method}&returnUrl=${encodeURIComponent(params.returnUrl)}`;

  console.log(`[DGateway SIMULATION] Paiement créé: ${intentId} — ${params.amount} ${params.currency} via ${params.method}`);

  return {
    intentId,
    checkoutUrl,
    status: "PENDING",
    reference: params.reference,
    amount: params.amount,
    currency: params.currency,
    method: params.method,
    expiresAt,
  };
}

// ─── Mode production DGateway ─────────────────────────────────────────────────

async function createRealPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
  const methodMap: Record<PaymentMethod, string> = {
    CMI: "card",
    MOBILE_MONEY: "mobile_money",
    VIREMENT: "bank_transfer",
  };

  const response = await fetch(`${DGATEWAY_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DGATEWAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      payment_method: methodMap[params.method],
      description: params.description,
      reference: params.reference,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DGateway API error: ${response.status} — ${error}`);
  }

  const data = await response.json();

  return {
    intentId: data.id,
    checkoutUrl: data.checkout_url,
    status: "PENDING",
    reference: params.reference,
    amount: params.amount,
    currency: params.currency,
    method: params.method,
    expiresAt: data.expires_at,
  };
}

// ─── Vérification statut paiement ─────────────────────────────────────────────

async function checkRealPaymentStatus(intentId: string): Promise<PaymentStatusResult> {
  const response = await fetch(`${DGATEWAY_API_URL}/payments/${intentId}`, {
    headers: { "Authorization": `Bearer ${DGATEWAY_API_KEY}` },
  });

  if (!response.ok) throw new Error(`DGateway status check failed: ${response.status}`);

  const data = await response.json();

  const statusMap: Record<string, PaymentStatusResult["status"]> = {
    pending: "PENDING",
    completed: "COMPLETED",
    success: "COMPLETED",
    failed: "FAILED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
  };

  return {
    intentId: data.id,
    status: statusMap[data.status] ?? "PENDING",
    paidAt: data.paid_at,
    amount: data.amount,
    currency: data.currency?.toUpperCase() as PaymentCurrency,
    reference: data.reference,
    gatewayRef: data.gateway_reference,
  };
}

// ─── API publique ─────────────────────────────────────────────────────────────

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  if (IS_SIMULATION) {
    return simulatePaymentIntent(params);
  }
  return createRealPaymentIntent(params);
}

export async function getPaymentStatus(intentId: string): Promise<PaymentStatusResult> {
  if (IS_SIMULATION || intentId.startsWith("sim_")) {
    // En simulation, retourner le statut depuis la DB EnyaRent
    // (mis à jour par la page /portal/pay/simulate)
    return {
      intentId,
      status: "PENDING",
      amount: 0,
      currency: "MAD",
      reference: "",
    };
  }
  return checkRealPaymentStatus(intentId);
}

export async function refundPayment(intentId: string, amount?: number): Promise<boolean> {
  if (IS_SIMULATION || intentId.startsWith("sim_")) {
    console.log(`[DGateway SIMULATION] Remboursement simulé: ${intentId}`);
    return true;
  }

  const response = await fetch(`${DGATEWAY_API_URL}/payments/${intentId}/refund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DGATEWAY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  return response.ok;
}

export function isSimulationMode(): boolean {
  return IS_SIMULATION;
}

// ─── Validation webhook DGateway ──────────────────────────────────────────────

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (IS_SIMULATION) return true;

  // HMAC-SHA256 validation
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expected === signature;
}