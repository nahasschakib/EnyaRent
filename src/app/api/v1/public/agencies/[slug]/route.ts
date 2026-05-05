import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get("sector") ?? "";
    const city = searchParams.get("city") ?? "";
    const assetId = searchParams.get("assetId") ?? "";

    const org = await db.organization.findFirst({
      where: { slug, isPublic: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });
    }

    // Single asset detail request
    if (assetId) {
      const asset = await db.asset.findFirst({
        where: { id: assetId, organizationId: org.id, isPublished: true },
        include: {
          assetType: true,
          photos: { orderBy: { order: "asc" } },
          availabilityBlocks: {
            where: { endDate: { gte: new Date() } },
            orderBy: { startDate: "asc" },
          },
        },
      });
      if (!asset) {
        return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });
      }
      return NextResponse.json({ org, asset });
    }

    // Assets list with filters
    const assetWhere: Record<string, unknown> = {
      organizationId: org.id,
      isPublished: true,
    };
    if (sector) assetWhere.assetType = { sector };
    if (city) assetWhere.city = { contains: city, mode: "insensitive" };

    const assets = await db.asset.findMany({
      where: assetWhere,
      include: {
        assetType: { select: { name: true, sector: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ org, assets });
  } catch (error) {
    console.error("GET /api/v1/public/agencies/[slug]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
