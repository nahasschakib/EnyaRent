import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id: bookingId } = await params;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        asset: { include: { assetType: { select: { sector: true } } } },
        customer: { select: { name: true, email: true } },
        organization: { select: { name: true } },
        payments: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const isClient = booking.customer.email === session.user.email;
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { organizationId: true } });
    const isManager = user?.organizationId === booking.organizationId;

    if (!isClient && !isManager) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      id: booking.id,
      assetName: booking.asset.name,
      assetCity: booking.asset.city ?? "",
      sector: booking.asset.assetType.sector,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      status: booking.status,
      totalAmount: Number(booking.totalAmount),
      depositAmount: booking.depositAmount ? Number(booking.depositAmount) : null,
      totalPaid,
      remaining: Math.max(0, Number(booking.totalAmount) - totalPaid),
      customerName: booking.customer.name,
      organizationName: booking.organization.name,
    });
  } catch (error) {
    console.error("[GET /api/v1/portal/bookings/[id]/payment-info]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
