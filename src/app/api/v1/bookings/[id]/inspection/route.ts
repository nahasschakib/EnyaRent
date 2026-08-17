// src/app/api/v1/bookings/[id]/inspection/route.ts
// POST — Créer un état des lieux (entrée ou sortie)
// GET  — Récupérer les inspections d'une réservation

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { calcDepositResolution, compareInspectionStates } from "@/app/lib/sectorLogic";


const inspectionSchema = z.object({
  type: z.enum(["ENTRY", "EXIT"]),
  condition: z.enum(["NEW", "GOOD", "FAIR", "POOR"]),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),         // URLs R2
  signedBy: z.object({
    name: z.string(),
    role: z.enum(["MANAGER", "CLIENT"]),
    signatureUrl: z.string().optional(),
  }),
  // Pour EXIT uniquement : déductions manuelles supplémentaires
  extraDeductions: z
    .array(
      z.object({
        reason: z.string(),
        amount: z.coerce.number().min(0),
      })
    )
    .optional(),
});

// ─── GET — Liste des inspections ──────────────────────────────────────────────

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
        contract: {
          include: { inspections: { orderBy: { createdAt: "asc" } } },
        },
        asset: { include: { assetType: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    const inspections = booking.contract?.inspections ?? [];
    const entry = inspections.find((i) => i.type === "ENTRY");
    const exit = inspections.find((i) => i.type === "EXIT");

    // Calcul automatique des déductions si les deux états existent
    let depositResolution = null;
    if (entry && exit && booking.depositAmount) {
      const assetMeta = booking.asset.metadata as Record<string, unknown>;
      const replacementValue = Number(assetMeta.replacementValue ?? 0);

      const entryPhotos = entry.photos as string[];
      const exitPhotos = exit.photos as string[];

      const entryCondition = (entry.signedBy as Record<string, unknown>)?.condition as string ?? "GOOD";
      const exitCondition = (exit.signedBy as Record<string, unknown>)?.condition as string ?? "GOOD";

      const autoDeductions = compareInspectionStates(
        entryCondition,
        exitCondition,
        replacementValue
      );

      depositResolution = calcDepositResolution(
        Number(booking.depositAmount),
        autoDeductions
      );
    }

    return NextResponse.json({ inspections, entry, exit, depositResolution });
  } catch (error) {
    console.error("[GET /api/v1/bookings/[id]/inspection]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST — Créer une inspection ──────────────────────────────────────────────

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
        contract: { include: { inspections: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (!booking.contract) {
      return NextResponse.json(
        { error: "Un contrat doit être créé avant de faire un état des lieux" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = inspectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Vérifier qu'on ne crée pas deux fois le même type
    const existing = booking.contract.inspections.find((i) => i.type === data.type);
    if (existing) {
      return NextResponse.json(
        { error: `Un état des lieux de type ${data.type} existe déjà pour ce contrat` },
        { status: 409 }
      );
    }

    // Créer l'inspection
    const inspection = await db.inspection.create({
      data: {
        contractId: booking.contract.id,
        type: data.type,
        notes: data.notes,
        photos: JSON.parse(JSON.stringify(data.photos)),
        signedBy: JSON.parse(JSON.stringify({
          ...data.signedBy,
          condition: data.condition,
          signedAt: new Date().toISOString(),
        })),
        signatureUrl: data.signedBy.signatureUrl,
      },
    });

    // Si c'est un EXIT : calculer automatiquement la résolution de caution
    let depositResolution = null;
    if (data.type === "EXIT" && booking.depositAmount) {
      const entryInspection = booking.contract.inspections.find((i) => i.type === "ENTRY");
      const assetMeta = booking.asset.metadata as Record<string, unknown>;
      const replacementValue = Number(assetMeta.replacementValue ?? 0);

      if (entryInspection) {
        const entryCondition =
          ((entryInspection.signedBy as Record<string, unknown>)?.condition as string) ?? "GOOD";

        const autoDeductions = compareInspectionStates(
          entryCondition,
          data.condition,
          replacementValue
        );

        const extraDeductions = data.extraDeductions ?? [];
        const allDeductions = [...autoDeductions, ...extraDeductions];

        depositResolution = calcDepositResolution(
          Number(booking.depositAmount),
          allDeductions
        );
      }
    }

    await db.auditLog.create({
      data: {
        organizationId: booking.organizationId,
        userId: session.user.id,
        action: `INSPECTION_${data.type}`,
        entity: "Inspection",
        entityId: inspection.id,
        newValue: JSON.parse(JSON.stringify({ bookingId, type: data.type, condition: data.condition })),
      },
    });

    return NextResponse.json(
      { inspection, depositResolution },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/v1/bookings/[id]/inspection]", error);
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