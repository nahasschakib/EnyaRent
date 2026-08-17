// src/app/api/v1/payments/intent/route.ts
// POST — Créer une intention de paiement DGateway
// Utilisé par : portail client (self-service) + dashboard gestionnaire (manuel)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  createPaymentIntent,
  isSimulationMode,
  type PaymentMethod,
  type PaymentCurrency,
} from "@/lib/payment/dgateway";

const createIntentSchema = z.object({
  bookingId: z.string().min(1, "La réservation est requise"),
  method: z.enum(["CMI", "MOBILE_MONEY", "VIREMENT"]),
  currency: z.enum(["MAD", "EUR", "USD"]).default("MAD"),
  // Pour paiement partiel (ex: juste la caution)
  customAmount: z.coerce.number().positive().optional(),
});

async function getOrgId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { bookingId, method, currency, customAmount } = parsed.data;

    // Récupérer la réservation avec toutes les infos nécessaires
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        asset: { select: { name: true, city: true } },
        customer: { select: { name: true, email: true, phone: true } },
        organization: { select: { name: true } },
        payments: {
          where: { status: "COMPLETED" },
          select: { amount: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérification accès — client (son email) ou gestionnaire (son org)
    const isClient = booking.customer.email === session.user.email;
    const orgId = await getOrgId(session.user.id);
    const isManager = orgId === booking.organizationId;

    if (!isClient && !isManager) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Calcul montant restant à payer
    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(booking.totalAmount) - totalPaid;

    if (remaining <= 0) {
      return NextResponse.json(
        { error: "Cette réservation est déjà entièrement payée" },
        { status: 400 }
      );
    }

    const amount = customAmount ?? remaining;

    if (amount > remaining) {
      return NextResponse.json(
        { error: `Le montant ne peut pas dépasser ${remaining} MAD (reste à payer)` },
        { status: 400 }
      );
    }

    // Créer l'enregistrement Payment en DB avant le paiement
    const payment = await db.payment.create({
      data: {
        organizationId: booking.organizationId,
        bookingId: booking.id,
        customerId: booking.customerId,
        amount,
        currency,
        method,
        status: "PENDING",
        type: "RENT",
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Créer l'intention de paiement DGateway (ou simulée)
    const intent = await createPaymentIntent({
      amount,
      currency: currency as PaymentCurrency,
      method: method as PaymentMethod,
      reference: payment.id,
      description: `${booking.organization.name} — ${booking.asset.name} — Réservation ${bookingId.slice(-8)}`,
      customerEmail: booking.customer.email ?? undefined,
      customerName: booking.customer.name,
      returnUrl: `${appUrl}/portal/pay/success?paymentId=${payment.id}&bookingId=${bookingId}`,
      cancelUrl: `${appUrl}/portal/pay/cancel?paymentId=${payment.id}&bookingId=${bookingId}`,
      metadata: {
        paymentId: payment.id,
        bookingId,
        organizationId: booking.organizationId,
      },
    });

    // Sauvegarder la référence DGateway dans le payment
    await db.payment.update({
      where: { id: payment.id },
      data: { dgatewayRef: intent.intentId },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: "PAYMENT_INTENT_CREATED",
        entity: "Payment",
        entityId: payment.id,
        newValue: JSON.parse(JSON.stringify({
          amount,
          currency,
          method,
          intentId: intent.intentId,
          isSimulation: isSimulationMode(),
        })),
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      intentId: intent.intentId,
      checkoutUrl: intent.checkoutUrl,
      amount,
      currency,
      method,
      remaining,
      isSimulation: isSimulationMode(),
      expiresAt: intent.expiresAt,
    });
  } catch (error) {
    console.error("[POST /api/v1/payments/intent]", error);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}