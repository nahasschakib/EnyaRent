import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { event, payment: p } = payload;

    console.log(`[Webhook DGateway] ${event} — ref: ${p.reference}`);

    const payment = await db.payment.findUnique({
      where: { id: p.reference },
      include: {
        booking: {
          include: {
            payments: { where: { status: "COMPLETED" }, select: { amount: true } },
          },
        },
      },
    });

    if (!payment) return NextResponse.json({ received: true, warning: "Payment not found" });

    if (event === "payment.completed") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "COMPLETED", dgatewayRef: p.gateway_reference ?? p.id } });

      if (payment.booking) {
        const totalPaid = payment.booking.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(payment.amount);
        if (totalPaid >= Number(payment.booking.totalAmount) && payment.booking.status === "CONFIRMED") {
          await db.booking.update({ where: { id: payment.bookingId! }, data: { status: "ACTIVE" } });
        }

        // Générer quittance
        const count = await db.invoice.count({ where: { organizationId: payment.organizationId } });
        const number = `QUI-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
        const amount = Number(payment.amount);
        const tva = Math.round(amount * 0.2 * 100) / 100;
        const totalHT = amount - tva;

        await db.invoice.create({
          data: {
            organizationId: payment.organizationId,
            number,
            bookingId: payment.bookingId,
            customerId: payment.customerId,
            lines: JSON.parse(JSON.stringify([{ label: "Location", quantity: 1, unitPrice: totalHT, total: totalHT }, { label: "TVA 20%", quantity: 1, unitPrice: tva, total: tva }])),
            totalHT, tva, totalTTC: amount,
            currency: payment.currency,
            status: "PAID",
          },
        });
      }
    } else if (event === "payment.failed" || event === "payment.cancelled") {
      await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    console.error("[Webhook DGateway]", error);
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}
