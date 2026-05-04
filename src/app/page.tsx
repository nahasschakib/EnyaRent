import Link from "next/link";
import {
  Building2, Car, Hotel, Wrench,
  Check, ArrowRight, ChevronRight,
  FileText, PenLine, CreditCard, Users, MessageSquare, BarChart3,
  Star,X, AlertCircle, CheckCircle2,
} from "lucide-react";
import { PricingToggle } from "@/components/landing/pricing-toggle";
import type { Plan } from "@/components/landing/pricing-toggle";

// ── Data ─────────────────────────────────────────────────────────

const sectors = [
  {
    icon: Building2, label: "Immobilier",
    description: "Gestion complète des baux résidentiels et commerciaux",
    iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
    accentBar: "bg-indigo-600", badgeBg: "bg-indigo-50 text-indigo-700",
    features: ["Baux longue durée conformes droit marocain", "Révision loyer selon indice IPC", "Gestion multi-propriétaires", "États des lieux digitaux"],
  },
  {
    icon: Car, label: "Véhicules",
    description: "Pilotez votre flotte de la réservation au retour",
    iconBg: "bg-cyan-50", iconColor: "text-cyan-600",
    accentBar: "bg-cyan-600", badgeBg: "bg-cyan-50 text-cyan-700",
    features: ["Location courte et longue durée", "Gestion flotte & kilométrage", "Suivi assurances et vignettes", "Contrats de location conformes"],
  },
  {
    icon: Hotel, label: "Hôtellerie",
    description: "Check-in, check-out et disponibilités en temps réel",
    iconBg: "bg-violet-50", iconColor: "text-violet-600",
    accentBar: "bg-violet-600", badgeBg: "bg-violet-50 text-violet-700",
    features: ["Booking par nuit, check-in/out", "Gestion chambres et types", "Options et suppléments", "Facturation automatique"],
  },
  {
    icon: Wrench, label: "Équipements",
    description: "Location de matériel avec suivi de caution et d'usure",
    iconBg: "bg-amber-50", iconColor: "text-amber-600",
    accentBar: "bg-amber-600", badgeBg: "bg-amber-50 text-amber-700",
    features: ["Tarification /heure, /jour, /semaine", "Caution et état matériel", "Suivi usure et maintenance", "Formulaires entrée/sortie signés"],
  },
];

const keyFeatures = [
  { icon: FileText, title: "Contrats PDF conformes", description: "Générez des contrats conformes au droit marocain en un clic. 4 templates sectoriels inclus.", color: "text-primary-600", bg: "bg-primary-50" },
  { icon: PenLine, title: "E-signature YouSign", description: "Envoyez et collectez des signatures électroniques légalement valides. Archivage automatique.", color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: CreditCard, title: "Paiements MAD en ligne", description: "Acceptez les paiements par carte bancaire marocaine (CMI), virement et mobile money via DGateway.", color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: Users, title: "Portail client dédié", description: "Vos locataires accèdent à leurs contrats, paient et ouvrent des tickets depuis leur espace.", color: "text-violet-600", bg: "bg-violet-50" },
  { icon: MessageSquare, title: "Tickets GitHub-style", description: "Système de tickets complet avec labels, priorités, assignations et fil de commentaires.", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: BarChart3, title: "Analytics & reporting", description: "Taux d'occupation, ROI par asset, revenus par secteur — export Excel en un clic.", color: "text-emerald-600", bg: "bg-emerald-50" },
];

const testimonials = [
  {
    initials: "KA", name: "Karim Alaoui", role: "Directeur", org: "Alaoui Immobilier, Casablanca",
    avatarBg: "bg-indigo-600",
    quote: "EnyaRent a remplacé Excel, Word et notre vieux système de caisse. Nos contrats sont générés en 30 secondes, signés à distance. Gain de temps énorme.",
  },
  {
    initials: "SB", name: "Salma Benali", role: "Responsable opérations", org: "Atlas Car Rental, Marrakech",
    avatarBg: "bg-cyan-600",
    quote: "La gestion de flotte et les contrats sont parfaitement adaptés au marché marocain. Le portail client a réduit nos appels de 60%.",
  },
  {
    initials: "YM", name: "Youssef Mansouri", role: "Gérant", org: "Riad Collection, Fès",
    avatarBg: "bg-violet-600",
    quote: "En hôtellerie, la gestion des disponibilités et la facturation automatique sont des gains réels. Nos équipes l'ont adopté en une journée.",
  },
];

