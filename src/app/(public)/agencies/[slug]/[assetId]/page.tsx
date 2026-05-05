import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Building2, Car, Hotel, Wrench, MapPin, ChevronRight, Shield, Calendar } from "lucide-react";
import { BookingForm } from "./booking-form";
import type { Metadata } from "next";

// ── Availability calendar (server-rendered, 3 months) ─────────────

function AvailabilityCalendar({
  blocks,
}: {
  blocks: { startDate: Date | string; endDate: Date | string }[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedBlocks = blocks.map((b) => ({
    start: new Date(b.startDate),
    end: new Date(b.endDate),
  }));

  function isBlocked(date: Date): boolean {
    return parsedBlocks.some((b) => date >= b.start && date < b.end);
  }

  const months = [0, 1, 2].map((offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return d;
  });

  const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {months.map((monthStart) => {
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0

        const cells: (Date | null)[] = Array(firstDow).fill(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

        const monthLabel = monthStart.toLocaleDateString("fr-MA", {
          month: "long",
          year: "numeric",
        });

        return (
          <div key={`${year}-${month}`}>
            <p className="text-xs font-semibold text-slate-700 mb-2 capitalize">{monthLabel}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[9px] font-medium text-slate-400 py-1">
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const blocked = isBlocked(day);
                const isPast = day < today;
                const isToday = day.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    title={blocked ? "Indisponible" : isPast ? "" : "Disponible"}
                    className={[
                      "text-center text-[10px] py-1 rounded font-medium select-none",
                      isToday
                        ? "bg-primary-600 text-white"
                        : blocked
                        ? "bg-red-100 text-red-400 line-through"
                        : isPast
                        ? "text-slate-300"
                        : "text-slate-600 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

type Props = { params: Promise<{ slug: string; assetId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, assetId } = await params;
  const org = await db.organization.findFirst({ where: { slug, isPublic: true } });
  if (!org) return { title: "Asset introuvable" };
  const asset = await db.asset.findFirst({ where: { id: assetId, organizationId: org.id, isPublished: true } });
  if (!asset) return { title: "Asset introuvable" };
  return {
    title: `${asset.name} — ${org.name}`,
    description: asset.description ?? `Réservez ${asset.name} via EnyaRent`,
  };
}

export default async function AssetDetailPage({ params }: Props) {
  const { slug, assetId } = await params;

  const org = await db.organization.findFirst({
    where: { slug, isPublic: true },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
  if (!org) notFound();

  const asset = await db.asset.findFirst({
    where: { id: assetId, organizationId: org.id, isPublished: true },
    include: {
      assetType: true,
      photos: { orderBy: { order: "asc" } },
      availabilityBlocks: {
        where: { endDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 12,
      },
    },
  });
  if (!asset) notFound();

  const SectorIcon = SECTOR_ICONS[asset.assetType.sector] ?? Building2;

  const prices = [
    asset.pricePerDay && { label: "par jour", value: asset.pricePerDay },
    asset.pricePerNight && { label: "par nuit", value: asset.pricePerNight },
    asset.pricePerMonth && { label: "par mois", value: asset.pricePerMonth },
  ].filter(Boolean) as { label: string; value: { toString(): string } }[];

  const mainPhoto = asset.photos[0];
  const otherPhotos = asset.photos.slice(1, 5);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/agencies" className="hover:text-slate-900 transition-colors">Agences</Link>
        <ChevronRight size={12} />
        <Link href={`/agencies/${slug}`} className="hover:text-slate-900 transition-colors">
          {org.name}
        </Link>
        <ChevronRight size={12} />
        <span className="text-slate-900 font-medium truncate max-w-[200px]">{asset.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Left: photos + details */}
        <div>
          {/* Gallery */}
          <div className="mb-6">
            <div className="grid gap-2">
              {/* Main photo */}
              <div className="h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-100">
                {mainPhoto ? (
                  <img src={mainPhoto.url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <SectorIcon size={48} className="text-slate-300" />
                  </div>
                )}
              </div>
              {/* Thumbnails */}
              {otherPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {otherPhotos.map((photo) => (
                    <div key={photo.id} className="h-20 rounded-xl overflow-hidden bg-slate-100">
                      <img src={photo.url} alt={asset.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Asset info */}
          <div className="mb-8">
            {/* Type badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-3 ${SECTOR_COLORS[asset.assetType.sector] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
              <SectorIcon size={11} />
              {SECTOR_LABELS[asset.assetType.sector] ?? asset.assetType.name}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">{asset.name}</h1>

            {asset.city && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                <MapPin size={14} className="shrink-0" />
                {asset.address ? `${asset.address}, ${asset.city}` : asset.city}
              </div>
            )}

            {asset.description && (
              <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
                {asset.description}
              </p>
            )}

            {/* Pricing */}
            {prices.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {prices.map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 rounded-xl border border-slate-200 bg-white">
                    <div className="text-xl font-bold text-slate-900">
                      {Number(value).toLocaleString("fr-MA")} MAD
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
                {asset.deposit && Number(asset.deposit) > 0 && (
                  <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Shield size={12} className="text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Caution</span>
                    </div>
                    <div className="text-xl font-bold text-amber-800">
                      {Number(asset.deposit).toLocaleString("fr-MA")} MAD
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vehicle metadata */}
            {asset.assetType.sector === "VEHICLE" && (asset.marque || asset.modele || asset.annee || asset.couleur) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Marque", value: asset.marque },
                  { label: "Modèle", value: asset.modele },
                  { label: "Année", value: asset.annee },
                  { label: "Couleur", value: asset.couleur },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[10px] text-slate-400 mb-0.5">{item.label}</div>
                    <div className="text-sm font-medium text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability calendar */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Disponibilité</h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
                  Indisponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-primary-600" />
                  Aujourd&apos;hui
                </span>
              </div>
            </div>
            <AvailabilityCalendar blocks={asset.availabilityBlocks} />
          </div>
        </div>

        {/* Right: booking form */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            {/* Agency card */}
            <Link
              href={`/agencies/${slug}`}
              className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary-600 flex items-center justify-center shrink-0">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">{org.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400">Proposé par</p>
                <p className="text-sm font-semibold text-slate-900">{org.name}</p>
              </div>
            </Link>

            <h2 className="text-base font-semibold text-slate-900 mb-4">Faire une demande</h2>
            <BookingForm
              orgSlug={slug}
              assetId={assetId}
              deposit={asset.deposit ? Number(asset.deposit) : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
