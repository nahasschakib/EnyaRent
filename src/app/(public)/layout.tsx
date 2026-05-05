import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
              <Building2 size={12} className="text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Enya<span className="text-primary-600">Rent</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/agencies" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Toutes les agences
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="hidden sm:inline-flex h-8 px-3 items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Démarrer <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-primary-600 flex items-center justify-center">
              <Building2 size={10} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">
              Enya<span className="text-primary-600">Rent</span>
            </span>
          </Link>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} EnyaRent. Plateforme locative pour le Maroc.
          </p>
        </div>
      </footer>
    </div>
  );
}
