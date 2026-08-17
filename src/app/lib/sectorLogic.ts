// src/lib/sector-logic.ts
// Logiques métier communes aux 4 secteurs — appelées depuis les API routes

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectorMeta = Record<string, unknown>;

export interface KmReturnResult {
  kmDepart: number;
  kmRetour: number;
  kmParcourus: number;
  kmForfait: number;
  kmDepassement: number;
  fraisDepassement: number;
  extraKmRate: number;
}

export interface ScheduleLine {
  month: number;          // 1-based
  year: number;
  dueDate: Date;
  amount: number;
  status: "PAID" | "DUE" | "LATE";
  paymentId: string | null;
}

export interface DepositResolution {
  depositTotal: number;
  deductions: { reason: string; amount: number }[];
  totalDeducted: number;
  refundAmount: number;
}

// ─── VÉHICULE : calcul retour kilométrique ────────────────────────────────────

export function calcKmReturn(
  kmDepart: number,
  kmRetour: number,
  kmForfait: number,      // km inclus dans le contrat
  extraKmRate: number     // MAD par km dépassé
): KmReturnResult {
  const kmParcourus = kmRetour - kmDepart;
  const kmDepassement = Math.max(0, kmParcourus - kmForfait);
  const fraisDepassement = kmDepassement * extraKmRate;

  return {
    kmDepart,
    kmRetour,
    kmParcourus,
    kmForfait,
    kmDepassement,
    fraisDepassement,
    extraKmRate,
  };
}

// Vérifie les alertes assurance / vignette d'un véhicule
export function checkVehicleAlerts(meta: SectorMeta): string[] {
  const alerts: string[] = [];
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (meta.insuranceExpiry) {
    const expiry = new Date(meta.insuranceExpiry as string);
    if (expiry < today) alerts.push("assurance_expired");
    else if (expiry < in30Days) alerts.push("assurance_expiring_soon");
  }

  if (meta.vignetteExpiry) {
    const expiry = new Date(meta.vignetteExpiry as string);
    if (expiry < today) alerts.push("vignette_expired");
    else if (expiry < in30Days) alerts.push("vignette_expiring_soon");
  }

  return alerts;
}

// ─── IMMOBILIER : génération de l'échéancier mensuel ─────────────────────────

export function generateMonthlySchedule(
  startDate: Date,
  endDate: Date,
  monthlyAmount: number,
  paidPayments: { createdAt: Date; amount: number }[]
): ScheduleLine[] {
  const schedule: ScheduleLine[] = [];
  const today = new Date();

  const current = new Date(startDate);
  current.setDate(1); // toujours le 1er du mois

  while (current <= endDate) {
    const dueDate = new Date(current);
    const month = dueDate.getMonth() + 1;
    const year = dueDate.getFullYear();

    // Cherche un paiement correspondant à ce mois
    const payment = paidPayments.find((p) => {
      const d = new Date(p.createdAt);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });

    let status: ScheduleLine["status"] = "DUE";
    if (payment) {
      status = "PAID";
    } else if (dueDate < today) {
      status = "LATE";
    }

    schedule.push({
      month,
      year,
      dueDate,
      amount: monthlyAmount,
      status,
      paymentId: payment ? null : null, // enrichi côté appelant si besoin
    });

    current.setMonth(current.getMonth() + 1);
  }

  return schedule;
}

// Calcul de la révision de loyer selon l'IPC marocain (Indice des Prix à la Consommation)
// Formule : nouveau_loyer = loyer_actuel × (IPC_nouveau / IPC_reference)
export function calcRentRevision(
  currentRent: number,
  ipcReference: number,
  ipcNew: number
): { newRent: number; increase: number; increasePercent: number } {
  const newRent = Math.round((currentRent * ipcNew) / ipcReference);
  const increase = newRent - currentRent;
  const increasePercent = ((increase / currentRent) * 100);

  return { newRent, increase, increasePercent };
}

// ─── ÉQUIPEMENT : workflow caution ───────────────────────────────────────────

export function calcDepositResolution(
  depositTotal: number,
  deductions: { reason: string; amount: number }[]
): DepositResolution {
  const totalDeducted = deductions.reduce((sum, d) => sum + d.amount, 0);
  const refundAmount = Math.max(0, depositTotal - totalDeducted);

  return {
    depositTotal,
    deductions,
    totalDeducted,
    refundAmount,
  };
}

// Compare état entrée vs sortie pour déterminer les déductions suggérées
export function compareInspectionStates(
  entryCondition: string,   // "NEW" | "GOOD" | "FAIR" | "POOR"
  exitCondition: string,
  replacementValue: number
): { reason: string; amount: number }[] {
  const conditionRank: Record<string, number> = {
    NEW: 4,
    GOOD: 3,
    FAIR: 2,
    POOR: 1,
  };

  const entryRank = conditionRank[entryCondition] ?? 3;
  const exitRank = conditionRank[exitCondition] ?? 3;
  const degradation = entryRank - exitRank;

  if (degradation <= 0) return []; // pas de dégradation

  const deductions: { reason: string; amount: number }[] = [];

  if (degradation === 1) {
    // Usure normale légère → déduction 10%
    deductions.push({
      reason: `Dégradation légère (${entryCondition} → ${exitCondition})`,
      amount: Math.round(replacementValue * 0.1),
    });
  } else if (degradation === 2) {
    // Dégradation significative → 25%
    deductions.push({
      reason: `Dégradation significative (${entryCondition} → ${exitCondition})`,
      amount: Math.round(replacementValue * 0.25),
    });
  } else {
    // Dégradation majeure → 50%
    deductions.push({
      reason: `Dégradation majeure (${entryCondition} → ${exitCondition})`,
      amount: Math.round(replacementValue * 0.5),
    });
  }

  return deductions;
}

// ─── HÔTELLERIE : calcul suppléments ─────────────────────────────────────────

export interface HotelSupplement {
  code: string;
  label: string;
  amount: number;
  nights?: number;
}

export function calcHotelTotal(
  pricePerNight: number,
  nights: number,
  supplements: HotelSupplement[]
): {
  baseAmount: number;
  supplementsTotal: number;
  total: number;
  breakdown: { label: string; amount: number }[];
} {
  const baseAmount = pricePerNight * nights;
  const breakdown: { label: string; amount: number }[] = [
    { label: `${nights} nuit(s) × ${pricePerNight} MAD`, amount: baseAmount },
  ];

  let supplementsTotal = 0;
  for (const sup of supplements) {
    const amount = sup.nights ? sup.amount * sup.nights : sup.amount;
    supplementsTotal += amount;
    breakdown.push({ label: sup.label, amount });
  }

  return {
    baseAmount,
    supplementsTotal,
    total: baseAmount + supplementsTotal,
    breakdown,
  };
}

// Calcul nombre de nuits entre check-in et check-out
export function calcNights(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}