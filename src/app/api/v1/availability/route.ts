import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    const organizationId = userFromDb.organizationId;

    const { searchParams } = new URL(req.url);
    const assetId   = searchParams.get("assetId");
    const fromParam = searchParams.get("from");
    const toParam   = searchParams.get("to");

    if (!assetId)
      return NextResponse.json({ error: "assetId requis" }, { status: 400 });

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

    const from = fromParam ? new Date(fromParam) : new Date();
    const to   = toParam   ? new Date(toParam)   : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [bookings, blocks] = await Promise.all([
      db.booking.findMany({
        where: {
          assetId,
          status: { notIn: ["CANCELLED"] },
          AND: [{ startDate: { lt: to } }, { endDate: { gt: from } }],
        },
        select: {
          id: true, startDate: true, endDate: true, status: true,
          customer: { select: { id: true, name: true } },
        },
        orderBy: { startDate: "asc" },
      }),
      db.availabilityBlock.findMany({
        where: {
          assetId,
          AND: [{ startDate: { lt: to } }, { endDate: { gt: from } }],
        },
        select: { id: true, startDate: true, endDate: true, reason: true },
        orderBy: { startDate: "asc" },
      }),
    ]);

    return NextResponse.json({ assetId, from, to, bookings, blocks });
  } catch (error) {
    console.error("GET /api/v1/availability", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
