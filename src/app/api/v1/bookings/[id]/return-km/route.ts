// src/app/api/v1/bookings/[id]/return-km/route.ts
// PUT — Enregistrer le km retour d'un véhicule et calculer les frais de dépassement

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { calcKmReturn, checkVehicleAlerts } from "@/app/lib/sectorLogic";

const returnKmSchema = z.object({
  kmRetour: z.coerce.number().min(0, "Le kilométrage retour est requis"),
  kmForfait: z.coerce.number().min(0).default(0), // km inclus dans le contrat
  notes: z.string().optional(),
});

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

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        asset: {
          include: { assetType: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Isolation multi-tenant
    if (booking.organizationId !== (await getOrgId(session.user.id))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Vérifier que c'est bien un véhicule
    if (booking.asset.assetType.sector !== "VEHICLE") {
      return NextResponse.json(
        { error: "Cette route est réservée aux véhicules" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = returnKmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { kmRetour, kmForfait, notes } = parsed.data;

    // Récupérer le km de départ depuis les metadata du booking ou de l'asset
    const assetMeta = booking.asset.metadata as Record<string, unknown>;
    const kmDepart = Number(assetMeta.mileage ?? 0);
    const extraKmRate = Number(assetMeta.extraKmRate ?? 0);

    if (kmRetour < kmDepart) {
      return NextResponse.json(
        { error: `Le km retour (${kmRetour}) ne peut pas être inférieur au km départ (${kmDepart})` },
        { status: 422 }
      );
    }

    // Calcul dépassement
    const result = calcKmReturn(kmDepart, kmRetour, kmForfait, extraKmRate);

    // Alertes véhicule
    const alerts = checkVehicleAlerts(assetMeta);

    // Mettre à jour les metadata du booking avec les infos km
    const updatedBookingMeta = {
      kmDepart,
      kmRetour,
      kmParcourus: result.kmParcourus,
      kmForfait: result.kmForfait,
      kmDepassement: result.kmDepassement,
      fraisDepassement: result.fraisDepassement,
      returnNotes: notes ?? null,
    };

    // Mettre à jour l'asset avec le nouveau kilométrage
    await db.asset.update({
      where: { id: booking.assetId },
      data: {
        metadata: JSON.parse(JSON.stringify({ ...assetMeta, mileage: kmRetour })),
      },
    });

    // Mettre à jour le booking
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        notes: notes
          ? `${booking.notes ?? ""}\n[Retour km] ${notes}`.trim()
          : booking.notes,
        // Ajouter les frais de dépassement au montant total si applicable
        totalAmount: result.fraisDepassement > 0
          ? { increment: result.fraisDepassement }
          : undefined,
      },
    });

    // Créer un paiement supplémentaire si dépassement kilométrique
    if (result.fraisDepassement > 0) {
      await db.payment.create({
        data: {
          organizationId: booking.organizationId,
          bookingId: booking.id,
          customerId: booking.customerId,
          amount: result.fraisDepassement,
          currency: "MAD",
          status: "PENDING",
          type: "RENT",
          method: null,
        },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: "VEHICLE_RETURN_KM",
        entity: "Booking",
        entityId: bookingId,
        newValue: JSON.parse(JSON.stringify(updatedBookingMeta)),
      },
    });

    return NextResponse.json({
      booking: updatedBooking,
      kmResult: result,
      alerts,
      message:
        result.fraisDepassement > 0
          ? `Dépassement de ${result.kmDepassement} km — frais supplémentaires : ${result.fraisDepassement} MAD`
          : "Retour dans le forfait kilométrique",
    });
  } catch (error) {
    console.error("[PUT /api/v1/bookings/[id]/return-km]", error);
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