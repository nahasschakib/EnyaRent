"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn, getInitials } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Wrench,
  CircleDot,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  LogOut,
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
      { href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
      { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
      { href: "/dashboard/notifications", labelKey: "notifications", icon: Bell },
    ],
  },
  {
    label: "Assets",
    items: [
      { href: "/dashboard/assets", labelKey: "assets", icon: Building2 },
      { href: "/dashboard/bookings", labelKey: "bookings", icon: CalendarDays },
      { href: "/dashboard/customers", labelKey: "customers", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/dashboard/contracts", labelKey: "contracts", icon: FileText },
      { href: "/dashboard/payments", labelKey: "payments", icon: CreditCard },
      { href: "/dashboard/invoices", labelKey: "invoices", icon: Receipt },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/dashboard/maintenance", labelKey: "maintenance", icon: Wrench },
      { href: "/dashboard/tickets", labelKey: "tickets", icon: CircleDot },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

const LOCALES = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "AR" },
  { code: "en", label: "EN" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLocaleChange = (locale: string) => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth/sign-in";
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 shrink-0",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 h-16 shrink-0">
        {!collapsed && (
          <span className="text-lg font-bold text-primary-600 tracking-tight">EnyaRent</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-1">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? t(item.labelKey as any) : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors relative",
                        active
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary-600 rounded-r-full rtl:left-auto rtl:right-0 rtl:rounded-l-full rtl:rounded-r-none" />
                      )}
                      <item.icon
                        size={18}
                        className={cn(
                          "shrink-0",
                          active ? "text-primary-600" : "text-slate-500 dark:text-slate-400"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{t(item.labelKey as any)}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-3 space-y-1">
        <Link
          href="/dashboard/settings"
          title={collapsed ? t("settings") : undefined}
          className={cn(
            "flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary-50 text-primary-700"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Settings size={18} className="shrink-0 text-slate-500" />
          {!collapsed && <span>{t("settings")}</span>}
        </Link>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {mounted && theme === "dark" ? (
            <Sun size={18} className="shrink-0 text-slate-500" />
          ) : (
            <Moon size={18} className="shrink-0 text-slate-500" />
          )}
          {!collapsed && (
            <span>{mounted && theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          )}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-1 px-3 py-1">
            <Globe size={14} className="text-slate-400 shrink-0" />
            {LOCALES.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleLocaleChange(locale.code)}
                className="text-xs font-medium text-slate-500 hover:text-primary-600 px-1 transition-colors"
              >
                {locale.label}
              </button>
            ))}
          </div>
        )}

        {session && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0 text-sm font-semibold text-primary-700">
              {getInitials(session.user.name ?? session.user.email)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {(session.user as any).role}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