const plans: Plan[] = [
  {
    name: "Free", priceMonthly: "0", priceAnnual: "0", period: "/ mois",
    description: "Pour tester sans engagement.",
    cta: "Démarrer gratuitement", href: "/auth/sign-up", featured: false,
    features: ["1 organisation", "10 assets maximum", "1 module au choix", "Contrats PDF basiques", "Support email"],
  },
  {
    name: "Starter", priceMonthly: "499", priceAnnual: "399", period: "MAD / mois",
    description: "Pour agences en croissance.",
    cta: "Commencer", href: "/auth/sign-up", featured: false,
    features: ["1 organisation", "50 assets maximum", "2 modules au choix", "Contrats conformes droit marocain", "E-signature YouSign", "Paiements DGateway", "Support prioritaire"],
  },
  {
    name: "Pro", priceMonthly: "1 299", priceAnnual: "1 039", period: "MAD / mois",
    description: "Pour PME multi-secteurs.",
    cta: "Passer au Pro", href: "/auth/sign-up", featured: true,
    features: ["Organisations illimitées", "Assets illimités", "4 modules secteurs", "Portail client dédié", "Analytics & export Excel", "Multi-devises MAD/EUR/USD", "Accès API", "Support dédié"],
  },
];

const trustBadges = [
  { label: "CMI", sub: "Paiement CB marocain" },
  { label: "YouSign", sub: "E-signature légale" },
  { label: "Neon", sub: "Base de données" },
  { label: "Vercel", sub: "Infrastructure" },
  { label: "Cloudflare R2", sub: "Stockage sécurisé" },
  { label: "Better Auth", sub: "Authentification" },
];

const stats = [
  { value: "500+", label: "agences utilisatrices" },
  { value: "12 000+", label: "contrats générés" },
  { value: "99.9%", label: "uptime garanti" },
];

const footerLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Connexion", href: "/auth/sign-in" },
  { label: "Créer un compte", href: "/auth/sign-up" },
];

// const socialLinks = [
//   { icon: Linkedin, label: "LinkedIn" },
//   { icon: Github, label: "GitHub" },
// ];

const legalLinks = ["Confidentialité", "CGU", "Mentions légales"];

// ── Page ─────────────────────────────────────────────────────────

