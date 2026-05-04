"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Building2,
  Car,
  Hotel,
  Wrench,
  Pencil,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  CalendarOff,
  CalendarDays,
  ImageOff,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-50 text-green-700 border border-green-200",
  RESERVED: "bg-primary-50 text-primary-700 border border-primary-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 border border-amber-200",
  OUT_OF_SERVICE: "bg-slate-100 text-slate-500 border border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  MAINTENANCE: "Maintenance",
  OUT_OF_SERVICE: "Hors service",
};

const SECTOR_ICONS: Record<string, React.ElementType> = {
  REAL_ESTATE: Building2,
  VEHICLE: Car,
  HOSPITALITY: Hotel,
  EQUIPMENT: Wrench,
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-primary-50 text-primary-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ISO week: Monday=0, Sunday=6
function getFirstDayISO(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, start: string, end: string) {
  const d = date.getTime();
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

// ─── Block form schema ────────────────────────────────────────────────────────

const blockSchema = z.object({
  startDate: z.string().min(1, "Date début requise"),
  endDate: z.string().min(1, "Date fin requise"),
  reason: z.string().optional(),
});

type BlockForm = z.infer<typeof blockSchema>;

type Tab = "infos" | "photos" | "calendar" | "bookings";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("infos");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [showBlockForm, setShowBlockForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/assets/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const {
    register: regBlock,
    handleSubmit: handleBlock,
    reset: resetBlock,
    formState: { errors: blockErrors },
  } = useForm<BlockForm>({ resolver: zodResolver(blockSchema) });

  const addBlock = useMutation({
    mutationFn: async (data: BlockForm) => {
      const res = await fetch(`/api/v1/assets/${id}/availability-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Période bloquée avec succès");
      resetBlock();
      setShowBlockForm(false);
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const res = await fetch(
        `/api/v1/assets/${id}/availability-blocks?blockId=${blockId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => {
      toast.success("Bloc supprimé");
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/v1/assets/${id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Échec de l'upload");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Photo ajoutée");
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/v1/assets/${id}/photos?photoId=${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => {
      toast.success("Photo supprimée");
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  function getDayStatus(date: Date): "booked" | "blocked" | "available" {
    if (!asset) return "available";
    const booked = asset.bookings?.some(
      (b: any) =>
        ["CONFIRMED", "ACTIVE"].includes(b.status) &&
        isDateInRange(date, b.startDate, b.endDate)
    );
    if (booked) return "booked";
    const blocked = asset.availabilityBlocks?.some((b: any) =>
      isDateInRange(date, b.startDate, b.endDate)
    );
    if (blocked) return "blocked";
    return "available";
  }

  function prevMonth() {
    setCalMonth((m) => {
      if (m === 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setCalMonth((m) => {
      if (m === 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  if (isLoading) {
    return (
      <div>
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-pulse" />
        <div className="p-8 space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse w-72" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return <div className="p-8 text-center text-slate-500">Asset introuvable.</div>;
  }

  const SectorIcon = SECTOR_ICONS[asset.assetType?.sector] ?? Building2;
  const today = new Date();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayISO = getFirstDayISO(calYear, calMonth);
  const calCells: (Date | null)[] = [
    ...Array<null>(firstDayISO).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(calYear, calMonth, i + 1)),
  ];

  const inputBase =
    "w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-600 transition-colors";

  const tabs: { key: Tab; label: string }[] = [
    { key: "infos", label: "Infos" },
    {
      key: "photos",
      label: `Photos${asset.photos?.length ? ` (${asset.photos.length})` : ""}`,
    },
    { key: "calendar", label: "Calendrier" },
    {
      key: "bookings",
      label: `Réservations${asset.bookings?.length ? ` (${asset.bookings.length})` : ""}`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={asset.name}
        breadcrumb={["EnyaRent", "Assets", asset.name]}
        actions={
          <Link
            href={`/dashboard/assets/${id}/edit`}
            className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil size={15} />
            Modifier
          </Link>
        }
      />

      {/* Tab navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8">
        <nav className="flex">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                tab === key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-8">

        {/* ── Infos Tab ─────────────────────────────────────────────────────── */}
        {tab === "infos" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Informations
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      STATUS_STYLES[asset.status]
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {STATUS_LABELS[asset.status] ?? asset.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Type
                    </p>
                    <div className="flex items-center gap-2">
                      <SectorIcon size={15} className="text-slate-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {asset.assetType?.name}
                      </span>
                    </div>
                  </div>

                  {asset.city && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Ville
                      </p>
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-slate-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {asset.city}
                        </span>
                      </div>
                    </div>
                  )}

                  {asset.address && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Adresse
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {asset.address}
                      </p>
                    </div>
                  )}

                  {asset.description && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Description
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {asset.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Tarification (MAD)
                </h2>
                {asset.pricePerMonth && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Par mois
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(parseFloat(asset.pricePerMonth))}
                    </p>
                  </div>
                )}
                {asset.pricePerNight && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Par nuit
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(parseFloat(asset.pricePerNight))}
                    </p>
                  </div>
                )}
                {asset.pricePerDay && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Par jour
                    </p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatCurrency(parseFloat(asset.pricePerDay))}
                    </p>
                  </div>
                )}
                {asset.deposit && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Caution
                    </p>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCurrency(parseFloat(asset.deposit))}
                    </p>
                  </div>
                )}
                {!asset.pricePerMonth && !asset.pricePerNight && !asset.pricePerDay && (
                  <p className="text-sm text-slate-400">Aucun prix configuré</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Actions
                </h2>
                <Link
                  href={`/dashboard/bookings/new?assetId=${id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={15} />
                  Nouvelle réservation
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Photos Tab ────────────────────────────────────────────────────── */}
        {tab === "photos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {asset.photos?.length ?? 0} photo
                {asset.photos?.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhoto.isPending}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={15} />
                {uploadPhoto.isPending ? "Upload en cours..." : "Ajouter une photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadPhoto.mutate(file);
                    e.target.value = "";
                  }
                }}
              />
            </div>

            {asset.photos?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <ImageOff size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aucune photo
                </p>
                <p className="text-sm text-slate-400">
                  Cliquez sur "Ajouter une photo" pour commencer
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {asset.photos.map((photo: any, i: number) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={photo.url}
                      alt={`${asset.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => deletePhoto.mutate(photo.id)}
                        disabled={deletePhoto.isPending}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        Principale
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Calendar Tab ──────────────────────────────────────────────────── */}
        {tab === "calendar" && (
          <div className="max-w-xl space-y-6">
            {/* Legend */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-primary-100 dark:bg-primary-900/50 border border-primary-300 dark:border-primary-700" />
                <span className="text-xs text-slate-500">Réservé</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-500">Bloqué</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                <span className="text-xs text-slate-500">Disponible</span>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {MONTHS_FR[calMonth]} {calYear}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS_FR.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calCells.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const status = getDayStatus(date);
                  const isToday = isSameDay(date, today);
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-lg text-sm select-none",
                        isToday && "ring-2 ring-primary-600 ring-offset-1 font-bold",
                        status === "booked" &&
                          "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium",
                        status === "blocked" &&
                          "bg-slate-200 dark:bg-slate-700 text-slate-400 line-through",
                        status === "available" &&
                          "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Availability blocks */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarOff size={15} className="text-slate-400" />
                  Périodes bloquées
                </h3>
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  <Plus size={14} />
                  Bloquer des dates
                </button>
              </div>

              {showBlockForm && (
                <form
                  onSubmit={handleBlock((data) => addBlock.mutate(data))}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                        Date début
                      </label>
                      <input
                        type="date"
                        {...regBlock("startDate")}
                        className={inputBase}
                      />
                      {blockErrors.startDate && (
                        <p className="text-[11px] text-red-600">
                          {blockErrors.startDate.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                        Date fin
                      </label>
                      <input
                        type="date"
                        {...regBlock("endDate")}
                        className={inputBase}
                      />
                      {blockErrors.endDate && (
                        <p className="text-[11px] text-red-600">
                          {blockErrors.endDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                      Raison (optionnel)
                    </label>
                    <input
                      type="text"
                      {...regBlock("reason")}
                      placeholder="Ex: Maintenance, Travaux..."
                      className={inputBase}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockForm(false);
                        resetBlock();
                      }}
                      className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={addBlock.isPending}
                      className="px-3 py-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                    >
                      {addBlock.isPending ? "..." : "Bloquer"}
                    </button>
                  </div>
                </form>
              )}

              {asset.availabilityBlocks?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">
                  Aucune période bloquée
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {asset.availabilityBlocks?.map((block: any) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatDate(block.startDate)} — {formatDate(block.endDate)}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-slate-500">{block.reason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteBlock.mutate(block.id)}
                        disabled={deleteBlock.isPending}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Bookings Tab ──────────────────────────────────────────────────── */}
        {tab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {asset.bookings?.length ?? 0} réservation
                {asset.bookings?.length !== 1 ? "s" : ""}
              </p>
              <Link
                href={`/dashboard/bookings/new?assetId=${id}`}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={15} />
                Nouvelle réservation
              </Link>
            </div>

            {asset.bookings?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <CalendarDays size={24} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aucune réservation
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-6 py-3">
                        Client
                      </th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                        Période
                      </th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-4 py-3">
                        Statut
                      </th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-6 py-3">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {asset.bookings.map((booking: any) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/dashboard/bookings/${booking.id}`)
                        }
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {booking.customer?.name ?? "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatDate(booking.startDate)} —{" "}
                            {formatDate(booking.endDate)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              BOOKING_STATUS_STYLES[booking.status]
                            )}
                          >
                            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                            {formatCurrency(parseFloat(booking.totalAmount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
