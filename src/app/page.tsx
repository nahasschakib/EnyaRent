import Link from "next/link";
import {
  Building2, Car, Hotel, Wrench,
  Check, ArrowRight, ChevronRight,
  FileText, PenLine, CreditCard, Users, MessageSquare, BarChart3,
  Star, X, AlertCircle, CheckCircle2,
  Shield, TrendingUp,
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

const statsWithIcons = [
  { value: "500+", label: "agences", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { value: "12 000+", label: "contrats", icon: FileText, color: "text-primary-600", bg: "bg-primary-50", border: "border-orange-100" },
  { value: "99.9%", label: "uptime", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
];

const howItWorks = [
  {
    step: "01",
    icon: Building2,
    title: "Créez votre asset",
    description: "Ajoutez votre bien, véhicule, chambre ou équipement en quelques clics. Photos, caractéristiques, tarifs inclus.",
    iconBg: "bg-primary-50",
    iconColor: "text-primary-600",
    numColor: "text-orange-100",
  },
  {
    step: "02",
    icon: FileText,
    title: "Générez le contrat PDF",
    description: "Sélectionnez le template sectoriel. Le contrat est pré-rempli automatiquement, conforme au droit marocain.",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    numColor: "text-indigo-100",
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Collectez signature & paiement",
    description: "Envoyez pour e-signature YouSign. Activez les paiements DGateway en MAD, EUR ou USD.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    numColor: "text-emerald-100",
  },
];

const keyFeatures = [
  { icon: FileText, title: "Contrats PDF conformes", description: "Générez des contrats conformes au droit marocain en un clic. 4 templates sectoriels inclus.", color: "text-primary-600", bg: "bg-primary-50", previewType: "pdf" },
  { icon: PenLine, title: "E-signature YouSign", description: "Envoyez et collectez des signatures électroniques légalement valides. Archivage automatique.", color: "text-indigo-600", bg: "bg-indigo-50", previewType: "signature" },
  { icon: CreditCard, title: "Paiements MAD en ligne", description: "Acceptez les paiements par carte bancaire marocaine (CMI), virement et mobile money via DGateway.", color: "text-cyan-600", bg: "bg-cyan-50", previewType: "payment" },
  { icon: Users, title: "Portail client dédié", description: "Vos locataires accèdent à leurs contrats, paient et ouvrent des tickets depuis leur espace.", color: "text-violet-600", bg: "bg-violet-50", previewType: "portal" },
  { icon: MessageSquare, title: "Tickets GitHub-style", description: "Système de tickets complet avec labels, priorités, assignations et fil de commentaires.", color: "text-amber-600", bg: "bg-amber-50", previewType: "tickets" },
  { icon: BarChart3, title: "Analytics & reporting", description: "Taux d'occupation, ROI par asset, revenus par secteur — export Excel en un clic.", color: "text-emerald-600", bg: "bg-emerald-50", previewType: "analytics" },
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

const faqItems = [
  {
    q: "Est-ce qu'EnyaRent est conforme au droit marocain ?",
    a: "Oui. Tous nos templates de contrats sont conformes au droit marocain en vigueur — baux résidentiels, commerciaux, contrats de location de véhicules et d'équipements. Nos juristes valident chaque template sectoriel régulièrement.",
  },
  {
    q: "Quels secteurs de location sont supportés ?",
    a: "EnyaRent supporte 4 secteurs : immobilier (baux résidentiels et commerciaux), véhicules (location courte et longue durée), hôtellerie et maisons d'hôtes, et équipements (matériel industriel, événementiel, etc.). Vous activez uniquement les modules dont vous avez besoin.",
  },
  {
    q: "Comment fonctionne la signature électronique ?",
    a: "EnyaRent intègre YouSign, plateforme de e-signature légalement reconnue au Maroc et en Europe. Votre client reçoit un email, signe depuis son téléphone ou PC — aucune installation requise. L'original signé est archivé automatiquement dans votre espace.",
  },
  {
    q: "Puis-je accepter des paiements en dirhams (MAD) ?",
    a: "Oui. Nous intégrons DGateway qui supporte les paiements par carte bancaire marocaine (CMI), virement bancaire et mobile money. Vous pouvez aussi encaisser en EUR et USD pour vos clients internationaux, tout depuis le même tableau de bord.",
  },
  {
    q: "Y a-t-il un engagement ou une durée minimum ?",
    a: "Non. EnyaRent est sans engagement. Commencez gratuitement, passez à un plan payant quand vous êtes prêt, et annulez à tout moment. Le plan Free reste disponible indéfiniment avec jusqu'à 10 assets.",
  },
];

const footerLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "Connexion", href: "/auth/sign-in" },
  { label: "Créer un compte", href: "/auth/sign-up" },
];

const legalLinks = ["Confidentialité", "CGU", "Mentions légales"];

// ── Feature Preview Illustrations ────────────────────────────────

function FeatureIllustration({ type }: { type: string }) {
  if (type === "pdf") {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-orange-50 to-orange-100/70 flex items-center justify-center gap-2 overflow-hidden">
        <div className="flex items-end gap-2">
          <div className="w-11 h-14 bg-white rounded-lg shadow border border-orange-200/60 p-1.5 flex flex-col gap-1 rotate-[-5deg]">
            <div className="h-1 w-6 bg-orange-300 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-4/5 bg-slate-200 rounded-full" />
          </div>
          <div className="w-12 h-16 bg-white rounded-lg shadow-md border border-orange-200 p-1.5 flex flex-col gap-1">
            <div className="h-1 w-7 bg-orange-400 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-3/4 bg-slate-200 rounded-full" />
            <div className="mt-auto flex items-center justify-center py-0.5 bg-orange-500 rounded-sm -mx-1.5 -mb-1.5">
              <span className="text-[7px] text-white font-bold tracking-wider">PDF</span>
            </div>
          </div>
          <div className="w-10 h-12 bg-white rounded-lg shadow border border-orange-200/60 p-1.5 flex flex-col gap-1 rotate-[4deg] -ml-2 mb-1">
            <div className="h-0.5 w-5 bg-orange-300 rounded-full" />
            <div className="h-0.5 w-full bg-slate-200 rounded-full" />
            <div className="h-0.5 w-4/5 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    );
  }
  if (type === "signature") {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-indigo-50 to-indigo-100/70 flex items-center justify-center px-6">
        <div className="w-full max-w-[200px] bg-white rounded-xl shadow border border-indigo-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <div className="h-1 w-24 bg-slate-200 rounded-full" />
          </div>
          <div className="border-b border-dashed border-slate-300 pb-1.5 mb-2 flex items-end justify-between">
            <span className="text-[12px] italic text-indigo-600 font-medium" style={{ fontFamily: "Georgia, serif" }}>Karim Alaoui</span>
            <PenLine size={10} className="text-indigo-400 mb-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center">
              <Check size={6} className="text-emerald-600" />
            </div>
            <span className="text-[9px] text-slate-400">Signé · 12 Jan 2025</span>
          </div>
        </div>
      </div>
    );
  }
  if (type === "payment") {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-cyan-50 to-cyan-100/70 flex items-center justify-center gap-3 px-4">
        <div className="w-36 h-20 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-3 flex flex-col justify-between shadow-md">
          <div className="flex justify-between items-start">
            <div className="w-6 h-4 bg-yellow-300/80 rounded-sm" />
            <span className="text-[8px] text-white/70 font-semibold">CMI</span>
          </div>
          <div>
            <div className="text-[8px] text-white/60 mb-0.5">Montant</div>
            <div className="text-sm font-bold text-white">4 500 MAD</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {["MAD", "EUR", "USD"].map((c, i) => (
            <div key={c} className={`text-[9px] px-2 py-0.5 rounded font-semibold ${i === 0 ? "bg-cyan-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
              {c}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "portal") {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-violet-50 to-violet-100/70 flex items-center justify-center px-4">
        <div className="w-full max-w-[200px] bg-white rounded-xl shadow border border-violet-200/60 overflow-hidden">
          <div className="bg-violet-600 px-3 py-2 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
              <Users size={8} className="text-white" />
            </div>
            <span className="text-[9px] text-white font-medium">Mon espace client</span>
          </div>
          <div className="p-2.5 flex flex-col gap-1.5">
            {[
              { label: "Contrat signé", dot: "bg-emerald-400" },
              { label: "Loyer · Jan 2025", dot: "bg-blue-400" },
              { label: "1 ticket ouvert", dot: "bg-amber-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                <span className="text-[9px] text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (type === "tickets") {
    return (
      <div className="w-full h-28 bg-gradient-to-br from-amber-50 to-amber-100/70 flex items-center justify-center px-4">
        <div className="w-full max-w-[220px] flex flex-col gap-1.5">
          {[
            { title: "Fuite robinet Appt 3B", label: "Urgent", labelBg: "bg-red-100 text-red-600", dot: "bg-red-400" },
            { title: "Révision loyer · Bail 2025", label: "Normal", labelBg: "bg-amber-100 text-amber-600", dot: "bg-amber-400" },
            { title: "Renouvellement contrat", label: "Fermé", labelBg: "bg-slate-100 text-slate-500", dot: "bg-slate-300" },
          ].map((ticket) => (
            <div key={ticket.title} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-1.5 border border-amber-200/60 shadow-sm">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ticket.dot}`} />
              <span className="text-[9px] text-slate-700 flex-1 truncate">{ticket.title}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${ticket.labelBg}`}>{ticket.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (type === "analytics") {
    const bars = [32, 48, 40, 66, 54, 80, 68];
    return (
      <div className="w-full h-28 bg-gradient-to-br from-emerald-50 to-emerald-100/70 flex flex-col justify-end px-5 pb-3 pt-3">
        <div className="text-[9px] text-emerald-700 font-medium mb-2 flex items-center gap-1">
          <TrendingUp size={9} />
          Revenus mensuels
        </div>
        <div className="flex items-end gap-1 h-12">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-emerald-500" : "bg-emerald-200"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// ── Dashboard Mockup ──────────────────────────────────────────────

function DashboardMockup() {
  const kpis = [
    { label: "Assets", value: "125", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Réservations", value: "48", color: "text-primary-600", bg: "bg-primary-50" },
    { label: "Revenus", value: "12K MAD", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Occupation", value: "94%", color: "text-cyan-600", bg: "bg-cyan-50" },
  ];
  const bars = [30, 46, 36, 62, 50, 76, 60];
  const rows = [
    { name: "Appt. Maarif", type: "Immo", amount: "4 500 MAD", dot: "bg-emerald-400" },
    { name: "Range Rover 24", type: "Auto", amount: "1 200 MAD/j", dot: "bg-blue-400" },
    { name: "Suite Atlas", type: "Hôtel", amount: "850 MAD/n", dot: "bg-violet-400" },
  ];
  const navItems = ["Dashboard", "Assets", "Contrats", "Paiements"];

  return (
    <div className="relative">
      <div className="mockup-float relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        {/* Browser chrome */}
        <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-2 border-b border-slate-200">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4 bg-white rounded h-5 flex items-center px-2.5">
            <span className="text-[10px] text-slate-400">app.enyarent.ma/dashboard</span>
          </div>
        </div>

        {/* App layout */}
        <div className="bg-slate-50 p-3 flex gap-3" style={{ minHeight: "320px" }}>
          {/* Sidebar */}
          <div className="w-28 bg-white rounded-xl p-2.5 flex flex-col gap-1 shrink-0 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 px-1">
              <div className="w-4 h-4 rounded-md bg-primary-600 flex items-center justify-center">
                <Building2 size={8} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-slate-900">EnyaRent</span>
            </div>
            {navItems.map((item, i) => (
              <div
                key={item}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 ${i === 0 ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white/60" : "bg-slate-300"}`} />
                <span className="text-[9px] font-medium">{item}</span>
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 flex flex-col gap-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-900">Tableau de bord</span>
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">KA</div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-1.5">
              {kpis.map((kpi) => (
                <div key={kpi.label} className={`rounded-lg p-2 border border-slate-100 bg-white`}>
                  <div className="text-[8px] text-slate-400 mb-0.5">{kpi.label}</div>
                  <div className={`text-[11px] font-bold ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl p-3 border border-slate-100">
              <div className="text-[9px] text-slate-500 mb-2">Revenus mensuels (MAD)</div>
              <div className="flex items-end gap-1" style={{ height: "52px" }}>
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-primary-500" : "bg-primary-100"}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex-1">
              <div className="text-[9px] text-slate-500 mb-2">Dernières réservations</div>
              <div className="flex flex-col gap-1.5">
                {rows.map((row) => (
                  <div key={row.name} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`} />
                    <span className="text-[9px] text-slate-700 flex-1 truncate">{row.name}</span>
                    <span className="text-[8px] text-slate-400 shrink-0">{row.type}</span>
                    <span className="text-[9px] font-medium text-slate-700 shrink-0">{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating: payment received */}
      <div className="notif-right absolute -top-4 -right-5 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CreditCard size={12} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-900">Paiement reçu</div>
          <div className="text-[10px] text-emerald-600 font-bold">+2 400 MAD</div>
        </div>
      </div>

      {/* Floating: contract signed */}
      <div className="notif-left absolute -bottom-4 -left-5 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={12} className="text-indigo-600" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-900">Contrat signé</div>
          <div className="text-[10px] text-slate-500">Bail · Appt. Maarif 3B</div>
        </div>
      </div>
    </div>
  );
}

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
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .anim-fade-up { animation: fadeUp 0.55s ease-out both; }
        .anim-fade-in { animation: fadeIn 0.4s ease-out both; }
        .delay-1 { animation-delay: 0.10s; }
        .delay-2 { animation-delay: 0.22s; }
        .delay-3 { animation-delay: 0.36s; }
        .delay-4 { animation-delay: 0.50s; }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        .mockup-float { animation: floatY 5s ease-in-out infinite; }
        .notif-right { animation: slideInRight 0.6s 1.0s ease-out both; }
        .notif-left  { animation: slideInLeft  0.6s 0.8s ease-out both; }

        .sector-card { transition: box-shadow 150ms ease-out, transform 150ms ease-out; }
        .sector-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.04); transform: scale(1.01); }

        .feature-card { transition: box-shadow 150ms ease-out, border-color 150ms ease-out; }
        .feature-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); border-color: #CBD5E1; }

        .testimonial-card { transition: box-shadow 150ms ease-out, transform 150ms ease-out; }
        .testimonial-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); transform: translateY(-2px); }

        .step-card { transition: box-shadow 150ms ease-out, transform 150ms ease-out; }
        .step-card:hover { box-shadow: 0 4px 6px -1px rgba(15,23,42,0.08); transform: translateY(-2px); }

        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        .faq-chevron { transition: transform 0.2s ease; display: flex; align-items: center; justify-content: center; }
        details[open] .faq-chevron { transform: rotate(180deg); }
        details .faq-body { animation: fadeIn 0.2s ease-out both; }
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
              <a href="#how"      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Comment ça marche</a>
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

        {/* ══ HERO — 2 colonnes ══ */}
        <section
          className="pt-16 pb-20 relative overflow-hidden"
          style={{ background: "radial-gradient(ellipse 90% 60% at 50% 0%, #FFF7ED 0%, #F8FAFC 65%)" }}
        >
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left: Text */}
              <div className="text-center lg:text-left">
                <div className="anim-fade-in inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-xs font-medium text-orange-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 pulse-dot" />
                  Conçu pour le marché marocain · MAD / EUR / USD
                </div>

                <h1 className="anim-fade-up delay-1 text-[46px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 mb-5">
                  Gérez toutes vos locations<br />
                  depuis <span className="text-primary-600">une seule plateforme</span>
                </h1>

                <p className="anim-fade-up delay-2 text-lg text-slate-600 mb-8 leading-relaxed max-w-[520px] mx-auto lg:mx-0">
                  EnyaRent remplace Excel, Word et 3 outils séparés — contrats PDF conformes droit marocain, e-signature, paiements DGateway et portail client inclus.
                </p>

                <div className="anim-fade-up delay-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
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

                {/* Stats Cards */}
                <div className="anim-fade-up delay-4 grid grid-cols-3 gap-3">
                  {statsWithIcons.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className={`flex flex-col items-center lg:items-start gap-2 p-4 rounded-xl border bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] ${s.border}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                          <Icon size={15} className={s.color} />
                        </div>
                        <div className="text-center lg:text-left">
                          <div className="text-xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Dashboard Mockup */}
              <div className="hidden lg:block relative px-8 py-8">
                <DashboardMockup />
              </div>

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

        {/* ══ COMMENT ÇA MARCHE ══ */}
        <section id="how" className="py-24 bg-white">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Simple & rapide</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">
                Opérationnel en 3 étapes
              </h2>
              <p className="text-base text-slate-600 max-w-md mx-auto">
                De la création de votre asset à l&apos;encaissement du paiement, tout se fait dans EnyaRent.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-0">
              {howItWorks.flatMap((step, index) => {
                const Icon = step.icon;
                const card = (
                  <div
                    key={step.step}
                    className="step-card flex-1 p-8 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] flex flex-col"
                  >
                    <div className="text-7xl font-black text-slate-100 leading-none mb-4 select-none">
                      {step.step}
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${step.iconBg}`}>
                      <Icon size={24} className={step.iconColor} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                );
                if (index < howItWorks.length - 1) {
                  return [
                    card,
                    <div key={`arrow-${index}`} className="hidden md:flex items-center justify-center self-center px-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <ArrowRight size={16} className="text-slate-400" />
                      </div>
                    </div>,
                  ];
                }
                return [card];
              })}
            </div>
          </div>
        </section>

        {/* ══ 4 SECTEURS ══ */}
        <section id="sectors" className="py-24 bg-slate-50">
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

        {/* ══ 6 KEY FEATURES — avec illustrations ══ */}
        <section id="features" className="py-24 bg-white">
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
                  <div key={feat.title} className="feature-card flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] overflow-hidden">
                    <FeatureIllustration type={feat.previewType} />
                    <div className="flex gap-4 p-5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${feat.bg}`}>
                        <Icon size={18} className={feat.color} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{feat.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{feat.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══ */}
        <section className="py-24 bg-slate-50">
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
        <section id="pricing" className="py-24 bg-white">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Tarifs</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">Des tarifs clairs, sans surprise</h2>
              <p className="text-base text-slate-600 max-w-md mx-auto">Commencez gratuitement. Évoluez selon vos besoins.</p>
            </div>
            <PricingToggle plans={plans} />
          </div>
        </section>

        {/* ══ CTA FINAL — avec formulaire email ══ */}
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

            {/* Email form */}
            <form action="/auth/sign-up" method="get" className="mb-4">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  name="email"
                  placeholder="votre@email.com"
                  required
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                >
                  Démarrer gratuitement <ArrowRight size={16} />
                </button>
              </div>
            </form>
            <p className="text-xs text-slate-600 mb-12">
              Aucune carte bancaire · Annulation à tout moment · Plan Free illimité dans le temps
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {statsWithIcons.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${s.bg} bg-opacity-10`}>
                      <Icon size={14} className="text-slate-400" />
                    </div>
                    <span className="text-xl font-bold text-white tabular-nums">{s.value}</span>
                    <span className="text-xs text-slate-500">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section className="py-24 bg-slate-50">
          <div className="mx-auto max-w-[760px] px-6">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">FAQ</p>
              <h2 className="text-[40px] font-bold tracking-[-0.02em] text-slate-900 mb-4">
                Questions fréquentes
              </h2>
              <p className="text-base text-slate-600 max-w-md mx-auto">
                Tout ce que vous devez savoir avant de commencer.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {faqItems.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.05)] overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-6 py-5 select-none">
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <span className="faq-chevron w-6 h-6 rounded-full bg-slate-100 shrink-0">
                      <ChevronRight size={14} className="text-slate-500 rotate-90" />
                    </span>
                  </summary>
                  <div className="faq-body px-6 pb-5">
                    <div className="h-px bg-slate-100 mb-4" />
                    <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500 mb-3">Vous avez une autre question ?</p>
              <a
                href="mailto:hello@enyarent.ma"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Contactez-nous <ArrowRight size={14} />
              </a>
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
