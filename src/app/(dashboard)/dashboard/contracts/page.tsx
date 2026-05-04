"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { SortableColumn } from "@/components/column-helpers";
import { FileText, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Contract = {
  id: string;
  status: "DRAFT" | "SENT" | "SIGNED" | "ARCHIVED";
  templateType: string;
  pdfUrl: string | null;
  signedPdfUrl: string | null;
  createdAt: string;
  booking: {
    asset: { id: string; name: string; assetType: { name: string; sector: string } };
    customer: { id: string; name: string };
  };
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  SENT:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SIGNED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    "Brouillon",
  SENT:     "Envoyé",
  SIGNED:   "Signé",
  ARCHIVED: "Archivé",
};

const TEMPLATE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Bail résidentiel",
  VEHICLE:     "Location véhicule",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT:   "Équipement",
};

const columns: ColumnDef<Contract>[] = [
  {
    id: "asset",
    header: "Asset",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <Link
          href={`/dashboard/contracts/${c.id}`}
          className="hover:opacity-80 transition-opacity"
        >
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {c.booking.asset.name}
          </p>
          <p className="text-xs text-slate-500">{c.booking.asset.assetType.name}</p>
        </Link>
      );
    },
  },
  {
    id: "customer",
    header: "Client",
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.booking.customer.id}`}
        className="text-sm text-slate-700 dark:text-slate-300 hover:text-primary-600 transition-colors"
      >
        {row.original.booking.customer.name}
      </Link>
    ),
  },
  {
    accessorKey: "templateType",
    header: ({ column }) => <SortableColumn column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {TEMPLATE_LABELS[row.original.templateType] ?? row.original.templateType}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableColumn column={column} title="Statut" />,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={cn(
            "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
            STATUS_STYLES[status]
          )}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableColumn column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-sm text-slate-500 tabular-nums">
        {new Date(row.original.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const c = row.original;
      const pdfUrl = c.signedPdfUrl ?? c.pdfUrl;
      return (
        <div className="flex items-center gap-1">
          <Link
            href={`/dashboard/contracts/${c.id}`}
            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Voir"
          >
            <Eye size={15} />
          </Link>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Télécharger"
            >
              <Download size={15} />
            </a>
          )}
        </div>
      );
    },
  },
];

const STATUSES = [
  { value: "",         label: "Tous" },
  { value: "DRAFT",    label: "Brouillon" },
  { value: "SENT",     label: "Envoyé" },
  { value: "SIGNED",   label: "Signé" },
  { value: "ARCHIVED", label: "Archivé" },
];

async function fetchContracts(status: string) {
  const params = new URLSearchParams({ limit: "100", ...(status && { status }) });
  const res = await fetch(`/api/v1/contracts?${params}`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function ContractsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", status],
    queryFn: () => fetchContracts(status),
  });

  const contracts: Contract[] = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Contrats" breadcrumb={["EnyaRent", "Contrats"]} />

      <div className="p-8 space-y-5">
        {/* Filtres statut */}
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                status === s.value
                  ? "bg-primary-600 border-primary-600 text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-600"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-40" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" />
                </div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse w-16" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-28" />
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <FileText size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Aucun contrat
            </p>
            <p className="text-sm text-slate-500 max-w-xs text-center">
              Les contrats sont générés depuis les réservations.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={contracts}
            searchPlaceholder="Rechercher un contrat..."
          />
        )}
      </div>
    </div>
  );
}
