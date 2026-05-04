"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/onboarding",
      });

      if (error) {
        toast.error(
          error.message?.includes("email")
            ? "Cet email est déjà utilisé"
            : error.message ?? "Erreur lors de l'inscription"
        );
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = cn(
    "w-full h-11 px-4 border border-slate-200 rounded-lg text-sm",
    "bg-white text-slate-900 placeholder:text-slate-400",
    "focus:outline-none focus:border-primary-600 transition-colors"
  );

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
          <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
          <p className="text-sm text-slate-500 mt-1">Démarrez gratuitement</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">
                Nom complet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohamed Alami"
                required
                autoComplete="name"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                autoComplete="email"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={cn(inputClass, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email || !password}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Déjà un compte ?{" "}
          <Link
            href="/auth/sign-in"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
