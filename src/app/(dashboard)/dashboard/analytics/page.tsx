"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "7" | "30" | "90";
type SectorFilter = "" | "REAL_ESTATE" | "VEHICLE" | "HOSPITALITY" | "EQUIPMENT";

interface AnalyticsData {
  period: number;
  kpis: {
    totalAssets: number;
    availableAssets: number;
    occupancyRate: number;
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    totalOverdue: number;
    openTickets: number;
    totalCustomers: number;
    newCustomers: number;
  };
  charts: {
    revenueByMonth: { month: string; amount: number }[];
    bookingsBySector: { sector: string; count: number }[];
    occupancyBySector: { sector: string; total: number; active: number; rate: number }[];
    assetROI: { id: string; name: string; sector: string; revenue: number; costs: number; roi: number }[];
  };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "Immobilier",
  VEHICLE: "Véhicule",
  HOSPITALITY: "Hôtellerie",
  EQUIPMENT: "Équipement",
};

const SECTOR_ICONS: Record<string, string> = {
  REAL_ESTATE: "🏢",
  VEHICLE: "🚗",
  HOSPITALITY: "🏨",
  EQUIPMENT: "🔧",
};

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "#3B82F6",
  VEHICLE: "#EA580C",
  HOSPITALITY: "#14B8A6",
  EQUIPMENT: "#8B5CF6",
};

const ORANGE = "#EA580C";
const SLATE = "#94A3B8";

function formatMAD(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M MAD`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k MAD`;
  return `${amount.toLocaleString("fr-FR")} MAD`;
}

