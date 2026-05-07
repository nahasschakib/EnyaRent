// src/lib/pdf/templates/ContratEquipement.tsx

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { sharedStyles, COLORS, formatDate, formatAmount } from "../pdf-styles";

export interface ContratEquipementData {
  contractId: string;
  contractDate: Date;
  loueur: { name: string; address: string; phone?: string; email?: string };
  locataire: { name: string; cin: string; address: string; phone?: string; email?: string; company?: string };
  equipement: {
    name: string; category: string; serialNumber?: string;
    condition: "NEW" | "GOOD" | "FAIR" | "POOR"; replacementValue: number;
    description?: string;
  };
  conditions: {
    dateDebut: Date; dateFin: Date; duree: number; rateUnit: "HOUR" | "DAY" | "WEEK";
    prixUnitaire: number; currency: string;
    caution: number; total: number;
    depositRequired: boolean; requiresInspection: boolean;
  };
}

const se = StyleSheet.create({
  conditionBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    fontSize: 8, fontFamily: "Helvetica-Bold",
  },
  checkRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.slate100,
  },
  checkbox: {
    width: 14, height: 14, borderWidth: 1.5, borderColor: COLORS.slate900,
    borderRadius: 3, marginRight: 4,
  },
  checkLabel: { fontSize: 9, color: COLORS.slate700, flex: 1 },
  warningBox: {
    backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D",
    borderRadius: 6, padding: 10, marginBottom: 12, flexDirection: "row", gap: 8,
  },
  warningText: { fontSize: 8.5, color: "#92400E", flex: 1, lineHeight: 1.5 },
});

const conditionLabels: Record<string, { label: string; bg: string; color: string }> = {
  NEW: { label: "Neuf", bg: COLORS.greenLight, color: COLORS.green },
  GOOD: { label: "Très bon état", bg: "#EFF6FF", color: "#2563EB" },
  FAIR: { label: "Bon état", bg: COLORS.orangeLight, color: COLORS.orange },
  POOR: { label: "Correct", bg: "#FEF2F2", color: "#DC2626" },
};

const rateLabels: Record<string, string> = { HOUR: "heure", DAY: "journée", WEEK: "semaine" };

