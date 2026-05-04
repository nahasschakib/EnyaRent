"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
  VEHICLE:     "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800",
  HOSPITALITY: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800",
  EQUIPMENT:   "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
};

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "Immobilier",
  VEHICLE:     "Véhicules",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT:   "Équipements",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  CONFIRMED: "Confirmée",
  ACTIVE:    "Active",
  COMPLETED: "Terminée",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayISO(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isDateInRange(date: Date, start: string, end: string) {
  const d = date.getTime();
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["calendar-bookings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/bookings?limit=500");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 3 * 60 * 1000,
  });

  const allBookings = useMemo(
    () =>
      (data?.data ?? []).filter(
        (b: any) => !["CANCELLED", "COMPLETED"].includes(b.status)
      ),
    [data]
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayISO = getFirstDayISO(year, month);
  const totalCells = firstDayISO + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const padEnd = rows * 7 - totalCells;

  const calCells: (Date | null)[] = [
    ...Array<null>(firstDayISO).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ...Array<null>(padEnd).fill(null),
  ];

  function getBookingsForDay(date: Date): any[] {
    return allBookings.filter((b: any) =>
      isDateInRange(date, b.startDate, b.endDate)
    );
  }

  const todayBookings = getBookingsForDay(today);

  return (
    <div>
      <PageHeader title="Calendrier" breadcrumb={["EnyaRent", "Calendrier"]} />

      <div className="p-8 space-y-5">

        {/* Légende secteurs */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {Object.entries(SECTOR_LABELS).map(([sector, label]) => (
            <div key={sector} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded border", SECTOR_COLORS[sector])} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-300 dark:text-slate-600 hidden sm:block">|</span>
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{todayBookings.length}</span> en cours aujourd'hui
          </span>
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{allBookings.length}</span> actives au total
          </span>
        </div>

        {/* Calendrier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {MONTHS_FR[month]} {year}
              </p>
            </div>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            {DAYS_FR.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grille des jours */}
          {isLoading ? (
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[110px] p-2">
                  <div className="h-6 w-6 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
              {calCells.map((date, i) => {
                if (!date) {
                  return (
                    <div
                      key={i}
                      className="min-h-[110px] bg-slate-50/60 dark:bg-slate-800/20"
                    />
                  );
                }

                const dayBookings = getBookingsForDay(date);
                const isToday = isSameDay(date, today);
                const visible = dayBookings.slice(0, 3);
                const overflow = dayBookings.length - 3;

                return (
                  <div key={i} className="min-h-[110px] p-2 space-y-1">
                    <div
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium select-none",
                        isToday
                          ? "bg-primary-600 text-white font-bold"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {date.getDate()}
                    </div>

                    <div className="space-y-0.5">
                      {visible.map((b: any) => {
                        const sector = b.asset?.assetType?.sector;
                        const colorCls =
                          SECTOR_COLORS[sector] ??
                          "bg-slate-100 text-slate-600 border-slate-200";
                        return (
                          <Link
                            key={b.id}
                            href={`/dashboard/bookings/${b.id}`}
                            className={cn(
                              "block px-1.5 py-0.5 rounded text-[10px] font-medium truncate border transition-opacity hover:opacity-75",
                              colorCls
                            )}
                            title={`${b.asset?.name} — ${b.customer?.name} (${STATUS_LABELS[b.status] ?? b.status})`}
                          >
                            {b.asset?.name}
                          </Link>
                        );
                      })}
                      {overflow > 0 && (
                        <span className="block text-[10px] text-slate-400 px-1 tabular-nums">
                          +{overflow} autre{overflow > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
