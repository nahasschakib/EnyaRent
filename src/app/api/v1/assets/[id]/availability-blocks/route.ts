import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id: assetId } = await params;

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const { startDate, endDate, reason } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate et endDate sont requis" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }

    const block = await db.availabilityBlock.create({
      data: { assetId, startDate: start, endDate: end, reason: reason || null },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/assets/[id]/availability-blocks", error);
    return NextResponse.json({ error: "Échec de la création" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id: assetId } = await params;

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get("blockId");
    if (!blockId) return NextResponse.json({ error: "blockId requis" }, { status: 400 });

    const block = await db.availabilityBlock.findFirst({ where: { id: blockId, assetId } });
    if (!block) return NextResponse.json({ error: "Bloc non trouvé" }, { status: 404 });

    await db.availabilityBlock.delete({ where: { id: blockId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/assets/[id]/availability-blocks", error);
    return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 });
  }
}