export function ContratEquipementPDF({ data }: { data: ContratEquipementData }) {
  const cond = conditionLabels[data.equipement.condition] ?? conditionLabels.GOOD;

  return (
    <Document title={`Contrat Location Équipement — ${data.locataire.name}`} author="EnyaRent">
      <Page size="A4" style={sharedStyles.page}>

        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.logo}>EnyaRent</Text>
            <Text style={sharedStyles.logoTagline}>Location d&apos;équipements</Text>
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.docTitle}>Contrat de Location</Text>
            <Text style={sharedStyles.docSubtitle}>Équipement & Matériel</Text>
            <Text style={sharedStyles.docRef}>Réf. {data.contractId} • {formatDate(data.contractDate)}</Text>
          </View>
        </View>

        {/* Avertissement caution */}
        {data.conditions.depositRequired && (
          <View style={se.warningBox}>
            <Text style={{ fontSize: 12 }}>⚠️</Text>
            <Text style={se.warningText}>
              Une caution de{" "}
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{formatAmount(data.conditions.caution, data.conditions.currency)}</Text>
              {" "}est obligatoire avant la remise du matériel. Cette caution sera restituée après vérification de l&apos;état
              de l&apos;équipement au retour, déduction faite des éventuels dommages constatés.
            </Text>
          </View>
        )}

        {/* Équipement */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Équipement loué</Text>
          <View style={sharedStyles.infoBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginBottom: 4 }}>
                  {data.equipement.name}
                </Text>
                <Text style={{ fontSize: 9, color: COLORS.slate500, marginBottom: 6 }}>{data.equipement.category}</Text>
                {data.equipement.serialNumber && (
                  <Text style={{ fontSize: 8, color: COLORS.slate600 }}>N° série : {data.equipement.serialNumber}</Text>
                )}
                {data.equipement.description && (
                  <Text style={{ fontSize: 8, color: COLORS.slate600, marginTop: 4, lineHeight: 1.5 }}>{data.equipement.description}</Text>
                )}
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <View style={[se.conditionBadge, { backgroundColor: cond.bg }]}>
                  <Text style={{ color: cond.color }}>État : {cond.label}</Text>
                </View>
                <View>
                  <Text style={sharedStyles.fieldLabel}>Valeur de remplacement</Text>
                  <Text style={[sharedStyles.fieldValue, { textAlign: "right" }]}>
                    {formatAmount(data.equipement.replacementValue, data.conditions.currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Parties au contrat</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: COLORS.slate50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: COLORS.slate200 }}>
              <Text style={{ fontSize: 8, color: COLORS.orange, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>LOUEUR</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginBottom: 3 }}>{data.loueur.name}</Text>
              <Text style={{ fontSize: 8, color: COLORS.slate600 }}>{data.loueur.address}</Text>
              {data.loueur.phone && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>Tél : {data.loueur.phone}</Text>}
            </View>
            <View style={{ flex: 1, backgroundColor: COLORS.slate50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: COLORS.slate200 }}>
              <Text style={{ fontSize: 8, color: COLORS.orange, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>LOCATAIRE</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginBottom: 3 }}>{data.locataire.name}</Text>
              {data.locataire.company && <Text style={{ fontSize: 8, color: COLORS.slate500 }}>{data.locataire.company}</Text>}
              <Text style={{ fontSize: 8, color: COLORS.slate600 }}>CIN : {data.locataire.cin}</Text>
              {data.locataire.phone && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>Tél : {data.locataire.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Conditions */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Conditions financières</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={[sharedStyles.infoBox, { flex: 1, marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Début de location</Text>
              <Text style={sharedStyles.fieldValue}>{formatDate(data.conditions.dateDebut)}</Text>
            </View>
            <View style={[sharedStyles.infoBox, { flex: 1, marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Fin de location</Text>
              <Text style={sharedStyles.fieldValue}>{formatDate(data.conditions.dateFin)}</Text>
            </View>
            <View style={[sharedStyles.infoBox, { flex: 1, marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Durée</Text>
              <Text style={sharedStyles.fieldValue}>{data.conditions.duree} {rateLabels[data.conditions.rateUnit]}(s)</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[sharedStyles.infoBox, { flex: 1, marginBottom: 0, alignItems: "center" }]}>
              <Text style={sharedStyles.fieldLabel}>Prix / {rateLabels[data.conditions.rateUnit]}</Text>
              <Text style={sharedStyles.fieldValue}>{formatAmount(data.conditions.prixUnitaire, data.conditions.currency)}</Text>
            </View>
            <View style={[sharedStyles.infoBox, { flex: 1, marginBottom: 0, alignItems: "center" }]}>
              <Text style={sharedStyles.fieldLabel}>Caution</Text>
              <Text style={[sharedStyles.fieldValue, { color: COLORS.orange }]}>{formatAmount(data.conditions.caution, data.conditions.currency)}</Text>
            </View>
            <View style={[sharedStyles.totalBox, { flex: 2, marginBottom: 0 }]}>
              <Text style={sharedStyles.totalLabel}>Total HT</Text>
              <Text style={sharedStyles.totalAmount}>{formatAmount(data.conditions.total, data.conditions.currency)}</Text>
            </View>
          </View>
        </View>

        {/* État des lieux */}
        {data.conditions.requiresInspection && (
          <View style={sharedStyles.section} wrap={false}>
            <Text style={sharedStyles.sectionTitle}>État des lieux — Départ</Text>
            <View style={sharedStyles.infoBox}>
              <Text style={{ fontSize: 9, color: COLORS.slate600, marginBottom: 10 }}>
                Le locataire reconnaît avoir reçu l&apos;équipement en état :{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{cond.label}</Text>
              </Text>
              {["Vérification visuelle effectuée", "Fonctionnement testé en présence du locataire", "Accessoires remis conformément à l'inventaire", "Photos d'état prises"].map((item, i) => (
                <View key={i} style={se.checkRow}>
                  <View style={se.checkbox} />
                  <Text style={se.checkLabel}>{item}</Text>
                </View>
              ))}
              <View style={{ marginTop: 10 }}>
                <Text style={sharedStyles.fieldLabel}>Observations à la remise :</Text>
                <View style={{ height: 36, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 4, marginTop: 4, backgroundColor: COLORS.white }} />
              </View>
            </View>
          </View>
        )}

        {/* Clauses */}
        <View style={sharedStyles.clauseBox}>
          <Text style={sharedStyles.clauseTitle}>Responsabilité et assurance</Text>
          <Text style={sharedStyles.clauseText}>
            Le locataire est responsable de l&apos;équipement dès la prise en charge. Toute détérioration,
            perte ou vol sera facturée à hauteur de la valeur de remplacement ({formatAmount(data.equipement.replacementValue, data.conditions.currency)}).
            Le locataire déclare être couvert par une assurance responsabilité civile.
          </Text>
        </View>

        {/* Signatures */}
        <View style={sharedStyles.signatureSection}>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Loueur — Remise matériel</Text>
            <Text style={sharedStyles.signatureName}>{data.loueur.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Locataire — Réception matériel</Text>
            <Text style={sharedStyles.signatureName}>{data.locataire.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
        </View>

        <View style={sharedStyles.footer} fixed>
          <Text style={sharedStyles.footerText}>Réf. {data.contractId} • Location équipement</Text>
          <Text style={sharedStyles.footerBrand}>EnyaRent</Text>
          <Text style={sharedStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
export function buildContratEquipementDocument(data: ContratEquipementData) {
  return <ContratEquipementPDF data={data} />;
}