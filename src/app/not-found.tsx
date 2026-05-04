import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-primary-600 mb-2 tabular-nums">404</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Page introuvable
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-sm">
          Cette page n'existe pas ou a ete deplacee.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Home size={16} />
          Retour a l'accueil
        </Link>
      </div>
    </div>
  );
}
