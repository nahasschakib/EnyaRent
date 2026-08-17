
// Styles partagés @react-pdf/renderer — brand EnyaRent

import { StyleSheet, Font } from "@react-pdf/renderer";

// ─── Couleurs brand ───────────────────────────────────────────────────────────

export const COLORS = {
  orange: "#EA580C",
  orangeLight: "#FFF7ED",
  orangeBorder: "#FDBA74",
  slate900: "#0F172A",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748B",
  slate400: "#94A3B8",
  slate200: "#E2E8F0",
  slate100: "#F1F5F9",
  slate50: "#F8FAFC",
  white: "#FFFFFF",
  red: "#DC2626",
  green: "#16A34A",
  greenLight: "#F0FDF4",
} as const;

// ─── Styles globaux partagés ──────────────────────────────────────────────────

export const sharedStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.slate900,
    backgroundColor: COLORS.white,
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.orange,
  },
  headerLeft: { flexDirection: "column", gap: 2 },
  headerRight: { flexDirection: "column", alignItems: "flex-end", gap: 2 },
  logo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COLORS.orange },
  logoTagline: { fontSize: 8, color: COLORS.slate500, marginTop: 2 },

  // Titre du document
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 10,
    color: COLORS.slate500,
  },
  docRef: {
    fontSize: 8,
    color: COLORS.slate400,
    marginTop: 2,
  },

  // Badge statut
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeOrange: { backgroundColor: COLORS.orangeLight, color: COLORS.orange },
  badgeGreen: { backgroundColor: COLORS.greenLight, color: COLORS.green },

  // Sections
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },

  // Grid 2 colonnes
  row2: { flexDirection: "row", gap: 16, marginBottom: 12 },
  col: { flex: 1 },

  // Champ label/valeur
  fieldLabel: { fontSize: 8, color: COLORS.slate500, marginBottom: 2 },
  fieldValue: { fontSize: 10, color: COLORS.slate900, fontFamily: "Helvetica-Bold" },
  fieldValueNormal: { fontSize: 10, color: COLORS.slate700 },

  // Box info
  infoBox: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  infoBoxOrange: {
    backgroundColor: COLORS.orangeLight,
    borderWidth: 1,
    borderColor: COLORS.orangeBorder,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },

  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.slate100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: COLORS.slate50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCell: { fontSize: 9, color: COLORS.slate700 },
  tableCellBold: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.slate900 },

  // Total
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.orange,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  totalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.white },
  totalAmount: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLORS.white },

  // Signature
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    gap: 24,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate900,
    paddingTop: 8,
  },
  signatureLabel: { fontSize: 8, color: COLORS.slate500 },
  signatureName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.slate700, marginTop: 4 },
  signatureLine: {
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: COLORS.slate50,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: COLORS.slate400 },
  footerBrand: { fontSize: 7, color: COLORS.orange, fontFamily: "Helvetica-Bold" },

  // Clause légale
  clauseBox: {
    backgroundColor: COLORS.slate50,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
    padding: 10,
    marginBottom: 10,
  },
  clauseTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.slate700, marginBottom: 4 },
  clauseText: { fontSize: 8, color: COLORS.slate600, lineHeight: 1.5 },

  // Utilitaires
  divider: { borderTopWidth: 1, borderTopColor: COLORS.slate200, marginVertical: 16 },
  textMuted: { fontSize: 8, color: COLORS.slate400 },
  textSmall: { fontSize: 8, color: COLORS.slate600 },
  textBold: { fontFamily: "Helvetica-Bold" },
  textOrange: { color: COLORS.orange },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d
    .toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .replace(/[\u202F\u00A0]/g, " ");
}

export function formatAmount(
  amount: number | string | null | undefined,
  currency = "MAD"
): string {
  if (amount === null || amount === undefined) return "—";

  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(n)
    // WinAnsi (polices PDF par défaut) ne gère pas U+202F / U+00A0 :
    // l'encodeur ne garde que l'octet bas, ce qui produit "/" à l'écran.
    .replace(/[\u202F\u00A0]/g, " ");

  return `${formatted} ${currency}`;
}

export function formatNumber(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(n)
    .replace(/[\u202F\u00A0]/g, " ");
}