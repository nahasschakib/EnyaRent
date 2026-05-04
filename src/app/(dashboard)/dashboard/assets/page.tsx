"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ActionColumn, SortableColumn } from "@/components/column-helpers";
import { Plus, Building2, Car, Hotel, Wrench } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Asset = {
  id: string;
  name: string;
  city: string | null;
  status: string;
  pricePerMonth: string | null;
  pricePerNight: string | null;
  pricePerDay: string | null;
  assetType: { name: string; sector: string };
  photos: { url: string }[];
};

const SECTOR_ICONS: Record<string, React.ElementType> = {
  REAL_ESTATE: Building2,
  VEHICLE: Car,
  HOSPITALITY: Hotel,
  EQUIPMENT: Wrench,
};

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "text-indigo-600 bg-indigo-50",
  VEHICLE: "text-cyan-600 bg-cyan-50",
  HOSPITALITY: "text-violet-600 bg-violet-50",
  EQUIPMENT: "text-amber-600 bg-amber-50",
};

const STATUS_CLASSES: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  RESERVED: "bg-primary-50 text-primary-700 border-primary-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-200",
  OUT_OF_SERVICE: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Hors service",
};

const columns: ColumnDef<Asset>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableColumn column={column} title="Asset" />,
    cell: ({ row }) => {
      const asset = row.original;
      const SectorIcon = SECTOR_ICONS[asset.assetType?.sector] ?? Building2;
      return (
        <Link
          href={`/dashboard/assets/${asset.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {asset.photos[0] ? (
            <img
              src={asset.photos[0].url}
              alt={asset.name}
              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <SectorIcon size={15} className="text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {asset.name}
            </p>
            {asset.city && (
              <p className="text-xs text-slate-500">{asset.city}</p>
            )}
          </div>
        </Link>
      );
    },
  },
  {
    id: "sector",
    header: "Type / Secteur",
    cell: ({ row }) => {
      const asset = row.original;
      const SectorIcon = SECTOR_ICONS[asset.assetType?.sector] ?? Building2;
      const color =
        SECTOR_COLORS[asset.assetType?.sector] ?? "text-slate-600 bg-slate-100";
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center shrink-0",
              color
            )}
          >
            <SectorIcon size={13} />
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {asset.assetType?.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableColumn column={column} title="Statut" />,
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            STATUS_CLASSES[status]
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {STATUS_LABELS[status] ?? status}
        </span>
      );
    },
  },
  {
    id: "price",
    header: "Prix",
    cell: ({ row }) => {
      const asset = row.original;
      const price = asset.pricePerMonth
        ? `${formatCurrency(parseFloat(asset.pricePerMonth))}/mois`
        : asset.pricePerNight
        ? `${formatCurrency(parseFloat(asset.pricePerNight))}/nuit`
        : asset.pricePerDay
        ? `${formatCurrency(parseFloat(asset.pricePerDay))}/jour`
        : "—";
      return (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
          {price}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionColumn editHref={`/dashboard/assets/${row.original.id}/edit`} />
    ),
  },
];

async function fetchAssets(sector: string, status: string) {
  const params = new URLSearchParams({
    limit: "100",
    ...(sector && { sector }),
    ...(status && { status }),
  });
  const res = await fetch(`/api/v1/assets?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function AssetsPage() {
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["assets", sector, status],
    queryFn: () => fetchAssets(sector, status),
  });

  const assets: Asset[] = data?.data ?? [];

  const selectClass =
    "h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-primary-600";

  return (
    <div>
      <PageHeader
        title="Assets"
        breadcrumb={["EnyaRent", "Assets"]}
        actions={
          <Link
            href="/dashboard/assets/new"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nouvel asset
          </Link>
        }
      />

      <div className="p-8 space-y-5">
        {/* Filtres serveur */}
        <div className="flex items-center gap-3">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les secteurs</option>
            <option value="REAL_ESTATE">Immobilier</option>
            <option value="VEHICLE">Véhicules</option>
            <option value="HOSPITALITY">Hôtellerie</option>
            <option value="EQUIPMENT">Équipements</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">Tous les statuts</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="RESERVED">Réservé</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Hors service</option>
          </select>

          {!isLoading && (
            <span className="text-sm text-slate-500 ml-auto">
              {assets.length} asset{assets.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-40" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse w-20" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Building2 size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Aucun asset
            </p>
            <p className="text-sm text-slate-500 max-w-xs text-center">
              Créez votre premier asset pour commencer à gérer vos locations.
            </p>
            <Link
              href="/dashboard/assets/new"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
            >
              <Plus size={16} />
              Nouvel asset
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={assets}
            searchPlaceholder="Rechercher un asset..."
          />
        )}
      </div>
    </div>
  );
}
