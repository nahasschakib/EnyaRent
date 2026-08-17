import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { guard } from "@/lib/authz";

type Sector = "REAL_ESTATE" | "VEHICLE" | "HOSPITALITY" | "EQUIPMENT";
type AssetStatus = "AVAILABLE" | "RESERVED" | "MAINTENANCE" | "OUT_OF_SERVICE";

// ─── Schéma Zod ───────────────────────────────────────────────────────────────

const createAssetSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(1),
  address: z.string().optional(),
  assetTypeId: z.string().optional(),
  sector: z.enum(["REAL_ESTATE", "VEHICLE", "HOSPITALITY", "EQUIPMENT"]),
  status: z
    .enum(["AVAILABLE", "RESERVED", "MAINTENANCE", "OUT_OF_SERVICE"])
    .default("AVAILABLE"),

  pricePerNight: z.coerce.number().optional(),
  pricePerDay: z.coerce.number().optional(),
  pricePerMonth: z.coerce.number().optional(),
  deposit: z.coerce.number().optional(),

  // Champs véhicule directs (colonnes Prisma)
  immatriculation: z.string().optional(),
  vin: z.string().optional(),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.union([z.string(), z.number()]).transform(String).optional(),
  couleur: z.string().optional(),

  // Métadonnées sectorielles — objet JSON libre
  metadata: z.record(z.string(), z.unknown()).default({}),
});

type AssetInput = z.infer<typeof createAssetSchema>;

// ─── Validation sectorielle ───────────────────────────────────────────────────

function validateSectorData(data: AssetInput): string[] {
  const errors: string[] = [];
  const meta = data.metadata;

  switch (data.sector) {
    case "REAL_ESTATE":
      if (!meta.surface || Number(meta.surface) <= 0)
        errors.push("La surface est requise pour un bien immobilier");
      if (!meta.rooms || Number(meta.rooms) <= 0)
        errors.push("Le nombre de pièces est requis");
      if (!meta.leaseType) errors.push("Le type de bail est requis");
      if (!data.pricePerMonth || data.pricePerMonth <= 0)
        errors.push("Le loyer mensuel est requis pour un bien immobilier");
      break;

    case "VEHICLE":
      if (!data.marque) errors.push("La marque est requise");
      if (!data.modele) errors.push("Le modèle est requis");
      if (!data.immatriculation) errors.push("L'immatriculation est requise");
      if (!meta.fuelType) errors.push("Le type de carburant est requis");
      if (!data.pricePerDay || data.pricePerDay <= 0)
        errors.push("Le prix journalier est requis pour un véhicule");
      break;

    case "HOSPITALITY":
      if (!meta.roomNumber) errors.push("Le numéro de chambre est requis");
      if (!meta.roomType) errors.push("Le type de chambre est requis");
      if (!meta.capacity || Number(meta.capacity) <= 0)
        errors.push("La capacité est requise");
      if (!data.pricePerNight || data.pricePerNight <= 0)
        errors.push("Le prix par nuit est requis pour l'hôtellerie");
      break;

    case "EQUIPMENT":
      if (!meta.category) errors.push("La catégorie d'équipement est requise");
      if (!meta.condition) errors.push("L'état initial est requis");
      if (!meta.replacementValue || Number(meta.replacementValue) <= 0)
        errors.push("La valeur de remplacement est requise");
      if (!data.pricePerDay || data.pricePerDay <= 0)
        errors.push("Le prix journalier est requis pour les équipements");
      if (!data.deposit || data.deposit <= 0)
        errors.push("Une caution est fortement recommandée pour les équipements");
      break;
  }

  return errors;
}

const SECTOR_NAMES: Record<Sector, string> = {
  REAL_ESTATE: "Immobilier",
  VEHICLE: "Véhicule",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT: "Équipement",
};

// ─── GET /api/v1/assets ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const g = await guard(req, "asset:read");
    if (!g.ok) return g.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const sectorParam = searchParams.get("sector");
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const sector =
      sectorParam === "REAL_ESTATE" ||
      sectorParam === "VEHICLE" ||
      sectorParam === "HOSPITALITY" ||
      sectorParam === "EQUIPMENT"
        ? sectorParam
        : undefined;
    const status =
      statusParam === "AVAILABLE" ||
      statusParam === "RESERVED" ||
      statusParam === "MAINTENANCE" ||
      statusParam === "OUT_OF_SERVICE"
        ? statusParam
        : undefined;

    const where = {
      organizationId: g.organizationId,
      ...(sector && { assetType: { sector: sector as Sector } }),
      ...(status && { status: status as AssetStatus }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
          { marque: { contains: search, mode: "insensitive" as const } },
          { modele: { contains: search, mode: "insensitive" as const } },
          { immatriculation: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [assets, total] = await Promise.all([
      db.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          assetType: {
            select: { id: true, name: true, sector: true, icon: true },
          },
          photos: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { bookings: true } },
        },
      }),
      db.asset.count({ where }),
    ]);

    return NextResponse.json({
      data: assets,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/assets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST /api/v1/assets ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const g = await guard(req, "asset:create");
    if (!g.ok) return g.response;

    const body = await req.json();
    const parsed = createAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const sectorErrors = validateSectorData(data);
    if (sectorErrors.length > 0) {
      return NextResponse.json(
        { error: "Données sectorielles invalides", details: sectorErrors },
        { status: 422 }
      );
    }

    // Résolution du type d'asset, toujours borné à l'organisation du user
    let assetType = data.assetTypeId
      ? await db.assetType.findFirst({
          where: { id: data.assetTypeId, organizationId: g.organizationId },
        })
      : null;

    if (!assetType) {
      assetType =
        (await db.assetType.findFirst({
          where: { organizationId: g.organizationId, sector: data.sector },
        })) ??
        (await db.assetType.create({
          data: {
            organizationId: g.organizationId,
            name: SECTOR_NAMES[data.sector],
            sector: data.sector,
          },
        }));
    }

    const asset = await db.asset.create({
      data: {
        organizationId: g.organizationId,
        name: data.name,
        description: data.description,
        assetTypeId: assetType.id,
        status: data.status,
        city: data.city,
        address: data.address,
        pricePerNight: data.pricePerNight,
        pricePerDay: data.pricePerDay,
        pricePerMonth: data.pricePerMonth,
        deposit: data.deposit,
        immatriculation: data.immatriculation,
        vin: data.vin,
        marque: data.marque,
        modele: data.modele,
        annee: data.annee,
        couleur: data.couleur,
        metadata: JSON.parse(JSON.stringify(data.metadata)),
        isPublished: false,
      },
      include: { assetType: true },
    });

    await db.auditLog.create({
      data: {
        organizationId: g.organizationId,
        userId: g.userId,
        action: "CREATE_ASSET",
        entity: "Asset",
        entityId: asset.id,
        newValue: JSON.parse(
          JSON.stringify({ name: asset.name, sector: assetType.sector })
        ),
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/assets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}