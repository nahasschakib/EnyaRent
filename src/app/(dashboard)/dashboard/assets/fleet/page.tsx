"use client";
// src/app/(dashboard)/dashboard/assets/fleet/page.tsx
// Vue flotte véhicules — statuts, alertes assurance/vignette, km

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface VehicleAsset {
  id: string;
  name: string;
  city: string;
  status: string;
  immatriculation: string | null;
  marque: string | null;
  modele: string | null;
  annee: string | null;
  couleur: string | null;
  metadata: {
    fuelType?: string;
    mileage?: number;
    insuranceExpiry?: string;
    vignetteExpiry?: string;
    extraKmRate?: number;
  };
  activeBooking?: {
    id: string;
    customerName: string;
    endDate: string;
    kmDepart?: number;
  } | null;
}

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: "⛽ Essence",
  DIESEL: "🔧 Diesel",
  ELECTRIC: "⚡ Électrique",
  HYBRID: "🌿 Hybride",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE:     { label: "Disponible",    color: "#16A34A", bg: "#F0FDF4" },
  RESERVED:      { label: "Réservé",       color: "#2563EB", bg: "#EFF6FF" },
  MAINTENANCE:   { label: "Maintenance",   color: "#D97706", bg: "#FFFBEB" },
  OUT_OF_SERVICE:{ label: "Hors service",  color: "#DC2626", bg: "#FEF2F2" },
};

function checkExpiry(dateStr?: string): "expired" | "soon" | "ok" | "unknown" {
  if (!dateStr) return "unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (date < now) return "expired";
  if (date < in30) return "soon";
  return "ok";
}

function ExpiryBadge({ date, label }: { date?: string; label: string }) {
  const status = checkExpiry(date);
  if (status === "unknown") return null;
  const configs = {
    expired: { color: "#DC2626", bg: "#FEF2F2", icon: "❌" },
    soon:    { color: "#D97706", bg: "#FFFBEB", icon: "⚠️" },
    ok:      { color: "#16A34A", bg: "#F0FDF4", icon: "✅" },
  };
  const cfg = configs[status];
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      {cfg.icon} {label} {date ? new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : ""}
    </span>
  );
}

export default function FleetPage() {
  const { data, isLoading } = useQuery<{ data: VehicleAsset[]; stats: { total: number; available: number; rented: number; maintenance: number; alertsCount: number } }>({
    queryKey: ["fleet"],
    queryFn: async () => {
      const res = await fetch("/api/v1/assets/fleet");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    staleTime: 30_000,
  });

  const vehicles = data?.data ?? [];
  const stats = data?.stats;

  const alertVehicles = vehicles.filter((v) => {
    const ins = checkExpiry(v.metadata.insuranceExpiry);
    const vig = checkExpiry(v.metadata.vignetteExpiry);
    return ins === "expired" || ins === "soon" || vig === "expired" || vig === "soon";
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">🚗 Vue Flotte</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gestion de tous vos véhicules</p>
          </div>
          <Link
            href="/dashboard/assets/new"
            className="h-9 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            + Nouveau véhicule
          </Link>
        </div>

        {/* KPIs flotte */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: "Total", value: stats.total, color: "text-slate-900", bg: "bg-white" },
              { label: "Disponibles", value: stats.available, color: "text-green-600", bg: "bg-green-50 border-green-200" },
              { label: "En location", value: stats.rented, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
              { label: "Maintenance", value: stats.maintenance, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { label: "Alertes", value: alertVehicles.length, color: alertVehicles.length > 0 ? "text-red-600" : "text-slate-400", bg: alertVehicles.length > 0 ? "bg-red-50 border-red-200" : "bg-white" },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.bg} border-slate-200`}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Alertes */}
        {alertVehicles.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-red-700 mb-2">⚠️ {alertVehicles.length} véhicule(s) nécessitent votre attention</p>
            <div className="flex flex-wrap gap-2">
              {alertVehicles.map((v) => (
                <Link key={v.id} href={`/dashboard/assets/${v.id}`}
                  className="text-xs font-medium text-red-700 bg-white border border-red-200 px-2 py-1 rounded-lg hover:bg-red-100">
                  {v.marque} {v.modele} · {v.immatriculation}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grille véhicules */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
            <p className="text-4xl mb-3">🚗</p>
            <p className="text-sm font-medium text-slate-700">Aucun véhicule dans la flotte</p>
            <Link href="/dashboard/assets/new" className="text-xs text-orange-600 hover:underline mt-2 inline-block">
              Ajouter le premier véhicule →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {vehicles.map((vehicle) => {
              const statusCfg = STATUS_CONFIG[vehicle.status] ?? STATUS_CONFIG.AVAILABLE;
              return (
                <Link
                  key={vehicle.id}
                  href={`/dashboard/assets/${vehicle.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all"
                >
                  {/* Header véhicule */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {vehicle.marque} {vehicle.modele}
                      </p>
                      <p className="text-xs text-slate-400">{vehicle.annee} · {vehicle.couleur ?? "—"}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Immat + carburant */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {vehicle.immatriculation ?? "—"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {FUEL_LABELS[vehicle.metadata.fuelType ?? ""] ?? vehicle.metadata.fuelType ?? "—"}
                    </span>
                    {vehicle.metadata.mileage !== undefined && (
                      <span className="text-xs text-slate-500">
                        🔢 {vehicle.metadata.mileage.toLocaleString("fr-FR")} km
                      </span>
                    )}
                  </div>

                  {/* Alertes expiration */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <ExpiryBadge date={vehicle.metadata.insuranceExpiry} label="Assurance" />
                    <ExpiryBadge date={vehicle.metadata.vignetteExpiry} label="Vignette" />
                  </div>

                  {/* Location active */}
                  {vehicle.activeBooking && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-700">
                        🔑 En location — <span className="font-medium">{vehicle.activeBooking.customerName}</span>
                        {" · "}Retour : {new Date(vehicle.activeBooking.endDate).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}