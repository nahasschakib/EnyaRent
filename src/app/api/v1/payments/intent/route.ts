import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createPaymentIntent, isSimulationMode } from "@/lib/payment/dgateway";

const schema = z.object({
  bookingId: z.string().min(1),
  method: z.enum(["CMI", "MOBILE_MONEY", "VIREMENT"]),
  currency: z.enum(["MAD", "EUR", "USD"]).default("MAD"),
  customAmount: z.coerce.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 });

    const { bookingId, method, currency, customAmount } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        asset: { select: { name: true, city: true } },
        customer: { select: { name: true, email: true } },
        organization: { select: { name: true } },
        payments: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const isClient = booking.customer.email === session.user.email;
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { organizationId: true } });
    const isManager = user?.organizationId === booking.organizationId;
    if (!isClient && !isManager) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(booking.totalAmount) - totalPaid;
    if (remaining <= 0) return NextResponse.json({ error: "Réservation déjà payée" }, { status: 400 });

    const amount = customAmount ?? remaining;

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

    const intent = await createPaymentIntent({
      amount,
      currency: currency as "MAD" | "EUR" | "USD",
      method: method as "CMI" | "MOBILE_MONEY" | "VIREMENT",
      reference: payment.id,
      description: `${booking.organization.name} — ${booking.asset.name}`,
      customerEmail: booking.customer.email ?? undefined,
      customerName: booking.customer.name,
      returnUrl: `${appUrl}/portal/pay/success?paymentId=${payment.id}&bookingId=${bookingId}`,
      cancelUrl: `${appUrl}/portal/pay/cancel?paymentId=${payment.id}&bookingId=${bookingId}`,
      metadata: { paymentId: payment.id, bookingId, organizationId: booking.organizationId },
    });

    await db.payment.update({ where: { id: payment.id }, data: { dgatewayRef: intent.intentId } });

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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
