import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const sector = searchParams.get("sector") ?? "";
    const status = searchParams.get("status") ?? "";
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
    if (sector) where.assetType = { sector };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      db.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assetType: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      }),
      db.asset.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/assets", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      name, description, assetTypeId, status,
      pricePerNight, pricePerDay, pricePerMonth, deposit,
      address, city, latitude, longitude, metadata,
      immatriculation, vin, marque, modele, annee, couleur,
    } = body;

    if (!name || !assetTypeId) {
      return NextResponse.json({ error: "name and assetTypeId are required" }, { status: 400 });
    }

    const asset = await db.asset.create({
      data: {
        organizationId,
        name,
        description,
        assetTypeId,
        status: status ?? "AVAILABLE",
        pricePerNight: pricePerNight ? parseFloat(pricePerNight) : null,
        pricePerDay:   pricePerDay   ? parseFloat(pricePerDay)   : null,
        pricePerMonth: pricePerMonth ? parseFloat(pricePerMonth) : null,
        deposit:       deposit       ? parseFloat(deposit)       : null,
        address,
        city,
        latitude:  latitude  ? parseFloat(latitude)  : null,
        longitude: longitude ? parseFloat(longitude) : null,
        metadata:  metadata ?? {},
        immatriculation: immatriculation || null,
        vin:    vin    || null,
        marque: marque || null,
        modele: modele || null,
        annee:  annee  || null,
        couleur: couleur || null,
      },
      include: { assetType: true },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "CREATE",
        entity: "Asset",
        entityId: asset.id,
        newValue: asset as any,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/assets", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
