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

    const assetTypes = await db.assetType.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: { _count: { select: { assets: true } } },
    });

    return NextResponse.json(assetTypes);
  } catch (error) {
    console.error("GET /api/v1/asset-types", error);
    return NextResponse.json({ error: "Failed to fetch asset types" }, { status: 500 });
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
    const { name, sector, icon } = body;

    if (!name || !sector) {
      return NextResponse.json({ error: "name and sector are required" }, { status: 400 });
    }

    const assetType = await db.assetType.create({
      data: { organizationId, name, sector, icon },
    });

    return NextResponse.json(assetType, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/asset-types", error);
    return NextResponse.json({ error: "Failed to create asset type" }, { status: 500 });
  }
}
