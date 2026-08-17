// src/app/api/v1/bookings/[id]/schedule/route.ts
// GET — Récupérer l'échéancier mensuel d'un bail immobilier
// POST — Déclencher la révision de loyer IPC

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { generateMonthlySchedule, calcRentRevision } from "@/app/lib/sectorLogic";

// ─── GET — Échéancier ─────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const orgId = await getOrgId(session.user.id);

    const booking = await db.booking.findUnique({
      where: { id: bookingId, organizationId: orgId ?? undefined },
      include: {
        asset: { include: { assetType: true } },
        payments: {
          where: { status: "COMPLETED", type: "RENT" },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.asset.assetType.sector !== "REAL_ESTATE") {
      return NextResponse.json(
        { error: "Cette route est réservée aux baux immobiliers" },
        { status: 400 }
      );
    }

    const monthlyAmount = Number(booking.totalAmount);

    const schedule = generateMonthlySchedule(
      booking.startDate,
      booking.endDate,
      monthlyAmount,
      booking.payments.map((p) => ({
        createdAt: p.createdAt,
        amount: Number(p.amount),
      }))
    );

    const stats = {
      totalMonths: schedule.length,
      paidMonths: schedule.filter((s) => s.status === "PAID").length,
      lateMonths: schedule.filter((s) => s.status === "LATE").length,
      dueMonths: schedule.filter((s) => s.status === "DUE").length,
      totalPaid: schedule
        .filter((s) => s.status === "PAID")
        .reduce((sum, s) => sum + s.amount, 0),
      totalRemaining: schedule
        .filter((s) => s.status !== "PAID")
        .reduce((sum, s) => sum + s.amount, 0),
      totalLate: schedule
        .filter((s) => s.status === "LATE")
        .reduce((sum, s) => sum + s.amount, 0),
    };

    return NextResponse.json({ schedule, stats, booking });
  } catch (error) {
    console.error("[GET /api/v1/bookings/[id]/schedule]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST — Révision de loyer IPC ────────────────────────────────────────────

const revisionSchema = z.object({
  ipcReference: z.coerce.number().min(1, "L'IPC de référence est requis"),
  ipcNew: z.coerce.number().min(1, "Le nouvel IPC est requis"),
  applyFrom: z.string().optional(), // date ISO — par défaut: prochain mois
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const orgId = await getOrgId(session.user.id);

    const booking = await db.booking.findUnique({
      where: { id: bookingId, organizationId: orgId ?? undefined },
      include: { asset: { include: { assetType: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.asset.assetType.sector !== "REAL_ESTATE") {
      return NextResponse.json({ error: "Réservé aux baux immobiliers" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = revisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { ipcReference, ipcNew } = parsed.data;
    const currentRent = Number(booking.totalAmount);
    const revision = calcRentRevision(currentRent, ipcReference, ipcNew);

    // Mettre à jour le loyer mensuel du booking
    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: revision.newRent,
        notes: `${booking.notes ?? ""}\n[Révision IPC] ${currentRent} → ${revision.newRent} MAD (+${revision.increasePercent.toFixed(2)}%)`.trim(),
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: "RENT_REVISION_IPC",
        entity: "Booking",
        entityId: bookingId,
        oldValue: JSON.parse(JSON.stringify({ rent: currentRent })),
        newValue: JSON.parse(JSON.stringify({ rent: revision.newRent, ipcReference, ipcNew })),
      },
    });

    return NextResponse.json({
      booking: updated,
      revision,
      message: `Loyer révisé : ${currentRent} MAD → ${revision.newRent} MAD (+${revision.increasePercent.toFixed(2)}%)`,
    });
  } catch (error) {
    console.error("[POST /api/v1/bookings/[id]/schedule]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function getOrgId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}