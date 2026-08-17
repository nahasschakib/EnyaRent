// src/app/api/v1/portal/dashboard/route.ts
// GET — Données du dashboard portail client
// Identifie le client via l'email du user connecté

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Trouver le customer lié à cet email dans n'importe quelle organisation
    const customer = await db.customer.findFirst({
      where: { email: session.user.email },
      include: { organization: true },
    });

    if (!customer) {
      // Pas encore client — retourner un état vide
      return NextResponse.json({
        customer: null,
        activeBookings: 0,
        pendingPayments: 0,
        totalPaid: 0,
        openTickets: 0,
        nextDueDate: null,
        nextDueAmount: null,
        recentBookings: [],
        recentPayments: [],
      });
    }

    // Récupérer toutes les données en parallèle
    const [
      bookings,
      payments,
      tickets,
    ] = await Promise.all([
      db.booking.findMany({
        where: { customerId: customer.id },
        include: {
          asset: { include: { assetType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.payment.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.supportTicket.count({
        where: {
          reportedById: session.user.id,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
      }),
    ]);

    // KPIs
    const activeBookings = bookings.filter((b) =>
      ["ACTIVE", "CONFIRMED"].includes(b.status)
    ).length;

    const pendingPayments = payments.filter((p) => p.status === "PENDING").length;

    const totalPaid = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Prochain paiement dû
    const nextPending = payments
      .filter((p) => p.status === "PENDING")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

    // Réservations récentes formatées
    const recentBookings = bookings.slice(0, 5).map((b) => ({
      id: b.id,
      assetName: b.asset.name,
      sector: b.asset.assetType.sector,
      startDate: b.startDate.toISOString(),
      endDate: b.endDate.toISOString(),
      status: b.status,
      totalAmount: Number(b.totalAmount),
    }));

    // Paiements récents formatés
    const recentPayments = payments.slice(0, 5).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      type: p.type,
    }));

    return NextResponse.json({
      customer: {
        name: customer.name,
        email: customer.email,
        score: customer.score,
      },
      activeBookings,
      pendingPayments,
      totalPaid,
      openTickets: tickets,
      nextDueDate: nextPending?.createdAt.toISOString() ?? null,
      nextDueAmount: nextPending ? Number(nextPending.amount) : null,
      recentBookings,
      recentPayments,
    });
  } catch (error) {
    console.error("[GET /api/v1/portal/dashboard]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}