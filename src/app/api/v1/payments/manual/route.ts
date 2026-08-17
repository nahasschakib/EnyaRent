import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const manualPaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  method: z.enum(["CMI", "MOBILE_MONEY", "VIREMENT", "ESPECES", "CHEQUE"]),
  type: z.enum(["RENT", "DEPOSIT", "DEPOSIT_REFUND"]).default("RENT"),
  currency: z.enum(["MAD", "EUR", "USD"]).default("MAD"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    const orgId = user?.organizationId;
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

    const body = await req.json();
    const parsed = manualPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: data.bookingId, organizationId: orgId },
      include: {
        payments: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(booking.totalAmount) - totalPaid;

    if (data.amount > remaining + 0.01) {
      return NextResponse.json(
        { error: `Montant supérieur au reste à payer (${remaining} MAD)` },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        organizationId: orgId,
        bookingId: data.bookingId,
        customerId: booking.customerId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: "COMPLETED",
        type: data.type,
        dgatewayRef: data.reference ?? null,
      },
    });

    const newTotalPaid = totalPaid + data.amount;
    if (newTotalPaid >= Number(booking.totalAmount) && booking.status === "CONFIRMED") {
      await db.booking.update({
        where: { id: data.bookingId },
        data: { status: "ACTIVE" },
      });
    }

    const count = await db.invoice.count({ where: { organizationId: orgId } });
    const invoiceNumber = `QUI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const tva = Math.round(data.amount * 0.2 * 100) / 100;
    const totalHT = data.amount - tva;

    await db.invoice.create({
      data: {
        organizationId: orgId,
        number: invoiceNumber,
        bookingId: data.bookingId,
        customerId: booking.customerId,
        lines: JSON.parse(JSON.stringify([
          { label: data.type === "RENT" ? "Loyer / Location" : "Caution", quantity: 1, unitPrice: totalHT, total: totalHT },
          { label: "TVA 20%", quantity: 1, unitPrice: tva, total: tva },
        ])),
        totalHT,
        tva,
        totalTTC: data.amount,
        currency: data.currency,
        status: "PAID",
        pdfUrl: null,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        action: "MANUAL_PAYMENT_RECORDED",
        entity: "Payment",
        entityId: payment.id,
        newValue: JSON.parse(JSON.stringify({
          amount: data.amount,
          method: data.method,
          type: data.type,
          reference: data.reference,
          notes: data.notes,
        })),
      },
    });

    return NextResponse.json({ payment, invoiceNumber }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/payments/manual]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
