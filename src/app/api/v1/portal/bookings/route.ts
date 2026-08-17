import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const customer = await db.customer.findFirst({ where: { email: session.user.email } });
    if (!customer) return NextResponse.json({ data: [] });

    const bookings = await db.booking.findMany({
      where: { customerId: customer.id },
      include: {
        asset: { include: { assetType: { select: { sector: true } } } },
        contract: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = bookings.map((b) => ({
      id: b.id,
      assetName: b.asset.name,
      assetCity: b.asset.city ?? "",
      sector: b.asset.assetType.sector,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      status: b.status,
      totalAmount: Number(b.totalAmount),
      depositAmount: b.depositAmount ? Number(b.depositAmount) : null,
      contractId: b.contract?.id ?? null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/portal/bookings]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}