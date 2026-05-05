"use client";

import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Search,
  User,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const QUICK_LINKS = [
  {
    href: "/mon-espace/reservations",
    Icon: CalendarDays,
    title: "Mes réservations",
    description: "Consultez vos réservations en cours et passées",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    href: "/mon-espace/contrats",
    Icon: FileText,
    title: "Mes contrats",
    description: "Téléchargez vos contrats de location signés",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    href: "/agencies",
    Icon: Search,
    title: "Chercher un bien",
    description: "Trouvez un logement, véhicule ou équipement",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    href: "/mon-espace/profil",
    Icon: User,
    title: "Mon profil",
    description: "CIN, permis de conduire, informations personnelles",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
] as const;

const MOCK_BOOKINGS = [
  {
    id: "1",
    asset: "Appartement Maarif – Casablanca",
    status: "ACTIVE",
    dates: "01 mai → 31 mai 2026",
  },
  {
    id: "2",
    asset: "Voiture Dacia Logan",
    status: "PENDING",
    dates: "10 mai → 12 mai 2026",
  },
  {
    id: "3",
    asset: "Studio Guéliz – Marrakech",
    status: "COMPLETED",
    dates: "01 avr → 30 avr 2026",
  },
];

const STATUS_CONFIG = {
  ACTIVE: {
    label: "En cours",
    Icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50",
  },
  PENDING: {
    label: "En attente",
    Icon: Clock,
    className: "text-amber-600 bg-amber-50",
  },
  CONFIRMED: {
    label: "Confirmée",
    Icon: CheckCircle2,
    className: "text-blue-600 bg-blue-50",
  },
  COMPLETED: {
    label: "Terminée",
    Icon: AlertCircle,
    className: "text-slate-500 bg-slate-100",
  },
  CANCELLED: {
    label: "Annulée",
    Icon: AlertCircle,
    className: "text-red-500 bg-red-50",
  },
} as const;

type BookingStatus = keyof typeof STATUS_CONFIG;

export default function MonEspacePage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "vous";

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bienvenue dans votre espace locataire EnyaRent
        </p>
      </div>

      {/* Quick links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_LINKS.map(({ href, Icon, title, description, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col p-5 bg-white border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-sm transition-all"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                bg
              )}
            >
              <Icon size={20} className={color} />
            </div>
            <span className="font-semibold text-slate-900 text-sm mb-1">
              {title}
            </span>
            <span className="text-xs text-slate-500 leading-snug flex-1">
              {description}
            </span>
            <div className="mt-3 flex items-center text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Accéder <ChevronRight size={12} className="ml-0.5" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Réservations récentes</h2>
          <Link
            href="/mon-espace/reservations"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Tout voir
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {MOCK_BOOKINGS.map((booking) => {
            const config =
              STATUS_CONFIG[booking.status as BookingStatus] ??
              STATUS_CONFIG.PENDING;
            const StatusIcon = config.Icon;

            return (
              <div
                key={booking.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {booking.asset}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{booking.dates}</p>
                </div>
                <span
                  className={cn(
                    "ml-4 shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                    config.className
                  )}
                >
                  <StatusIcon size={11} />
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-slate-400 text-center">
          Les données affichées sont des exemples — connectez votre compte pour voir vos vraies réservations.
        </p>
      </div>
    </div>
  );
}
