// src/app/api/v1/assets/fleet/route.ts
// GET — Liste des véhicules avec alertes et booking actif

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getOrgId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orgId = await getOrgId(session.user.id);
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

    const assets = await db.asset.findMany({
      where: {
        organizationId: orgId,
        assetType: { sector: "VEHICLE" },
      },
      include: {
        assetType: { select: { name: true } },
        bookings: {
          where: { status: { in: ["ACTIVE", "CONFIRMED"] } },
          include: { customer: { select: { name: true } } },
          orderBy: { startDate: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    const data = assets.map((asset) => {
      const meta = (asset.metadata ?? {}) as Record<string, unknown>;
      const activeBooking = asset.bookings[0];
      return {
        id: asset.id,
        name: asset.name,
        city: asset.city ?? "",
        status: asset.status,
        immatriculation: asset.immatriculation,
        marque: asset.marque,
        modele: asset.modele,
        annee: asset.annee,
        couleur: asset.couleur,
        metadata: {
          fuelType: meta.fuelType as string | undefined,
          mileage: meta.mileage as number | undefined,
          insuranceExpiry: meta.insuranceExpiry as string | undefined,
          vignetteExpiry: meta.vignetteExpiry as string | undefined,
          extraKmRate: meta.extraKmRate as number | undefined,
        },
        activeBooking: activeBooking ? {
          id: activeBooking.id,
          customerName: activeBooking.customer.name,
          endDate: activeBooking.endDate.toISOString(),
        } : null,
      };
    });

    // Stats
    const stats = {
      total: data.length,
      available: data.filter((v) => v.status === "AVAILABLE").length,
      rented: data.filter((v) => v.status === "RESERVED" || v.activeBooking).length,
      maintenance: data.filter((v) => v.status === "MAINTENANCE").length,
      alertsCount: 0,
    };

    return NextResponse.json({ data, stats });
  } catch (error) {
    console.error("[GET /api/v1/assets/fleet]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}