"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  kpis: {
    totalAssets: number;
    availableAssets: number;
    occupancyRate: number;
    totalBookings: number;
    activeBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    totalOverdue: number;
    openTickets: number;
    totalCustomers: number;
    newCustomers: number;
  };
  charts: {
    revenueByMonth: { month: string; amount: number }[];
    occupancyBySector: { sector: string; total: number; active: number; rate: number }[];
    assetROI: { id: string; name: string; sector: string; revenue: number; costs: number; roi: number }[];
  };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const SECTOR_LABELS: Record<string, string> = {
  REAL_ESTATE: "Immobilier", VEHICLE: "Véhicule",
  HOSPITALITY: "Hôtellerie", EQUIPMENT: "Équipement",
};

const SECTOR_ICONS: Record<string, string> = {
  REAL_ESTATE: "🏢", VEHICLE: "🚗", HOSPITALITY: "🏨", EQUIPMENT: "🔧",
};

const SECTOR_COLORS: Record<string, string> = {
  REAL_ESTATE: "#3B82F6", VEHICLE: "#EA580C", HOSPITALITY: "#14B8A6", EQUIPMENT: "#8B5CF6",
};

function formatMAD(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`;
  return amount.toLocaleString("fr-FR");
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const res = await fetch("/api/v1/analytics?period=30");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    staleTime: 60_000,
  });

  const kpis = data?.kpis;
  const charts = data?.charts;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-slate-400 mb-1">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-sm text-slate-400 mt-1">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/assets/new"
              className="flex items-center gap-2 h-9 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              + Nouvel asset
            </Link>
            <Link
              href="/dashboard/bookings/new"
              className="flex items-center gap-2 h-9 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              + Réservation
            </Link>
          </div>
        </div>

        {/* ── Alerte impayés ── */}
        {!isLoading && (kpis?.totalOverdue ?? 0) > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-700">Impayés en attente</p>
                <p className="text-xs text-red-500">
                  {formatMAD(kpis?.totalOverdue ?? 0)} MAD de paiements en retard de plus de 3 jours
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/payments?filter=overdue"
              className="text-xs font-medium text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              Voir les impayés →
            </Link>
          </div>
        )}

        {/* ── KPI Cards principales ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              {/* Revenus */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-md">
                <p className="text-xs font-medium text-orange-200 uppercase tracking-wide mb-3">Revenus (30j)</p>
                <p className="text-3xl font-bold mb-1">{formatMAD(kpis?.totalRevenue ?? 0)}</p>
                <p className="text-xs text-orange-200">MAD</p>
              </div>

              {/* Occupation */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Occupation</p>
                <div className="flex items-end gap-2 mb-2">
                  <p className="text-3xl font-bold text-slate-900">{kpis?.occupancyRate ?? 0}%</p>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${kpis?.occupancyRate ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Réservations actives */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Actives</p>
                <p className="text-3xl font-bold text-slate-900 mb-1">{kpis?.activeBookings ?? 0}</p>
                <p className="text-xs text-slate-400">{kpis?.pendingBookings ?? 0} en attente de confirmation</p>
              </div>

              {/* Clients */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Clients</p>
                <p className="text-3xl font-bold text-slate-900 mb-1">{kpis?.totalCustomers ?? 0}</p>
                <p className="text-xs text-slate-400">+{kpis?.newCustomers ?? 0} ce mois</p>
              </div>
            </>
          )}
        </div>

        {/* ── Contenu principal ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Graphique revenus */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Revenus mensuels</h2>
                <p className="text-xs text-slate-400">6 derniers mois</p>
              </div>
              <Link href="/dashboard/analytics" className="text-xs text-orange-600 hover:underline">
                Voir tout →
              </Link>
            </div>
            {isLoading ? (
              <Skeleton className="h-44" />
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={charts?.revenueByMonth ?? []} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                   formatter={(v) => [`${Number(v ?? 0).toLocaleString("fr-FR")} MAD`, "Revenus"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    cursor={{ fill: "#F8FAFC" }}
                  />
                  <Bar dataKey="amount" fill="#EA580C" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Taux occupation par secteur */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-900">Par secteur</h2>
              <span className="text-xs text-slate-400">occupation</span>
            </div>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {(charts?.occupancyBySector ?? []).map((s) => (
                  <div key={s.sector}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{SECTOR_ICONS[s.sector]}</span>
                        <span className="text-xs font-medium text-slate-600">{SECTOR_LABELS[s.sector]}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: SECTOR_COLORS[s.sector] }}>
                        {s.rate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.rate}%`, backgroundColor: SECTOR_COLORS[s.sector] }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{s.active} / {s.total} assets</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Accès rapides ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { href: "/dashboard/assets", icon: "🏠", label: "Assets", sub: `${kpis?.totalAssets ?? "—"} total`, color: "blue" },
            { href: "/dashboard/bookings", icon: "📅", label: "Réservations", sub: `${kpis?.activeBookings ?? "—"} actives`, color: "orange" },
            { href: "/dashboard/customers", icon: "👥", label: "Clients", sub: `${kpis?.totalCustomers ?? "—"} inscrits`, color: "teal" },
            { href: "/dashboard/tickets", icon: "🎫", label: "Tickets", sub: `${kpis?.openTickets ?? "—"} ouverts`, color: "purple" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{isLoading ? "..." : item.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Top ROI ── */}
        {!isLoading && (charts?.assetROI.length ?? 0) > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Top assets par ROI</h2>
              <Link href="/dashboard/analytics" className="text-xs text-orange-600 hover:underline">
                Voir l&apos;analyse complète →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(charts?.assetROI ?? []).map((asset, i) => (
                <div key={asset.id} className="flex items-center gap-4 py-3">
                  <span className="text-sm font-bold text-slate-300 w-5">{i + 1}</span>
                  <span className="text-lg">{SECTOR_ICONS[asset.sector]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-400">{SECTOR_LABELS[asset.sector]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${asset.roi >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {asset.roi >= 0 ? "+" : ""}{formatMAD(asset.roi)} MAD
                    </p>
                    <p className="text-xs text-slate-400">{formatMAD(asset.revenue)} revenus</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}