"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { ActionColumn, SortableColumn } from "@/components/column-helpers";
import { Plus, Users } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cin: string | null;
  type: string;
  score: string | null;
  createdAt: string;
  _count: { bookings: number };
};

const SCORE_CLASSES: Record<string, string> = {
  Excellent: "bg-green-50 text-green-700 border border-green-200",
  Bon: "bg-blue-50 text-blue-700 border border-blue-200",
  "A surveiller": "bg-amber-50 text-amber-700 border border-amber-200",
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableColumn column={column} title="Client" />,
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <Link
          href={`/dashboard/customers/${customer.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-sm font-semibold text-primary-700">
            {getInitials(customer.name)}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {customer.name}
            </p>
            <p className="text-xs text-slate-500">
              {customer.type === "INDIVIDUAL" ? "Particulier" : "Entreprise"}
            </p>
          </div>
        </Link>
      );
    },
  },
  {
    id: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const { email, phone } = row.original;
      return (
        <div className="space-y-0.5">
          {email && (
            <p className="text-sm text-slate-700 dark:text-slate-300">{email}</p>
          )}
          {phone && <p className="text-xs text-slate-500">{phone}</p>}
          {!email && !phone && <span className="text-sm text-slate-400">—</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "cin",
    header: "CIN",
    cell: ({ row }) => (
      <span className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
        {row.original.cin ?? "—"}
      </span>
    ),
  },
  {
    id: "bookings",
    header: ({ column }) => (
      <SortableColumn column={column} title="Locations" />
    ),
    accessorFn: (row) => row._count.bookings,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
        {row.original._count.bookings}
      </span>
    ),
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => {
      const score = row.original.score;
      return score ? (
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            SCORE_CLASSES[score] ?? "bg-slate-100 text-slate-600"
          )}
        >
          {score}
        </span>
      ) : (
        <span className="text-xs text-slate-400">—</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionColumn
        editHref={`/dashboard/customers/${row.original.id}/edit`}
      />
    ),
  },
];

async function fetchCustomers() {
  const res = await fetch("/api/v1/customers?limit=200");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const customers: Customer[] = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Clients"
        breadcrumb={["EnyaRent", "Clients"]}
        actions={
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nouveau client
          </Link>
        }
      />

      <div className="p-8 space-y-5">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-36" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" />
                </div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" />
                <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Users size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Aucun client
            </p>
            <p className="text-sm text-slate-500 max-w-xs text-center">
              Ajoutez votre premier client pour commencer.
            </p>
            <Link
              href="/dashboard/customers/new"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
            >
              <Plus size={16} />
              Nouveau client
            </Link>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            searchPlaceholder="Rechercher un client..."
          />
        )}
      </div>
    </div>
  );
}
