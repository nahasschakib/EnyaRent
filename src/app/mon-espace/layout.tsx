"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, FileText, User, Search } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/mon-espace", label: "Accueil", Icon: Building2, exact: true },
  { href: "/mon-espace/reservations", label: "Réservations", Icon: CalendarDays, exact: false },
  { href: "/mon-espace/contrats", label: "Contrats", Icon: FileText, exact: false },
  { href: "/mon-espace/profil", label: "Mon profil", Icon: User, exact: false },
];

export default function MonEspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-[1100px] px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/mon-espace" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
              <Building2 size={12} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Enya<span className="text-primary-600">Rent</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/agencies"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 hover:text-slate-900 transition-colors"
            >
              <Search size={13} />
              Chercher un bien
            </Link>
            <button
              onClick={handleSignOut}
              className="h-8 px-3 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1100px] px-6 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-4">
        <div className="mx-auto max-w-[1100px] px-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} EnyaRent — Votre espace locataire
        </div>
      </footer>
    </div>
  );
}
