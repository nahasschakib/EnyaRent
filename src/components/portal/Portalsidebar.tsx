"use client";
// src/components/portal/PortalSidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
}

const NAV_ITEMS = [
  { href: "/portal", label: "Mon espace", icon: "🏠", exact: true },
  { href: "/portal/bookings", label: "Mes réservations", icon: "📅" },
  { href: "/portal/payments", label: "Mes paiements", icon: "💳" },
  { href: "/portal/documents", label: "Mes documents", icon: "📄" },
  { href: "/portal/tickets", label: "Mes demandes", icon: "🎫" },
  { href: "/portal/profile", label: "Mon profil", icon: "👤" },
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function PortalSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/sign-in");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex-col z-30">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-slate-100">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-600">EnyaRent</span>
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Espace client</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href, item.exact)
                  ? "bg-orange-50 text-orange-600 border-l-2 border-orange-500"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-orange-600">
                {getInitials(user.name)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30">
        <span className="text-lg font-bold text-orange-600">EnyaRent</span>
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-orange-600">{getInitials(user.name)}</span>
        </div>
      </header>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2 z-30">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
              isActive(item.href, item.exact) ? "text-orange-600" : "text-slate-400"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label.split(" ")[1] ?? item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}