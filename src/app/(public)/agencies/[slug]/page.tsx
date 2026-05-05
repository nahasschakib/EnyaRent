import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Building2, Car, Hotel, Wrench, MapPin, ArrowRight, Filter } from "lucide-react";
import type { Metadata } from "next";

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "Immobilier",
  VEHICLE: "Véhicules",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT: "Équipements",
};

const SECTOR_ICONS: Record<string, React.ElementType> = {
  REAL_ESTATE: Building2,
  VEHICLE: Car,
  HOSPITALITY: Hotel,
  EQUIPMENT: Wrench,
};

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  VEHICLE: "bg-cyan-50 text-cyan-700 border-cyan-200",
  HOSPITALITY: "bg-violet-50 text-violet-700 border-violet-200",
  EQUIPMENT: "bg-amber-50 text-amber-700 border-amber-200",
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sector?: string; city?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await db.organization.findFirst({ where: { slug, isPublic: true } });
  if (!org) return { title: "Agence introuvable" };
  return {
    title: `${org.name} — EnyaRent`,
    description: org.description ?? `Découvrez les locations de ${org.name} sur EnyaRent`,
  };
}

export default async function AgencyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sector, city } = await searchParams;

  const org = await db.organization.findFirst({
    where: { slug, isPublic: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
    },
  });

  if (!org) notFound();

  const assetWhere: Record<string, unknown> = {
    organizationId: org.id,
    isPublished: true,
  };
  if (sector) assetWhere.assetType = { sector };
  if (city) assetWhere.city = { contains: city, mode: "insensitive" };

  const today = new Date();

  const [assets, allAssets] = await Promise.all([
    db.asset.findMany({
      where: assetWhere,
      include: {
        assetType: { select: { name: true, sector: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
        bookings: {
          where: {
            status: { in: ["ACTIVE", "CONFIRMED"] },
            startDate: { lte: today },
            endDate: { gte: today },
          },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.asset.findMany({
      where: { organizationId: org.id, isPublished: true },
      select: { city: true, assetType: { select: { sector: true } } },
    }),
  ]);

  const sectors = [...new Set(allAssets.map((a) => a.assetType.sector))];
  const cities = [...new Set(allAssets.map((a) => a.city).filter(Boolean))] as string[];

  return (
    <div>
      {/* Hero */}
      <div className="relative h-52 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
        {org.coverUrl && (
          <img src={org.coverUrl} alt={org.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-[1200px] px-6">
        {/* Org identity */}
        <div className="flex items-end gap-5 -mt-8 mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="mb-1">
            <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
            {org.description && (
              <p className="text-sm text-slate-500 mt-0.5">{org.description}</p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
            <Filter size={14} />
            Filtrer :
          </div>

          {/* Sector filters */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/agencies/${slug}${city ? `?city=${city}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                !sector
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              Tous
            </Link>
            {sectors.map((s) => {
              const Icon = SECTOR_ICONS[s] ?? Building2;
              const params = new URLSearchParams();
              if (s !== sector) params.set("sector", s);
              if (city) params.set("city", city);
              const href = `/agencies/${slug}${params.toString() ? `?${params}` : ""}`;
              return (
                <Link
                  key={s}
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sector === s
                      ? `${SECTOR_COLORS[s] ?? "bg-slate-100 text-slate-600 border-slate-200"}`
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Icon size={11} />
                  {SECTOR_LABELS[s] ?? s}
                </Link>
              );
            })}
          </div>

          {/* City filter */}
          {cities.length > 1 && (
            <div className="flex flex-wrap gap-2 border-l border-slate-200 pl-3">
              {cities.map((c) => {
                const params = new URLSearchParams();
                if (sector) params.set("sector", sector);
                if (c !== city) params.set("city", c);
                const href = `/agencies/${slug}${params.toString() ? `?${params}` : ""}`;
                return (
                  <Link
                    key={c}
                    href={href}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      city === c
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <MapPin size={10} />
                    {c}
                  </Link>
                );
              })}
            </div>
          )}

          <span className="ml-auto text-sm text-slate-400 shrink-0">
            {assets.length} asset{assets.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Asset grid */}
        {assets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 rounded-2xl mb-12">
            <Building2 size={32} className="text-slate-300" />
            <p className="text-sm text-slate-500">Aucun asset disponible avec ces filtres</p>
            <Link
              href={`/agencies/${slug}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Réinitialiser les filtres
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {assets.map((asset) => {
              const SectorIcon = SECTOR_ICONS[asset.assetType.sector] ?? Building2;
              const price =
                asset.pricePerDay ??
                asset.pricePerNight ??
                asset.pricePerMonth;
              const priceLabel =
                asset.pricePerDay
                  ? "/jour"
                  : asset.pricePerNight
                  ? "/nuit"
                  : asset.pricePerMonth
                  ? "/mois"
                  : "";

              const isAvailable =
                asset.status === "AVAILABLE" && asset.bookings.length === 0;
              const isMaintenance =
                asset.status === "MAINTENANCE" || asset.status === "OUT_OF_SERVICE";

              const vehicleInfo = [asset.marque, asset.modele].filter(Boolean).join(" ");

              return (
                <Link
                  key={asset.id}
                  href={`/agencies/${slug}/${asset.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Photo */}
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {asset.photos[0] ? (
                      <img
                        src={asset.photos[0].url}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <SectorIcon size={36} className="text-slate-300" />
                      </div>
                    )}
                    {/* Sector badge */}
                    <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${SECTOR_COLORS[asset.assetType.sector] ?? "bg-white text-slate-600 border-slate-200"}`}>
                      <SectorIcon size={9} />
                      {SECTOR_LABELS[asset.assetType.sector] ?? asset.assetType.name}
                    </div>
                    {/* Availability badge */}
                    <div className={`absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${
                      isMaintenance
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isMaintenance ? "bg-amber-500" : isAvailable ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {isMaintenance ? "Maintenance" : isAvailable ? "Disponible" : "Indisponible"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-0.5 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {asset.name}
                    </h3>

                    {/* Vehicle info */}
                    {(vehicleInfo || asset.immatriculation) && (
                      <p className="text-xs text-slate-400 mb-1.5 font-mono">
                        {[vehicleInfo, asset.immatriculation].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {asset.city && (
                      <div className="flex items-center gap-1 mb-3">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500">{asset.city}</span>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                      {price ? (
                        <div>
                          <span className="text-base font-bold text-slate-900">
                            {Number(price).toLocaleString("fr-MA")} MAD
                          </span>
                          <span className="text-xs text-slate-400 ml-1">{priceLabel}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Prix sur demande</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
                        Réserver <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
