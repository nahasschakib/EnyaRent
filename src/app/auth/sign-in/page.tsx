"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (error) {
        toast.error(
          error.message === "Invalid credentials"
            ? "Email ou mot de passe incorrect"
            : error.message ?? "Erreur de connexion"
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erreur de connexion");
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
          <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
          <p className="text-sm text-slate-500 mt-1">Accédez à votre espace de gestion</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary-600 hover:text-primary-700 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Pas encore de compte ?{" "}
          <Link
            href="/auth/sign-up"
            className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
