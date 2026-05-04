"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Pencil, Phone, Mail, MapPin, CreditCard, CalendarDays, Shield } from "lucide-react";

const SCORE_STYLES: Record<string, string> = {
  Excellent: "bg-green-50 text-green-700 border border-green-200",
  Bon: "bg-blue-50 text-blue-700 border border-blue-200",
  "A surveiller": "bg-amber-50 text-amber-700 border border-amber-200",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-primary-50 text-primary-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-500",
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/customers/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div>
        <div className="h-16 border-b border-slate-200 bg-white animate-pulse" />
        <div className="p-8 space-y-6">
          <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <div className="p-8 text-center text-slate-500">Client introuvable.</div>;
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        breadcrumb={["EnyaRent", "Clients", customer.name]}
        actions={
          <Link
            href={`/dashboard/customers/${id}/edit`}
            className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil size={15} />
            Modifier
          </Link>
        }
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-semibold text-primary-700 shrink-0">
                  {getInitials(customer.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{customer.name}</h2>
                    {customer.score && (
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", SCORE_STYLES[customer.score] ?? "bg-slate-100 text-slate-600")}>
                        {customer.score}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{customer.type === "INDIVIDUAL" ? "Particulier" : "Entreprise"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{customer.phone}</span>
                  </div>
                )}
                {customer.cin && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">CIN</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">{customer.cin}</p>
                  </div>
                )}
                {customer.passportNumber && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Passeport</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">{customer.passportNumber}</p>
                  </div>
                )}
                {customer.address && (
                  <div className="col-span-2 flex items-center gap-2">
                    <MapPin size={15} className="text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{customer.address}</span>
                  </div>
                )}
              </div>
            </div>

            {customer.guarantor && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={16} className="text-slate-500" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Garant</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Nom</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{customer.guarantor.name}</p>
                  </div>
                  {customer.guarantor.cin && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">CIN</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">{customer.guarantor.cin}</p>
                    </div>
                  )}
                  {customer.guarantor.phone && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Telephone</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{customer.guarantor.phone}</p>
                    </div>
                  )}
                  {customer.guarantor.address && (
                    <div className="col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Adresse</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{customer.guarantor.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={16} className="text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Reservations</h2>
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full tabular-nums">
                  {customer._count?.bookings ?? 0}
                </span>
              </div>
              {customer.bookings?.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">Aucune reservation</p>
              ) : (
                <div className="space-y-2">
                  {customer.bookings?.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/dashboard/bookings/${booking.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {booking.asset?.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCurrency(parseFloat(booking.totalAmount))}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", BOOKING_STATUS_STYLES[booking.status])}>
                          {booking.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-slate-500" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Paiements recents</h2>
              </div>
              {customer.payments?.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">Aucun paiement</p>
              ) : (
                <div className="space-y-2">
                  {customer.payments?.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                          {payment.type.toLowerCase().replace("_", " ")}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCurrency(parseFloat(payment.amount), payment.currency)}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PAYMENT_STATUS_STYLES[payment.status])}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Statistiques</h2>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total locations</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {customer._count?.bookings ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Total paiements</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {customer._count?.payments ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Actions</h2>
              <Link
                href={`/dashboard/bookings/new?customerId=${id}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Nouvelle reservation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
