"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Erreur");
      }

      toast.success("Organisation créée avec succès");
      router.push("/dashboard");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900">EnyaRent</span>
          </div>
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Créer votre organisation</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Donnez un nom à votre espace de gestion.
            <br />
            Vous pourrez le modifier plus tard.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">
                Nom de l'organisation
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ex: Immobilière Alami, Fleet Auto..."
                required
                autoFocus
                className={cn(
                  "w-full h-11 px-4 border border-slate-200 rounded-lg text-sm",
                  "bg-white text-slate-900 placeholder:text-slate-400",
                  "focus:outline-none focus:border-primary-600 transition-colors"
                )}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                "Continuer vers le dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
