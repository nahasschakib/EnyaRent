// src/app/api/v1/contracts/[id]/pdf/route.ts
// POST — Générer le PDF du contrat selon le secteur et l'uploader sur R2

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildBailResidentielDocument, type BailResidentielData } from "@/lib/pdf/templates/BailResidentiel";
import { buildContratVehiculeDocument, type ContratVehiculeData } from "@/lib/pdf/templates/ContratVehicule";
import { buildReservationDocument, type ReservationHoteliereData } from "@/lib/pdf/templates/ReservationHoteliere";
import { buildContratEquipementDocument, type ContratEquipementData } from "@/lib/pdf/templates/ContratEquipement";
// ─── R2 Upload helper ─────────────────────────────────────────────────────────

async function uploadToR2(buffer: Buffer, key: string): Promise<string> {
  // TODO: remplacer par l'upload R2 réel quand les credentials sont configurés
  const base64 = buffer.toString("base64");
  return `data:application/pdf;base64,${base64}`;
}

// ─── Builders de données par secteur ─────────────────────────────────────────

function buildBailData(contract: ContractWithRelations, meta: Record<string, unknown>): BailResidentielData {
  const booking = contract.booking;
  const asset = booking.asset;
  const customer = booking.customer;
  const org = contract.organization;

  return {
    contractId: contract.id,
    contractDate: contract.createdAt,
    bailleur: {
      name: org.name,
      address: asset.address ?? asset.city ?? "",
      phone: undefined,
      email: undefined,
    },
    locataire: {
      name: customer.name,
      cin: customer.cin ?? "—",
      address: customer.address ?? "—",
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
    },
    bien: {
      address: asset.address ?? "",
      city: asset.city ?? "",
      surface: Number(meta.surface ?? 0),
      rooms: Number(meta.rooms ?? 0),
      floor: meta.floor !== undefined ? Number(meta.floor) : undefined,
      furnished: Boolean(meta.furnished ?? false),
      description: asset.description ?? undefined,
    },
    finance: {
      loyerMensuel: Number(asset.pricePerMonth ?? 0),
      charges: Number(meta.charges ?? 0),
      caution: Number(asset.deposit ?? 0),
      currency: "MAD",
      dateDebut: booking.startDate,
      dateFin: booking.endDate,
      leaseType: (meta.leaseType as BailResidentielData["finance"]["leaseType"]) ?? "1YR",
      jourPaiement: 1,
    },
  };
}

