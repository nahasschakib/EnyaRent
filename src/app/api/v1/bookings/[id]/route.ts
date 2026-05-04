import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkConflict } from "@/lib/booking-conflicts";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });

    const { id } = await params;
    const booking = await db.booking.findFirst({
      where: { id, organizationId: userFromDb.organizationId },
      include: {
        asset:    { include: { assetType: true, photos: { take: 1 } } },
        customer: { include: { guarantor: true } },
        contract: true,
        payments: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking introuvable" }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    console.error("GET /api/v1/bookings/[id]", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const existing = await db.booking.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Booking introuvable" }, { status: 404 });

    const body = await req.json();
    const { status, startDate, endDate, totalAmount, depositAmount, notes } = body;

    if (startDate || endDate) {
      const start = new Date(startDate ?? existing.startDate);
      const end   = new Date(endDate   ?? existing.endDate);
      if (end <= start)
        return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
      const { conflict, reason } = await checkConflict(existing.assetId, start, end, id);
      if (conflict)
        return NextResponse.json({ error: "Conflit de dates", detail: reason }, { status: 409 });
    }

    const updated = await db.booking.update({
      where: { id },
      data: {
        ...(status        !== undefined && { status }),
        ...(startDate     !== undefined && { startDate: new Date(startDate) }),
        ...(endDate       !== undefined && { endDate:   new Date(endDate) }),
        ...(totalAmount   !== undefined && { totalAmount:   parseFloat(totalAmount) }),
        ...(depositAmount !== undefined && { depositAmount: depositAmount ? parseFloat(depositAmount) : null }),
        ...(notes         !== undefined && { notes }),
      },
      include: {
        asset:    { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "UPDATE",
        entity:   "Booking",
        entityId: id,
        oldValue: existing as any,
        newValue: updated  as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/v1/bookings/[id]", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const existing = await db.booking.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Booking introuvable" }, { status: 404 });

    const cancelled = await db.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "CANCEL",
        entity:   "Booking",
        entityId: id,
        oldValue: existing  as any,
        newValue: cancelled as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/bookings/[id]", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
