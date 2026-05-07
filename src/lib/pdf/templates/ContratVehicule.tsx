// src/lib/pdf/templates/ContratVehicule.tsx

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { sharedStyles, COLORS, formatDate, formatAmount } from "../pdf-styles";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContratVehiculeData {
  contractId: string;
  contractDate: Date;
  loueur: { name: string; address: string; phone?: string; email?: string; rc?: string };
  locataire: { name: string; cin: string; address: string; phone?: string; email?: string; licenseNumber?: string; licenseExpiry?: string };
  vehicule: {
    marque: string; modele: string; annee: string; immatriculation: string;
    couleur?: string; fuelType: string; kmDepart: number;
  };
  conditions: {
    dateDebut: Date; dateFin: Date; nbJours: number;
    prixParJour: number; kmInclus: number; prixKmSup: number;
    caution: number; totalEstime: number; currency: string;
  };
}

const sv = StyleSheet.create({
  vehiculeBox: {
    backgroundColor: COLORS.orangeLight, borderRadius: 8, padding: 16,
    borderWidth: 1, borderColor: COLORS.orangeBorder, marginBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  vehiculeTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: COLORS.slate900 },
  vehiculeSub: { fontSize: 9, color: COLORS.slate500, marginTop: 2 },
  kmBadge: {
    backgroundColor: COLORS.orange, borderRadius: 6, padding: 10, alignItems: "center",
  },
  kmValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLORS.white },
  kmLabel: { fontSize: 7, color: COLORS.white, marginTop: 2 },
  condRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.slate100,
  },
  condLabel: { fontSize: 9, color: COLORS.slate600 },
  condValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.slate900 },
});