function formatPct(value: number): string {
  return `${value}%`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon, accent = false, danger = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-xl p-5 flex items-start gap-4 shadow-sm transition-shadow hover:shadow-md ${
      accent ? "border-orange-200 bg-orange-50/40" : danger ? "border-red-200 bg-red-50/40" : "border-slate-200"
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
        accent ? "bg-orange-100" : danger ? "bg-red-100" : "bg-slate-100"
      }`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={`text-2xl font-bold leading-none ${
          accent ? "text-orange-600" : danger ? "text-red-600" : "text-slate-900"
        }`}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tooltip custom ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, currency = false }: {
  active?: boolean;
  payload?: { value: number; name?: string; color?: string }[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "#fff" }}>
          {p.name && <span className="text-slate-300">{p.name} : </span>}
          <span className="font-semibold">{currency ? formatMAD(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30");
  const [sector, setSector] = useState<SectorFilter>("");

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["analytics", period, sector],
    queryFn: async () => {
      const params = new URLSearchParams({ period, ...(sector && { sector }) });
      const res = await fetch(`/api/v1/analytics?${params}`);
      if (!res.ok) throw new Error("Erreur chargement analytics");
      return res.json();
    },
    staleTime: 60_000,
  });

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Performance et indicateurs clés</p>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-3">
            {/* Secteur */}
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as SectorFilter)}
              className="h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none cursor-pointer"
            >
              <option value="">Tous les secteurs</option>
              {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{SECTOR_ICONS[value]} {label}</option>
              ))}
            </select>

            {/* Période */}
            <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
              {(["7", "30", "90"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`h-9 px-4 text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-orange-500 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}j
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <KpiCard
                label="Revenus période"
                value={formatMAD(kpis?.totalRevenue ?? 0)}
                sub={`${kpis?.completedBookings ?? 0} réservations terminées`}
                icon="💰"
                accent
              />
              <KpiCard
                label="Taux d'occupation"
                value={formatPct(kpis?.occupancyRate ?? 0)}
                sub={`${kpis?.activeBookings ?? 0} actives en ce moment`}
                icon="📊"
                accent={kpis ? kpis.occupancyRate > 70 : false}
              />
              <KpiCard
                label="Impayés"
                value={formatMAD(kpis?.totalOverdue ?? 0)}
                sub="Paiements en retard > 3 jours"
                icon="⚠️"
                danger={kpis ? kpis.totalOverdue > 0 : false}
              />
              <KpiCard
                label="Tickets ouverts"
                value={String(kpis?.openTickets ?? 0)}
                sub="Support + maintenance"
                icon="🎫"
                danger={kpis ? kpis.openTickets > 5 : false}
              />
              <KpiCard
                label="Assets total"
                value={String(kpis?.totalAssets ?? 0)}
                sub={`${kpis?.availableAssets ?? 0} disponibles`}
                icon="🏠"
              />
              <KpiCard
                label="Réservations"
                value={String(kpis?.totalBookings ?? 0)}
                sub={`${kpis?.pendingBookings ?? 0} en attente`}
                icon="📅"
              />
              <KpiCard
                label="Clients"
                value={String(kpis?.totalCustomers ?? 0)}
                sub={`+${kpis?.newCustomers ?? 0} nouveaux`}
                icon="👥"
              />
              <KpiCard
                label="Contrats actifs"
                value={String(kpis?.activeBookings ?? 0)}
                sub="Baux en cours"
                icon="📄"
              />
            </>
          )}
        </div>

        {/* ── Graphiques ligne 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Revenus mensuels */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Revenus mensuels</h2>
                <p className="text-xs text-slate-400 mt-0.5">6 derniers mois</p>
              </div>
              <span className="text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">MAD</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={charts?.revenueByMonth ?? []} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip currency />} cursor={{ fill: "#F8FAFC" }} />
                  <Bar dataKey="amount" name="Revenus" fill={ORANGE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bookings par secteur */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900">Réservations par secteur</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sur la période sélectionnée</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={charts?.bookingsBySector.filter((s) => s.count > 0) ?? []}
                    dataKey="count"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts?.bookingsBySector.map((entry) => (
                      <Cell key={entry.sector} fill={SECTOR_COLORS[entry.sector] ?? SLATE} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${Number(v ?? 0).toLocaleString("fr-FR")} MAD`, "Revenus"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                  />
                  <Legend
                    formatter={(value) => SECTOR_LABELS[value] ?? value}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Graphiques ligne 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Taux d'occupation par secteur */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900">Taux d'occupation par secteur</h2>
              <p className="text-xs text-slate-400 mt-0.5">Assets actifs / total</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                {(charts?.occupancyBySector ?? []).map((s) => (
                  <div key={s.sector}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{SECTOR_ICONS[s.sector]}</span>
                        <span className="text-sm font-medium text-slate-700">{SECTOR_LABELS[s.sector]}</span>
                        <span className="text-xs text-slate-400">{s.active}/{s.total}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: SECTOR_COLORS[s.sector] }}>
                        {s.rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${s.rate}%`,
                          backgroundColor: SECTOR_COLORS[s.sector],
                        }}
                      />
                    </div>
                  </div>
                ))}
                {(charts?.occupancyBySector ?? []).every((s) => s.total === 0) && (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-2xl mb-2">📊</p>
                    <p className="text-sm">Aucun asset créé pour le moment</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ROI Top Assets */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900">ROI par asset</h2>
              <p className="text-xs text-slate-400 mt-0.5">Revenus — coûts maintenance</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (charts?.assetROI.length ?? 0) === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-2xl mb-2">💰</p>
                <p className="text-sm">Pas encore de données ROI</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(charts?.assetROI ?? []).map((asset, i) => (
                  <div key={asset.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: `${SECTOR_COLORS[asset.sector]}20` }}>
                      {SECTOR_ICONS[asset.sector]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{asset.name}</p>
                      <p className="text-xs text-slate-400">{SECTOR_LABELS[asset.sector]}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${asset.roi >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {asset.roi >= 0 ? "+" : ""}{formatMAD(asset.roi)}
                      </p>
                      <p className="text-xs text-slate-400">{formatMAD(asset.revenue)} revenus</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Statuts réservations ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900">Répartition des réservations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Par statut sur la période</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-16" />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "En attente", value: kpis?.pendingBookings ?? 0, color: "#F59E0B", bg: "#FFFBEB" },
                { label: "Confirmées", value: (kpis?.totalBookings ?? 0) - (kpis?.pendingBookings ?? 0) - (kpis?.activeBookings ?? 0) - (kpis?.completedBookings ?? 0) - (kpis?.cancelledBookings ?? 0), color: "#3B82F6", bg: "#EFF6FF" },
                { label: "Actives", value: kpis?.activeBookings ?? 0, color: "#EA580C", bg: "#FFF7ED" },
                { label: "Terminées", value: kpis?.completedBookings ?? 0, color: "#16A34A", bg: "#F0FDF4" },
                { label: "Annulées", value: kpis?.cancelledBookings ?? 0, color: "#94A3B8", bg: "#F8FAFC" },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: s.bg }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs font-medium" style={{ color: s.color }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ Erreur lors du chargement des analytics : {(error as Error).message}
          </div>
        )}

      </div>
    </div>
  );
}