function buildVehiculeData(contract: ContractWithRelations, meta: Record<string, unknown>): ContratVehiculeData {
  const booking = contract.booking;
  const asset = booking.asset;
  const customer = booking.customer;
  const org = contract.organization;
  const nbJours = Math.max(1, Math.round((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    contractId: contract.id,
    contractDate: contract.createdAt,
    loueur: { name: org.name, address: asset.address ?? asset.city ?? "" },
    locataire: {
      name: customer.name,
      cin: customer.cin ?? "—",
      address: customer.address ?? "—",
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
      licenseNumber: customer.licenseNumber ?? undefined,
    },
    vehicule: {
      marque: asset.marque ?? "—",
      modele: asset.modele ?? "—",
      annee: asset.annee ?? "—",
      immatriculation: asset.immatriculation ?? "—",
      couleur: asset.couleur ?? undefined,
      fuelType: String(meta.fuelType ?? "GASOLINE"),
      kmDepart: Number(meta.mileage ?? 0),
    },
    conditions: {
      dateDebut: booking.startDate,
      dateFin: booking.endDate,
      nbJours,
      prixParJour: Number(asset.pricePerDay ?? 0),
      kmInclus: Number(meta.kmForfait ?? 200),
      prixKmSup: Number(meta.extraKmRate ?? 0),
      caution: Number(booking.depositAmount ?? 0),
      totalEstime: Number(booking.totalAmount),
      currency: "MAD",
    },
  };
}

function buildHospitalityData(contract: ContractWithRelations, meta: Record<string, unknown>): ReservationHoteliereData {
  const booking = contract.booking;
  const asset = booking.asset;
  const customer = booking.customer;
  const org = contract.organization;
  const nights = Math.max(1, Math.round((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    contractId: contract.id,
    contractDate: contract.createdAt,
    hotel: {
      name: org.name,
      address: asset.address ?? "",
      city: asset.city ?? "",
    },
    client: {
      name: customer.name,
      cin: customer.cin ?? undefined,
      passport: customer.passportNumber ?? undefined,
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
    },
    chambre: {
      numero: String(meta.roomNumber ?? "—"),
      type: String(meta.roomType ?? "DOUBLE"),
      floor: meta.floor !== undefined ? Number(meta.floor) : undefined,
      capacity: Number(meta.capacity ?? 2),
      checkinTime: String(meta.checkinTime ?? "14:00"),
      checkoutTime: String(meta.checkoutTime ?? "11:00"),
    },
    sejour: {
      checkin: booking.startDate,
      checkout: booking.endDate,
      nights,
      pricePerNight: Number(asset.pricePerNight ?? 0),
      currency: "MAD",
      supplements: [],
      totalBase: Number(asset.pricePerNight ?? 0) * nights,
      totalSupplements: 0,
      total: Number(booking.totalAmount),
      caution: booking.depositAmount ? Number(booking.depositAmount) : undefined,
    },
  };
}

function buildEquipementData(contract: ContractWithRelations, meta: Record<string, unknown>): ContratEquipementData {
  const booking = contract.booking;
  const asset = booking.asset;
  const customer = booking.customer;
  const org = contract.organization;
  const rateUnit = String(meta.rateUnit ?? "DAY") as "HOUR" | "DAY" | "WEEK";
  const duree = Math.max(1, Math.round((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    contractId: contract.id,
    contractDate: contract.createdAt,
    loueur: { name: org.name, address: asset.address ?? asset.city ?? "" },
    locataire: {
      name: customer.name,
      cin: customer.cin ?? "—",
      address: customer.address ?? "—",
      phone: customer.phone ?? undefined,
      email: customer.email ?? undefined,
    },
    equipement: {
      name: asset.name,
      category: String(meta.category ?? "—"),
      serialNumber: meta.serialNumber ? String(meta.serialNumber) : undefined,
      condition: (meta.condition as ContratEquipementData["equipement"]["condition"]) ?? "GOOD",
      replacementValue: Number(meta.replacementValue ?? 0),
      description: asset.description ?? undefined,
    },
    conditions: {
      dateDebut: booking.startDate,
      dateFin: booking.endDate,
      duree,
      rateUnit,
      prixUnitaire: Number(asset.pricePerDay ?? 0),
      currency: "MAD",
      caution: Number(booking.depositAmount ?? 0),
      total: Number(booking.totalAmount),
      depositRequired: Boolean(meta.depositRequired ?? true),
      requiresInspection: Boolean(meta.requiresInspection ?? true),
    },
  };
}

// ─── Type helper ─────────────────────────────────────────────────────────────

type ContractWithRelations = NonNullable<Awaited<ReturnType<typeof fetchContract>>>;

async function fetchContract(contractId: string, orgId: string) {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      organization: true,
      booking: {
        include: {
          asset: { include: { assetType: true } },
          customer: true,
        },
      },
    },
  });

  if (!contract || contract.organizationId !== orgId) return null;
  return contract;
}

// ─── POST /api/v1/contracts/[id]/pdf ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
    }

    const contract = await fetchContract(contractId, user.organizationId);
    if (!contract) {
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    }

    const assetType = contract.booking.asset.assetType;
    if (!assetType) {
      return NextResponse.json({ error: "Type d'asset introuvable — impossible de déterminer le secteur" }, { status: 422 });
    }

    const sector = assetType.sector;
    const meta = (contract.booking.asset.metadata ?? {}) as Record<string, unknown>;

    // ── Générer le bon template selon le secteur ──
    let pdfBuffer: Buffer;
    let fileName: string;

    if (sector === "REAL_ESTATE") {
      const data = buildBailData(contract, meta);
      pdfBuffer = await renderToBuffer(buildBailResidentielDocument(data));
      fileName = `bail-residentiel-${contractId}.pdf`;
    } else if (sector === "VEHICLE") {
      const data = buildVehiculeData(contract, meta);
      pdfBuffer = await renderToBuffer(buildContratVehiculeDocument(data));
      fileName = `contrat-vehicule-${contractId}.pdf`;
    } else if (sector === "HOSPITALITY") {
      const data = buildHospitalityData(contract, meta);
      pdfBuffer = await renderToBuffer(buildReservationDocument(data));
      fileName = `reservation-hoteliere-${contractId}.pdf`;
    } else if (sector === "EQUIPMENT") {
      const data = buildEquipementData(contract, meta);
      pdfBuffer = await renderToBuffer(buildContratEquipementDocument(data));
      fileName = `contrat-equipement-${contractId}.pdf`;
    } else {
      return NextResponse.json({ error: `Secteur non supporté : ${sector}` }, { status: 400 });
    }

    // ── Upload sur R2 ──
    const r2Key = `contracts/${user.organizationId}/${contractId}/${fileName}`;
    const pdfUrl = await uploadToR2(pdfBuffer, r2Key);

    // ── Mettre à jour le contrat en BDD ──
    const updated = await db.contract.update({
      where: { id: contractId },
      data: { pdfUrl, status: "DRAFT" },
    });

    // ── Audit log ──
    await db.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: session.user.id,
        action: "GENERATE_CONTRACT_PDF",
        entity: "Contract",
        entityId: contractId,
        newValue: JSON.parse(JSON.stringify({ pdfUrl, sector })),
      },
    });

    return NextResponse.json({
      contract: updated,
      pdfUrl,
      message: `PDF généré avec succès pour le secteur ${sector}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[POST /api/v1/contracts/[id]/pdf]", message, stack);
    return NextResponse.json(
      { error: "Erreur lors de la génération PDF", detail: message },
      { status: 500 }
    );
  }
}