export function ContratVehiculePDF({ data }: { data: ContratVehiculeData }) {
  const fuelLabels: Record<string, string> = {
    GASOLINE: "Essence", DIESEL: "Diesel", ELECTRIC: "Électrique", HYBRID: "Hybride",
  };

  return (
    <Document title={`Contrat Location Véhicule — ${data.locataire.name}`} author="EnyaRent">
      <Page size="A4" style={sharedStyles.page}>

        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.logo}>EnyaRent</Text>
            <Text style={sharedStyles.logoTagline}>Location de véhicules</Text>
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.docTitle}>Contrat de Location</Text>
            <Text style={sharedStyles.docSubtitle}>Véhicule — Courte durée</Text>
            <Text style={sharedStyles.docRef}>Réf. {data.contractId} • {formatDate(data.contractDate)}</Text>
          </View>
        </View>

        {/* Véhicule */}
        <View style={sv.vehiculeBox}>
          <View>
            <Text style={sv.vehiculeTitle}>{data.vehicule.marque} {data.vehicule.modele}</Text>
            <Text style={sv.vehiculeSub}>{data.vehicule.annee} • {data.vehicule.couleur ?? "—"} • {fuelLabels[data.vehicule.fuelType] ?? data.vehicule.fuelType}</Text>
            <Text style={[sv.vehiculeSub, { marginTop: 4, fontFamily: "Helvetica-Bold" }]}>
              Immat. : {data.vehicule.immatriculation}
            </Text>
          </View>
          <View style={sv.kmBadge}>
            <Text style={sv.kmValue}>{data.vehicule.kmDepart.toLocaleString("fr-FR")}</Text>
            <Text style={sv.kmLabel}>km départ</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={[sharedStyles.section, { marginBottom: 16 }]}>
          <Text style={sharedStyles.sectionTitle}>Parties au contrat</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: COLORS.slate50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: COLORS.slate200 }}>
              <Text style={{ fontSize: 8, color: COLORS.orange, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>LOUEUR</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginBottom: 3 }}>{data.loueur.name}</Text>
              <Text style={{ fontSize: 8, color: COLORS.slate600 }}>{data.loueur.address}</Text>
              {data.loueur.phone && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>Tél : {data.loueur.phone}</Text>}
              {data.loueur.rc && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>RC : {data.loueur.rc}</Text>}
            </View>
            <View style={{ flex: 1, backgroundColor: COLORS.slate50, borderRadius: 6, padding: 12, borderWidth: 1, borderColor: COLORS.slate200 }}>
              <Text style={{ fontSize: 8, color: COLORS.orange, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>LOCATAIRE</Text>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginBottom: 3 }}>{data.locataire.name}</Text>
              <Text style={{ fontSize: 8, color: COLORS.slate600 }}>CIN : {data.locataire.cin}</Text>
              {data.locataire.licenseNumber && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>Permis : {data.locataire.licenseNumber}</Text>}
              {data.locataire.phone && <Text style={{ fontSize: 8, color: COLORS.slate600 }}>Tél : {data.locataire.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Conditions */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Conditions de location</Text>
          <View style={sharedStyles.infoBox}>
            <View style={sv.condRow}><Text style={sv.condLabel}>Prise en charge</Text><Text style={sv.condValue}>{formatDate(data.conditions.dateDebut)}</Text></View>
            <View style={sv.condRow}><Text style={sv.condLabel}>Restitution prévue</Text><Text style={sv.condValue}>{formatDate(data.conditions.dateFin)}</Text></View>
            <View style={sv.condRow}><Text style={sv.condLabel}>Durée</Text><Text style={sv.condValue}>{data.conditions.nbJours} jour(s)</Text></View>
            <View style={sv.condRow}><Text style={sv.condLabel}>Prix / jour</Text><Text style={sv.condValue}>{formatAmount(data.conditions.prixParJour, data.conditions.currency)}</Text></View>
            <View style={sv.condRow}><Text style={sv.condLabel}>Kilométrage inclus</Text><Text style={sv.condValue}>{data.conditions.kmInclus.toLocaleString("fr-FR")} km</Text></View>
            <View style={[sv.condRow, { borderBottomWidth: 0 }]}>
              <Text style={sv.condLabel}>Prix km supplémentaire</Text>
              <Text style={sv.condValue}>{formatAmount(data.conditions.prixKmSup, data.conditions.currency)} / km</Text>
            </View>
          </View>
        </View>

        {/* Total */}
        <View style={sharedStyles.section}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={[sharedStyles.infoBox, { flex: 1, alignItems: "center" }]}>
              <Text style={sharedStyles.fieldLabel}>Caution bloquée</Text>
              <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: COLORS.slate700, marginTop: 4 }}>
                {formatAmount(data.conditions.caution, data.conditions.currency)}
              </Text>
            </View>
            <View style={[sharedStyles.totalBox, { flex: 2 }]}>
              <Text style={sharedStyles.totalLabel}>Total estimé</Text>
              <Text style={sharedStyles.totalAmount}>{formatAmount(data.conditions.totalEstime, data.conditions.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Clauses */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Conditions générales</Text>
          <View style={sharedStyles.clauseBox}>
            <Text style={sharedStyles.clauseTitle}>Responsabilité</Text>
            <Text style={sharedStyles.clauseText}>Le locataire est responsable de tous les dommages causés au véhicule pendant la période de location, à l&apos;exception des cas couverts par l&apos;assurance. Tout sinistre doit être déclaré sous 24h.</Text>
          </View>
          <View style={sharedStyles.clauseBox}>
            <Text style={sharedStyles.clauseTitle}>Carburant & kilométrage</Text>
            <Text style={sharedStyles.clauseText}>Le véhicule est restitué avec le même niveau de carburant quApos;à la prise en charge. Tout kilomètre dépassant le forfait est facturé au tarif de {formatAmount(data.conditions.prixKmSup, data.conditions.currency)} / km.</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={sharedStyles.signatureSection}>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Loueur</Text>
            <Text style={sharedStyles.signatureName}>{data.loueur.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Locataire</Text>
            <Text style={sharedStyles.signatureName}>{data.locataire.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
        </View>

        <View style={sharedStyles.footer} fixed>
          <Text style={sharedStyles.footerText}>Réf. {data.contractId} • Location véhicule</Text>
          <Text style={sharedStyles.footerBrand}>EnyaRent</Text>
          <Text style={sharedStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
export function buildContratVehiculeDocument(data: ContratVehiculeData) {
  return <ContratVehiculePDF data={data} />;
}