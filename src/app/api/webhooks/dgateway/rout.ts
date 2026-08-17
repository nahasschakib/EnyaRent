// src/app/api/webhooks/dgateway/route.ts
// POST — Webhook DGateway : confirmation paiement, échec, remboursement
// Cette route est appelée par DGateway après chaque événement de paiement

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateWebhookSignature } from "@/lib/payment/dgateway";

// Types d'événements DGateway
type DGatewayEvent =
  | "payment.completed"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.refunded"
  | "payment.pending";

interface DGatewayWebhookPayload {
  event: DGatewayEvent;
  payment: {
    id: string;           // intentId DGateway
    reference: string;    // paymentId EnyaRent
    amount: number;
    currency: string;
    status: string;
    paid_at?: string;
    gateway_reference?: string;
    method?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Vérification signature (ignorée en mode simulation)
    const signature = req.headers.get("x-dgateway-signature") ?? "";
    const webhookSecret = process.env.DGATEWAY_WEBHOOK_SECRET ?? "";

    if (webhookSecret && !validateWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error("[Webhook DGateway] Signature invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const payload: DGatewayWebhookPayload = JSON.parse(rawBody);
    const { event, payment: paymentData } = payload;

    console.log(`[Webhook DGateway] Événement: ${event} — Référence: ${paymentData.reference}`);

    // Trouver le payment EnyaRent par référence (= paymentId)
    const payment = await db.payment.findUnique({
      where: { id: paymentData.reference },
      include: {
        booking: {
          include: {
            asset: { select: { name: true } },
            customer: { select: { name: true, email: true } },
          },
        },
        organization: true,
      },
    });

    if (!payment) {
      console.error(`[Webhook DGateway] Payment introuvable: ${paymentData.reference}`);
      // Retourner 200 pour éviter les retentatives DGateway
      return NextResponse.json({ received: true, warning: "Payment not found" });
    }

    // Traitement selon l'événement
    switch (event) {
      case "payment.completed": {
        await handlePaymentCompleted(payment, paymentData);
        break;
      }
      case "payment.failed": {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        break;
      }
      case "payment.cancelled": {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        break;
      }
      case "payment.refunded": {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "REFUNDED" },
        });
        // Créer un payment de type DEPOSIT_REFUND
        await db.payment.create({
          data: {
            organizationId: payment.organizationId,
            bookingId: payment.bookingId,
            customerId: payment.customerId,
            amount: paymentData.amount,
            currency: payment.currency,
            status: "COMPLETED",
            type: "DEPOSIT_REFUND",
            method: payment.method,
          },
        });
        break;
      }
      default:
        console.log(`[Webhook DGateway] Événement ignoré: ${event}`);
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    console.error("[Webhook DGateway] Erreur:", error);
    // Ne jamais retourner 500 — DGateway retentera sinon
    return NextResponse.json({ received: true, error: "Processing error" }, { status: 200 });
  }
}

// ─── Handler paiement complété ────────────────────────────────────────────────

async function handlePaymentCompleted(
  payment: NonNullable<Awaited<ReturnType<typeof db.payment.findUnique>>>,
  paymentData: DGatewayWebhookPayload["payment"]
) {
  // 1. Mettre à jour le statut du payment
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "COMPLETED",
      dgatewayRef: paymentData.gateway_reference ?? paymentData.id,
    },
  });

  // 2. Vérifier si le booking est entièrement payé
  if (payment.bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: payment.bookingId },
      include: {
        payments: { where: { status: "COMPLETED" } },
      },
    });

    if (booking) {
      const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const isFullyPaid = totalPaid >= Number(booking.totalAmount);

      // Passer le booking en ACTIVE si entièrement payé et était CONFIRMED
      if (isFullyPaid && booking.status === "CONFIRMED") {
        await db.booking.update({
          where: { id: booking.id },
          data: { status: "ACTIVE" },
        });
      }

      // 3. Générer la quittance (invoice) automatiquement
      await generateReceipt(payment, booking, totalPaid);
    }
  }

  // 4. Créer une notification pour le client
  await db.notification.create({
    data: {
      userId: payment.customerId, // Note: c'est customerId, à mapper vers userId si besoin
      organizationId: payment.organizationId,
      type: "PAYMENT_CONFIRMED",
      title: "Paiement confirmé ✅",
      body: `Votre paiement de ${Number(payment.amount).toLocaleString("fr-FR")} ${payment.currency} a été confirmé.`,
      link: payment.bookingId ? `/portal/bookings/${payment.bookingId}` : "/portal/payments",
    },
  });

  // 5. Audit log
  await db.auditLog.create({
    data: {
      organizationId: payment.organizationId,
      userId: payment.customerId, // sera remplacé par un system user en prod
      action: "PAYMENT_COMPLETED",
      entity: "Payment",
      entityId: payment.id,
      newValue: JSON.parse(JSON.stringify({
        amount: Number(payment.amount),
        currency: payment.currency,
        gatewayRef: paymentData.gateway_reference,
      })),
    },
  });
}

// ─── Génération quittance automatique ─────────────────────────────────────────

async function generateReceipt(
  payment: { id: string; organizationId: string; customerId: string; bookingId: string | null; amount: unknown; currency: string },
  booking: { id: string; totalAmount: unknown },
  totalPaid: number
) {
  try {
    // Générer un numéro de quittance unique
    const count = await db.invoice.count({
      where: { organizationId: payment.organizationId },
    });
    const invoiceNumber = `QUI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const amount = Number(payment.amount);
    const tva = Math.round(amount * 0.2 * 100) / 100; // TVA 20% Maroc
    const totalHT = amount - tva;

    await db.invoice.create({
      data: {
        organizationId: payment.organizationId,
        number: invoiceNumber,
        bookingId: payment.bookingId,
        customerId: payment.customerId,
        lines: JSON.parse(JSON.stringify([
          {
            label: "Loyer / Location",
            quantity: 1,
            unitPrice: totalHT,
            total: totalHT,
          },
          {
            label: "TVA 20%",
            quantity: 1,
            unitPrice: tva,
            total: tva,
          },
        ])),
        totalHT,
        tva,
        totalTTC: amount,
        currency: payment.currency,
        status: "PAID",
      },
    });

    console.log(`[Webhook DGateway] Quittance générée: ${invoiceNumber}`);
  } catch (error) {
    console.error("[Webhook DGateway] Erreur génération quittance:", error);
    // Ne pas faire échouer le webhook pour ça
  }
}