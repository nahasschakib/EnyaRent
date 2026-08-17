// src/app/api/v1/analytics/route.ts
// GET — KPIs globaux + breakdown par secteur pour le dashboard analytics

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getOrgId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const orgId = await getOrgId(session.user.id);
    if (!orgId) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") ?? "30"; // jours
    const sector = searchParams.get("sector"); // filtre optionnel

    const daysAgo = parseInt(period);
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysAgo);

    // ── Assets ──────────────────────────────────────────────────────────────
    const [totalAssets, assetsBySector, availableAssets] = await Promise.all([
      db.asset.count({ where: { organizationId: orgId } }),
      db.asset.groupBy({
        by: ["assetTypeId"],
        where: { organizationId: orgId },
        _count: { id: true },
      }),
      db.asset.count({ where: { organizationId: orgId, status: "AVAILABLE" } }),
    ]);

    // ── Bookings ─────────────────────────────────────────────────────────────
    const bookingWhere = {
      organizationId: orgId,
      createdAt: { gte: dateFrom },
      ...(sector && { asset: { assetType: { sector: sector as "REAL_ESTATE" | "VEHICLE" | "HOSPITALITY" | "EQUIPMENT" } } }),
    };

    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
    ] = await Promise.all([
      db.booking.count({ where: bookingWhere }),
      db.booking.count({ where: { ...bookingWhere, status: "ACTIVE" } }),
      db.booking.count({ where: { ...bookingWhere, status: "COMPLETED" } }),
      db.booking.count({ where: { ...bookingWhere, status: "CANCELLED" } }),
      db.booking.count({ where: { ...bookingWhere, status: "PENDING" } }),
    ]);

    // ── Revenus ──────────────────────────────────────────────────────────────
    const payments = await db.payment.findMany({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        type: "RENT",
        createdAt: { gte: dateFrom },
      },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Revenus par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await db.payment.findMany({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        type: "RENT",
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Grouper par mois
    const monthlyRevenue = revenueByMonth.reduce<Record<string, number>>((acc, p) => {
      const key = new Date(p.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      acc[key] = (acc[key] ?? 0) + Number(p.amount);
      return acc;
    }, {});

    const revenueChartData = Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      amount,
    }));

    // ── Impayés ──────────────────────────────────────────────────────────────
    const overduePayments = await db.payment.findMany({
      where: {
        organizationId: orgId,
        status: "PENDING",
        type: "RENT",
        createdAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // > 3 jours
      },
      select: { amount: true, customerId: true, bookingId: true, createdAt: true },
    });

    const totalOverdue = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // ── Tickets ouverts ───────────────────────────────────────────────────────
    const [openTickets, openMaintenance] = await Promise.all([
      db.supportTicket.count({ where: { organizationId: orgId, status: "OPEN" } }),
      db.maintenanceTicket.count({ where: { organizationId: orgId, status: "OPEN" } }),
    ]);

    // ── Taux d'occupation ─────────────────────────────────────────────────────
    // Actifs ce mois / total assets publiés
    const publishedAssets = await db.asset.count({
      where: { organizationId: orgId, isPublished: true },
    });

    const activeThisMonth = await db.booking.count({
      where: {
        organizationId: orgId,
        status: { in: ["ACTIVE", "COMPLETED"] },
        startDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });

    const occupancyRate = publishedAssets > 0
      ? Math.min(100, Math.round((activeThisMonth / publishedAssets) * 100))
      : 0;

    // ── Taux occupation par secteur ───────────────────────────────────────────
    const sectors = ["REAL_ESTATE", "VEHICLE", "HOSPITALITY", "EQUIPMENT"] as const;

    const occupancyBySector = await Promise.all(
      sectors.map(async (s) => {
        const [total, active] = await Promise.all([
          db.asset.count({ where: { organizationId: orgId, assetType: { sector: s } } }),
          db.booking.count({
            where: {
              organizationId: orgId,
              status: { in: ["ACTIVE", "CONFIRMED"] },
              asset: { assetType: { sector: s } },
            },
          }),
        ]);
        return {
          sector: s,
          total,
          active,
          rate: total > 0 ? Math.round((active / total) * 100) : 0,
        };
      })
    );

    // ── Bookings par secteur (graphique) ──────────────────────────────────────
    const bookingsBySector = await Promise.all(
      sectors.map(async (s) => {
        const count = await db.booking.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: dateFrom },
            asset: { assetType: { sector: s } },
          },
        });
        return { sector: s, count };
      })
    );

    // ── Clients ───────────────────────────────────────────────────────────────
    const [totalCustomers, newCustomers] = await Promise.all([
      db.customer.count({ where: { organizationId: orgId } }),
      db.customer.count({ where: { organizationId: orgId, createdAt: { gte: dateFrom } } }),
    ]);

    // ── ROI par asset (top 5) ─────────────────────────────────────────────────
    const topAssets = await db.asset.findMany({
      where: { organizationId: orgId },
      include: {
        assetType: { select: { name: true, sector: true } },
        bookings: {
          where: { status: "COMPLETED", createdAt: { gte: dateFrom } },
          select: { totalAmount: true },
        },
        maintenanceTickets: {
          where: { createdAt: { gte: dateFrom } },
          select: { cost: true },
        },
      },
      take: 10,
    });

    const assetROI = topAssets
      .map((asset) => {
        const revenue = asset.bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
        const costs = asset.maintenanceTickets.reduce((sum, m) => sum + Number(m.cost ?? 0), 0);
        return {
          id: asset.id,
          name: asset.name,
          sector: asset.assetType.sector,
          revenue,
          costs,
          roi: revenue - costs,
        };
      })
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // ── Réponse finale ────────────────────────────────────────────────────────
    return NextResponse.json({
      period: daysAgo,
      kpis: {
        totalAssets,
        availableAssets,
        occupancyRate,
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalRevenue,
        totalOverdue,
        openTickets: openTickets + openMaintenance,
        totalCustomers,
        newCustomers,
      },
      charts: {
        revenueByMonth: revenueChartData,
        bookingsBySector,
        occupancyBySector,
        assetROI,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/analytics]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}