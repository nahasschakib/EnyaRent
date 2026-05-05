import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    const orgs = await db.organization.findMany({
      where: {
        isPublic: true,
        ...(search
          ? { name: { contains: search, mode: "insensitive" } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        assets: {
          where: { isPublished: true },
          select: {
            id: true,
            city: true,
            assetType: { select: { sector: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = orgs.map((org) => {
      const sectors = [...new Set(org.assets.map((a) => a.assetType.sector))];
      const cities = [...new Set(org.assets.map((a) => a.city).filter(Boolean))];
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        logoUrl: org.logoUrl,
        coverUrl: org.coverUrl,
        assetCount: org.assets.length,
        sectors,
        cities,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/v1/public/agencies", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
