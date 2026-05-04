"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Une erreur s'est produite
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-sm">
          Quelque chose s'est mal passe. Veuillez reessayer.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Reessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Home size={16} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
