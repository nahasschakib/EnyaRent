import Link from "next/link";
import { db } from "@/lib/db";
import { Building2, Car, Hotel, Wrench, ArrowRight, MapPin, Package } from "lucide-react";

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "Immobilier",
  VEHICLE: "Véhicules",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT: "Équipements",
};

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "bg-indigo-50 text-indigo-700",
  VEHICLE: "bg-cyan-50 text-cyan-700",
  HOSPITALITY: "bg-violet-50 text-violet-700",
  EQUIPMENT: "bg-amber-50 text-amber-700",
};

const SECTOR_ICONS: Record<string, React.ElementType> = {
  REAL_ESTATE: Building2,
  VEHICLE: Car,
  HOSPITALITY: Hotel,
  EQUIPMENT: Wrench,
};

export const metadata = {
  title: "Agences — EnyaRent",
  description: "Trouvez une agence de location au Maroc — immobilier, véhicules, hôtellerie, équipements.",
};

export default async function AgenciesPage() {
  const orgs = await db.organization.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverUrl: true,
      assets: {
        where: { isPublished: true },
        select: {
          id: true,
          city: true,
          assetType: { select: { sector: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const agencies = orgs.map((org) => ({
    ...org,
    sectors: [...new Set(org.assets.map((a) => a.assetType.sector))],
    cities: [...new Set(org.assets.map((a) => a.city).filter(Boolean))] as string[],
    assetCount: org.assets.length,
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2">
          Annuaire
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
          Toutes les agences
        </h1>
        <p className="text-base text-slate-500 max-w-lg">
          Découvrez les agences de location disponibles sur EnyaRent — immobilier, véhicules, hôtellerie et équipements.
        </p>
      </div>

      {agencies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <Building2 size={24} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-700">Aucune agence disponible pour le moment</p>
          <p className="text-sm text-slate-400">Revenez bientôt !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <Link
              key={agency.id}
              href={`/agencies/${agency.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Cover */}
              <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                {agency.coverUrl ? (
                  <img
                    src={agency.coverUrl}
                    alt={agency.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)`,
                    }}
                  />
                )}
                {/* Logo */}
                <div className="absolute bottom-0 left-5 translate-y-1/2">
                  <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md bg-white flex items-center justify-center overflow-hidden">
                    {agency.logoUrl ? (
                      <img src={agency.logoUrl} alt={agency.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                        <span className="text-white text-base font-bold">
                          {agency.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5 pt-9">
                <h2 className="text-base font-semibold text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {agency.name}
                </h2>

                {agency.cities.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 truncate">
                      {agency.cities.slice(0, 2).join(" · ")}
                    </span>
                  </div>
                )}

                {agency.description && (
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {agency.description}
                  </p>
                )}

                {/* Sectors */}
                <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                  {agency.sectors.map((sector) => {
                    const Icon = SECTOR_ICONS[sector] ?? Building2;
                    return (
                      <span
                        key={sector}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${SECTOR_COLORS[sector] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        <Icon size={10} />
                        {SECTOR_LABELS[sector] ?? sector}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Package size={12} />
                    {agency.assetCount} asset{agency.assetCount !== 1 ? "s" : ""}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
                    Voir <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
