"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Key,
  Search,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "PROFESSIONAL" | "OWNER" | "CLIENT";

const ROLE_CARDS = [
  {
    role: "PROFESSIONAL" as UserRole,
    Icon: Building2,
    title: "Agence / Entreprise",
    subtitle: "Société de location, agence immobilière",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    selectedRing: "ring-2 ring-indigo-500",
  },
  {
    role: "OWNER" as UserRole,
    Icon: Key,
    title: "Je mets en location",
    subtitle: "Louez votre voiture, appartement ou matériel",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    selectedRing: "ring-2 ring-amber-500",
  },
  {
    role: "CLIENT" as UserRole,
    Icon: Search,
    title: "Je cherche à louer",
    subtitle: "Trouvez et réservez un bien",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    selectedRing: "ring-2 ring-teal-500",
  },
] as const;

const inputClass = cn(
  "w-full h-11 px-4 border border-slate-200 rounded-lg text-sm",
  "bg-white text-slate-900 placeholder:text-slate-400",
  "focus:outline-none focus:border-primary-600 transition-colors"
);

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "form">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function selectRole(role: UserRole) {
    setSelectedRole(role);
    setStep("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    const displayName =
      selectedRole === "PROFESSIONAL"
        ? contactName.trim()
        : `${firstName.trim()} ${lastName.trim()}`.trim();

    if (!displayName) {
      toast.error("Veuillez renseigner votre nom");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.email({
        name: displayName,
        email,
        password,
      });

      if (error) {
        toast.error(
          error.message?.includes("email")
            ? "Cet email est déjà utilisé"
            : (error.message ?? "Erreur lors de l'inscription")
        );
        return;
      }

      const res = await fetch("/api/v1/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: selectedRole,
          companyName:
            selectedRole === "PROFESSIONAL" ? companyName.trim() : undefined,
          displayName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Erreur lors de la finalisation du compte");
        return;
      }

      toast.success("Compte créé avec succès !");
      router.push(selectedRole === "CLIENT" ? "/mon-espace" : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  }

  const Logo = () => (
    <div className="inline-flex items-center gap-2 mb-6">
      <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
        <span className="text-white font-bold text-lg">E</span>
      </div>
      <span className="text-xl font-bold text-slate-900">EnyaRent</span>
    </div>
  );

  /* ── Step 1: Role selection ── */
  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
            <p className="text-sm text-slate-500 mt-1">Quel est votre profil ?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {ROLE_CARDS.map(({ role, Icon, title, subtitle, iconBg, iconColor }) => (
              <button
                key={role}
                onClick={() => selectRole(role)}
                className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-primary-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                    iconBg
                  )}
                >
                  <Icon size={24} className={iconColor} />
                </div>
                <span className="font-semibold text-slate-900 text-sm mb-1">
                  {title}
                </span>
                <span className="text-xs text-slate-500 leading-snug">
                  {subtitle}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
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

  /* ── Step 2: Registration form ── */
  const card = ROLE_CARDS.find((c) => c.role === selectedRole)!;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-3">
            <card.Icon size={12} />
            {card.title}
          </div>
          <h1 className="text-xl font-bold text-slate-900">Créer votre compte</h1>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <button
            onClick={() => setStep("role")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-5"
          >
            <ArrowLeft size={14} />
            Changer de profil
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === "PROFESSIONAL" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Nom de l&apos;agence / entreprise
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Agence Alami Immobilier"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Votre nom complet
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Mohamed Alami"
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {(selectedRole === "OWNER" || selectedRole === "CLIENT") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mohamed"
                    required
                    autoComplete="given-name"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Alami"
                    required
                    autoComplete="family-name"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

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
              disabled={loading}
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
