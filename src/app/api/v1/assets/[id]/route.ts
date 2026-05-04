import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const asset = await db.asset.findFirst({
      where: { id, organizationId },
      include: {
        assetType: true,
        photos: { orderBy: { order: "asc" } },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { startDate: "asc" },
          include: { customer: true },
        },
        availabilityBlocks: {
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: "asc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("GET /api/v1/assets/[id]", error);
    return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const existing = await db.asset.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, assetTypeId, status, pricePerNight, pricePerDay, pricePerMonth, deposit, address, city, latitude, longitude, metadata } = body;

    const updated = await db.asset.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(assetTypeId !== undefined && { assetTypeId }),
        ...(status !== undefined && { status }),
        ...(pricePerNight !== undefined && { pricePerNight: pricePerNight ? parseFloat(pricePerNight) : null }),
        ...(pricePerDay !== undefined && { pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null }),
        ...(pricePerMonth !== undefined && { pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null }),
        ...(deposit !== undefined && { deposit: deposit ? parseFloat(deposit) : null }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(metadata !== undefined && { metadata }),
      },
      include: { assetType: true },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "Asset",
        entityId: id,
        oldValue: existing as any,
        newValue: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/v1/assets/[id]", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const existing = await db.asset.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await db.asset.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "DELETE",
        entity: "Asset",
        entityId: id,
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/assets/[id]", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