export default async function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        .anim-fade-up { animation: fadeUp 0.55s ease-out both; }
        .anim-fade-in { animation: fadeIn 0.4s ease-out both; }
        .delay-1 { animation-delay: 0.10s; }
        .delay-2 { animation-delay: 0.22s; }
        .delay-3 { animation-delay: 0.36s; }
        .delay-4 { animation-delay: 0.50s; }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }

        .sector-card { transition: box-shadow 150ms ease-out, transform 150ms ease-out; }
        .sector-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04); transform: scale(1.01); }

        .feature-card { transition: box-shadow 150ms ease-out, border-color 150ms ease-out; }
        .feature-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); border-color: #CBD5E1; }

        .testimonial-card { transition: box-shadow 150ms ease-out, transform 150ms ease-out; }
        .testimonial-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); transform: translateY(-2px); }
      `}</style>

      <div className="min-h-screen bg-slate-50">

        {/* ══ NAVBAR ══ */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <Building2 size={14} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Enya<span className="text-primary-600">Rent</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Fonctionnalités</a>
              <a href="#sectors"  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Secteurs</a>
              <a href="#pricing"  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tarifs</a>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5">
                {["FR", "AR", "EN"].map((lang, i) => (
                  <span
                    key={lang}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      i === 0 ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
              <Link
                href="/auth/sign-in"
                className="hidden sm:inline-flex h-9 px-4 items-center text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Démarrer <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </header>

        {/* ══ HERO ══ */}
        <section
          className="pt-20 pb-24 relative overflow-hidden"
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, #FFF7ED 0%, #F8FAFC 65%)" }}
        >
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <div className="anim-fade-in inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 pulse-dot" />
              Conçu pour le marché marocain · Multi-devises MAD / EUR / USD
            </div>

            <h1 className="anim-fade-up delay-1 text-[52px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 max-w-3xl mx-auto mb-5">
              Gérez toutes vos locations<br />
              depuis <span className="text-primary-600">une seule plateforme</span>
            </h1>

            <p className="anim-fade-up delay-2 text-lg text-slate-600 max-w-[600px] mx-auto mb-8 leading-relaxed">
              EnyaRent remplace Excel, Word et 3 outils séparés — contrats PDF conformes droit marocain, e-signature, paiements DGateway et portail client inclus.
            </p>

            <div className="anim-fade-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
              >
                Démarrer gratuitement <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <div className="anim-fade-up delay-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TRUST LOGOS ══ */}
        <section className="py-8 bg-white border-y border-slate-100">
          <div className="mx-auto max-w-[1200px] px-6">
            <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-6">
              Construit avec les meilleures technologies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {trustBadges.map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">{b.label}</span>
                  <span className="text-[10px] text-slate-400">{b.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PROBLÈME → SOLUTION ══ */}
        <section className="py-24 bg-slate-50">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Le problème</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">
                Vous gérez encore avec 5 outils séparés ?
              </h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                La majorité des agences marocaines perdent des heures chaque semaine entre Excel, Word, WhatsApp et leurs reçus papier.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="p-7 rounded-2xl border border-red-100 bg-red-50">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <X size={12} className="text-red-500" />
                  </span>
                  <span className="text-sm font-semibold text-red-600">Avant EnyaRent</span>
                </div>
                <ul className="space-y-3">
                  {[
                    "Contrats Word re-saisis manuellement",
                    "Suivi des loyers sur Excel",
                    "WhatsApp pour les réclamations",
                    "Reçus papier perdus ou mal classés",
                    "Aucune visibilité temps réel",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-red-700">
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-7 rounded-2xl border border-emerald-100 bg-emerald-50">
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check size={12} className="text-emerald-500" />
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">Avec EnyaRent</span>
                </div>
                <ul className="space-y-3">
                  {[
                    "Contrats PDF générés en 30 secondes",
                    "Tableau de bord unifié temps réel",
                    "Portail client + tickets structurés",
                    "Quittances envoyées automatiquement",
                    "Analytics et ROI par asset",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-emerald-700">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 4 SECTEURS ══ */}
        <section id="sectors" className="py-24 bg-white">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Multi-secteurs</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">Un outil pour chaque secteur</h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Activez uniquement les modules dont votre agence a besoin. Chaque secteur dispose de ses propres templates et workflows.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sectors.map((sector) => {
                const Icon = sector.icon;
                return (
                  <div key={sector.label} className="sector-card relative flex flex-col p-7 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
                    <div className={`absolute top-0 left-6 right-6 h-0.5 rounded-b-full ${sector.accentBar}`} />
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${sector.iconBg}`}>
                      <Icon size={22} className={sector.iconColor} />
                    </div>
                    <span className={`self-start mb-3 px-2 py-0.5 rounded-full text-[11px] font-semibold ${sector.badgeBg}`}>
                      {sector.label}
                    </span>
                    <p className="text-sm text-slate-500 mb-5 leading-relaxed">{sector.description}</p>
                    <ul className="flex flex-col gap-2 mb-6 flex-1">
                      {sector.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check size={13} className={`mt-0.5 shrink-0 ${sector.iconColor}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href="#pricing" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors">
                      En savoir plus <ChevronRight size={13} />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ 6 KEY FEATURES ══ */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Fonctionnalités</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">Tout ce dont votre agence a besoin</h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Une plateforme complète du contrat à la quittance, avec zéro paperasse.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {keyFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="feature-card flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feat.bg}`}>
                      <Icon size={20} className={feat.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{feat.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Témoignages</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900">Ils font confiance à EnyaRent</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="testimonial-card flex flex-col p-7 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)]">
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${t.avatarBg}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role} · {t.org}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRICING ══ */}
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Tarifs</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">Des tarifs clairs, sans surprise</h2>
              <p className="text-base text-slate-600 max-w-md mx-auto">Commencez gratuitement. Évoluez selon vos besoins.</p>
            </div>
            <PricingToggle plans={plans} />
          </div>
        </section>

        {/* ══ CTA FINAL ══ */}
        <section className="py-24 relative overflow-hidden" style={{ background: "#0F172A" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(234,88,12,0.22) 0%, transparent 70%)" }}
          />
          <div className="relative mx-auto max-w-[1200px] px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-4">
              Prêt à commencer ?
            </p>
            <h2 className="text-[48px] font-bold tracking-[-0.025em] text-white mb-5 leading-[1.08]">
              Lancez votre agence<br />
              en <span className="text-orange-400">5 minutes</span>
            </h2>
            <p className="text-base text-slate-400 max-w-md mx-auto mb-10">
              Créez votre compte gratuitement. Aucune carte bancaire requise. Upgradez quand vous êtes prêt.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Créer mon compte gratuitement <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center h-12 px-8 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:border-slate-500 hover:text-white transition-colors"
              >
                Se connecter
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold text-white tabular-nums">{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="bg-white border-t border-slate-200">
          <div className="mx-auto max-w-[1200px] px-6 py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
              <div className="flex flex-col gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                    <Building2 size={14} className="text-white" />
                  </div>
                  <span className="text-base font-bold text-slate-900">
                    Enya<span className="text-primary-600">Rent</span>
                  </span>
                </Link>
                <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
                  La plateforme locative tout-en-un pour agences et PME marocaines.
                </p>
              </div>

              <nav className="flex flex-wrap gap-x-8 gap-y-3">
                {footerLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* <div className="flex items-center gap-2">
                {socialLinks.map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div> */}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} EnyaRent. Tous droits réservés.
              </p>
              <div className="flex items-center gap-5">
                {legalLinks.map((l) => (
                  <a key={l} href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
