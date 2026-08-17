// src/app/api/v1/bookings/[id]/checkin/route.ts
// POST — Enregistrer le check-in avec heure réelle et suppléments
// DELETE (via PUT status=checkout) — Enregistrer le check-out et calculer le solde final

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { calcHotelTotal, calcNights } from "@/app/lib/sectorLogic";

// ─── Schémas ──────────────────────────────────────────────────────────────────

const checkinSchema = z.object({
  actualCheckinTime: z.string(), // ISO datetime
  guestName: z.string().min(1, "Le nom du client est requis"),
  guestIdNumber: z.string().optional(), // CIN ou passeport
  roomKeyDelivered: z.boolean().default(true),
  supplements: z
    .array(
      z.object({
        code: z.string(),
        label: z.string(),
        amount: z.coerce.number().min(0),
        nights: z.coerce.number().optional(),
      })
    )
    .default([]),
  notes: z.string().optional(),
});

const checkoutSchema = z.object({
  actualCheckoutTime: z.string(), // ISO datetime
  roomCondition: z.enum(["CLEAN", "NEEDS_CLEANING", "DAMAGED"]).default("CLEAN"),
  additionalCharges: z
    .array(
      z.object({
        label: z.string(),
        amount: z.coerce.number().min(0),
      })
    )
    .default([]),
  notes: z.string().optional(),
});

// ─── POST /checkin ────────────────────────────────────────────────────────────

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
      include: {
        asset: { include: { assetType: true } },
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.asset.assetType.sector !== "HOSPITALITY") {
      return NextResponse.json(
        { error: "Cette route est réservée aux réservations hôtelières" },
        { status: 400 }
      );
    }

    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: `Le check-in nécessite une réservation CONFIRMED (actuel: ${booking.status})` },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Calcul du total avec suppléments
    const nights = calcNights(booking.startDate, booking.endDate);
    const pricePerNight = Number(booking.asset.pricePerNight ?? 0);

    const hotelTotal = calcHotelTotal(pricePerNight, nights, data.supplements);

    // Stocker les infos check-in dans les notes du booking
    const checkinInfo = {
      checkinAt: data.actualCheckinTime,
      guestName: data.guestName,
      guestIdNumber: data.guestIdNumber ?? null,
      roomKeyDelivered: data.roomKeyDelivered,
      supplements: data.supplements,
      hotelTotal,
      notes: data.notes ?? null,
    };

    // Passer le booking en ACTIVE + mettre à jour le montant total
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "ACTIVE",
        totalAmount: hotelTotal.total,
        notes: data.notes
          ? `[Check-in] ${data.notes}`
          : booking.notes,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: "HOTEL_CHECKIN",
        entity: "Booking",
        entityId: bookingId,
        newValue: JSON.parse(JSON.stringify(checkinInfo)),
      },
    });

    return NextResponse.json({
      booking: updatedBooking,
      checkinInfo,
      hotelTotal,
      message: `Check-in enregistré — ${data.guestName} — Chambre ${(booking.asset.metadata as Record<string, unknown>)?.roomNumber ?? ""}`,
    });
  } catch (error) {
    console.error("[POST /api/v1/bookings/[id]/checkin]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT /checkin — Check-out ─────────────────────────────────────────────────

export async function PUT(
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
        payments: { where: { status: "COMPLETED" } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Le check-out nécessite une réservation ACTIVE" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Calcul du solde restant
    const totalPaid = booking.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const additionalTotal = data.additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    const totalDue = Number(booking.totalAmount) + additionalTotal;
    const balance = totalDue - totalPaid;

    const checkoutInfo = {
      checkoutAt: data.actualCheckoutTime,
      roomCondition: data.roomCondition,
      additionalCharges: data.additionalCharges,
      additionalTotal,
      totalDue,
      totalPaid,
      balance,
      notes: data.notes ?? null,
    };

    // Créer un paiement supplémentaire si charges additionnelles
    if (additionalTotal > 0) {
      await db.payment.create({
        data: {
          organizationId: booking.organizationId,
          bookingId: booking.id,
          customerId: booking.customerId,
          amount: additionalTotal,
          currency: "MAD",
          status: "PENDING",
          type: "RENT",
        },
      });
    }

    // Passer le booking en COMPLETED
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "COMPLETED",
        endDate: new Date(data.actualCheckoutTime),
        totalAmount: totalDue,
        notes: data.notes
          ? `${booking.notes ?? ""}\n[Check-out] ${data.notes}`.trim()
          : booking.notes,
      },
    });

    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: "HOTEL_CHECKOUT",
        entity: "Booking",
        entityId: bookingId,
        newValue: JSON.parse(JSON.stringify(checkoutInfo)),
      },
    });

    return NextResponse.json({
      booking: updatedBooking,
      checkoutInfo,
      message:
        balance > 0
          ? `Check-out effectué — Solde restant à régler : ${balance} MAD`
          : "Check-out effectué — Solde soldé",
    });
  } catch (error) {
    console.error("[PUT /api/v1/bookings/[id]/checkin]", error);
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