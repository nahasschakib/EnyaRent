"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn, getInitials } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  FileText,
  CircleDot,
  User,
  LogOut,
} from "lucide-react";

const portalNavItems = [
  { href: "/portal", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/portal/bookings", labelKey: "bookings", icon: CalendarDays },
  { href: "/portal/payments", labelKey: "payments", icon: CreditCard },
  { href: "/portal/documents", labelKey: "invoices", icon: FileText },
  { href: "/portal/tickets", labelKey: "tickets", icon: CircleDot },
  { href: "/portal/profile", labelKey: "profile", icon: User },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth/sign-in";
  };

  return (
    <aside className="flex flex-col h-screen w-[240px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shrink-0">
      <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 h-16 shrink-0">
        <span className="text-lg font-bold text-primary-600 tracking-tight">EnyaRent</span>
        <span className="text-xs text-slate-500 font-medium">Client</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {portalNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors relative",
                    active
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-600 rounded-r-full rtl:left-auto rtl:right-0" />
                  )}
                  <item.icon
                    size={18}
                    className={cn(
                      "shrink-0",
                      active ? "text-primary-600" : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  <span className="truncate">{t(item.labelKey as any)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 space-y-1">
        {session && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-sm font-semibold text-primary-700">
              {getInitials(session.user.name ?? session.user.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
