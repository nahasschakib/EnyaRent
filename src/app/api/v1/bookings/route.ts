import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkConflict } from "@/lib/booking-conflicts";
import { sendBookingCreatedEmail } from "@/lib/emails";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    const organizationId = userFromDb.organizationId;

    const { searchParams } = new URL(req.url);
    const page       = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
    const limit      = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search     = searchParams.get("search")     ?? "";
    const status     = searchParams.get("status")     ?? "";
    const assetId    = searchParams.get("assetId")    ?? "";
    const customerId = searchParams.get("customerId") ?? "";
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (status)     where.status     = status;
    if (assetId)    where.assetId    = assetId;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { asset:    { name: { contains: search, mode: "insensitive" } } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      db.booking.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset:    { select: { id: true, name: true, assetType: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          contract: { select: { id: true, status: true } },
        },
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/bookings", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    const organizationId = userFromDb.organizationId;

    const body = await req.json();
    const { assetId, customerId, startDate, endDate, type, totalAmount, depositAmount, notes } = body;

    if (!assetId || !customerId || !startDate || !endDate || !type || totalAmount === undefined)
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });

    const start = new Date(startDate);
    const end   = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    if (end <= start)
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

    const customer = await db.customer.findFirst({ where: { id: customerId, organizationId } });
    if (!customer) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

    const { conflict, reason } = await checkConflict(assetId, start, end);
    if (conflict)
      return NextResponse.json({ error: "Conflit de dates", detail: reason }, { status: 409 });

    const booking = await db.booking.create({
      data: {
        organizationId,
        assetId,
        customerId,
        startDate:     start,
        endDate:       end,
        type,
        totalAmount:   parseFloat(totalAmount),
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
        notes:         notes ?? null,
      },
      include: {
        asset:    { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    if (booking.customer.email) {
      sendBookingCreatedEmail(booking.customer.email, {
        customerName: booking.customer.name,
        assetName:    booking.asset.name,
        startDate:    start,
        endDate:      end,
        totalAmount:  parseFloat(totalAmount),
        currency:     "MAD",
        bookingId:    booking.id,
      }).catch(console.error);
    }

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "CREATE",
        entity:   "Booking",
        entityId: booking.id,
        newValue: booking as any,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/bookings", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
