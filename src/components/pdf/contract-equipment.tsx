import React from "react";
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";
import type { ContractData } from "./contract-residential";

const BRAND          = "#D97706";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#475569";
const BORDER         = "#E2E8F0";

const fmt = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const fmtAmount = (a: { toString(): string } | null) =>
  a ? `${parseFloat(a.toString()).toLocaleString("fr-FR")} MAD` : "—";

const s = StyleSheet.create({
  page:          { fontFamily: "Helvetica", fontSize: 10, color: TEXT_PRIMARY, paddingTop: 40, paddingBottom: 60, paddingHorizontal: 44, backgroundColor: "#FFFFFF" },
  header:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: BRAND },
  orgName:       { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND },
  contractTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 4, color: TEXT_PRIMARY },
  metaText:      { fontSize: 9, color: TEXT_SECONDARY, textAlign: "right" },
  section:       { marginBottom: 14 },
  sectionTitle:  { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BORDER },
  row:           { flexDirection: "row", marginBottom: 4 },
  label:         { width: 160, fontSize: 9, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  value:         { flex: 1, fontSize: 9, color: TEXT_PRIMARY },
  box:           { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FCD34D", borderRadius: 4, padding: 10, marginBottom: 14 },
  boxRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  boxLabel:      { fontSize: 10, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  boxValue:      { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  cautionBox:    { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 4, padding: 10, marginBottom: 14 },
  cautionTitle:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#991B1B", marginBottom: 4 },
  cautionText:   { fontSize: 9, color: "#7F1D1D" },
  stateGrid:     { flexDirection: "row", marginBottom: 4 },
  stateCell:     { flex: 1, borderWidth: 1, borderColor: BORDER, padding: 6, marginRight: 4 },
  stateCellLast: { flex: 1, borderWidth: 1, borderColor: BORDER, padding: 6 },
  stateHeader:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 16 },
  clauseTitle:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2 },
  clauseText:    { fontSize: 9, color: TEXT_SECONDARY, lineHeight: 1.5 },
  sigSection:    { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sigBox:        { width: "46%", borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 12, minHeight: 80 },
  sigLabel:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 40 },
  sigLine:       { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  footer:        { position: "absolute", bottom: 24, left: 44, right: 44, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText:    { fontSize: 7, color: TEXT_SECONDARY },
});

function EquipmentContract({ data }: { data: ContractData }) {
  const org = data.organization?.name ?? "EnyaRent";
  const ref = data.booking.id.slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.orgName}>{org}</Text>
            <Text style={s.contractTitle}>CONTRAT DE LOCATION D'ÉQUIPEMENT</Text>
          </View>
          <View>
            <Text style={s.metaText}>Réf. : {ref}</Text>
            <Text style={s.metaText}>Généré le {fmt(data.generatedAt)}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PARTIES AU CONTRAT</Text>
          <View style={s.row}><Text style={s.label}>Propriétaire :</Text><Text style={s.value}>{org}</Text></View>
          <View style={s.row}><Text style={s.label}>Locataire :</Text><Text style={s.value}>{data.customer.name}</Text></View>
          {data.customer.cin   && <View style={s.row}><Text style={s.label}>CIN :</Text><Text style={s.value}>{data.customer.cin}</Text></View>}
          {data.customer.email && <View style={s.row}><Text style={s.label}>Email :</Text><Text style={s.value}>{data.customer.email}</Text></View>}
          {data.customer.phone && <View style={s.row}><Text style={s.label}>Téléphone :</Text><Text style={s.value}>{data.customer.phone}</Text></View>}
        </View>

        {/* Équipement */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ÉQUIPEMENT LOUÉ</Text>
          <View style={s.row}><Text style={s.label}>Désignation :</Text><Text style={s.value}>{data.asset.name}</Text></View>
          <View style={s.row}><Text style={s.label}>Catégorie :</Text><Text style={s.value}>{data.asset.assetType.name}</Text></View>
          {data.asset.description && <View style={s.row}><Text style={s.label}>Description :</Text><Text style={s.value}>{data.asset.description}</Text></View>}
          {data.asset.address && (
            <View style={s.row}>
              <Text style={s.label}>Lieu de retrait :</Text>
              <Text style={s.value}>{data.asset.address}{data.asset.city ? `, ${data.asset.city}` : ""}</Text>
            </View>
          )}
        </View>

        {/* Tarification */}
        <View style={s.box}>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Période de location</Text>
            <Text style={s.boxValue}>Du {fmt(data.booking.startDate)} au {fmt(data.booking.endDate)}</Text>
          </View>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Tarif total</Text>
            <Text style={s.boxValue}>{fmtAmount(data.booking.totalAmount)}</Text>
          </View>
          {data.booking.depositAmount && (
            <View style={s.boxRow}>
              <Text style={s.boxLabel}>Caution obligatoire</Text>
              <Text style={s.boxValue}>{fmtAmount(data.booking.depositAmount)}</Text>
            </View>
          )}
        </View>

        {/* Caution obligatoire */}
        <View style={s.cautionBox}>
          <Text style={s.cautionTitle}>Caution obligatoire</Text>
          <Text style={s.cautionText}>
            La caution de {fmtAmount(data.booking.depositAmount)} est encaissée à la signature du présent contrat. Elle sera restituée intégralement dans les 48h suivant le retour de l'équipement en bon état. En cas de dommage, perte ou vol, la caution sera retenue en tout ou partie selon le barème de réparation en vigueur.
          </Text>
        </View>

        {/* État de l'équipement */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ÉTAT DE L'ÉQUIPEMENT</Text>
          <View style={s.stateGrid}>
            <View style={s.stateCell}>
              <Text style={s.stateHeader}>ÉTAT À LA REMISE</Text>
            </View>
            <View style={s.stateCellLast}>
              <Text style={s.stateHeader}>ÉTAT AU RETOUR</Text>
            </View>
          </View>
          <View style={s.row}>
            <Text style={[s.label, { fontSize: 8 }]}>Constaté par :</Text>
            <Text style={[s.value, { fontSize: 8 }]}>___________________________</Text>
            <Text style={[s.label, { fontSize: 8 }]}>Constaté par :</Text>
            <Text style={[s.value, { fontSize: 8 }]}>___________________________</Text>
          </View>
        </View>

        {/* Clauses */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONDITIONS GÉNÉRALES</Text>

          <Text style={s.clauseTitle}>Article 1 — Usage et responsabilité</Text>
          <Text style={s.clauseText}>Le locataire s'engage à utiliser l'équipement conformément à sa destination et aux instructions d'utilisation fournies. Il est responsable de toute dégradation survenue pendant la période de location.</Text>

          <Text style={s.clauseTitle}>Article 2 — Interdictions</Text>
          <Text style={s.clauseText}>Il est strictement interdit de : sous-louer l'équipement, le modifier, l'utiliser à des fins illicites ou dans des conditions pouvant entraîner sa dégradation accélérée.</Text>

          <Text style={s.clauseTitle}>Article 3 — Entretien</Text>
          <Text style={s.clauseText}>Le locataire doit restituer l'équipement dans l'état où il l'a reçu, nettoyé et en bon état de fonctionnement. Les consommables utilisés sont à la charge du locataire.</Text>

          <Text style={s.clauseTitle}>Article 4 — Perte ou vol</Text>
          <Text style={s.clauseText}>En cas de perte ou de vol, le locataire est tenu de rembourser la valeur de remplacement de l'équipement, déduction faite de la caution versée.</Text>

          {data.booking.notes && (
            <>
              <Text style={s.clauseTitle}>Conditions particulières</Text>
              <Text style={s.clauseText}>{data.booking.notes}</Text>
            </>
          )}
        </View>

        {/* Signatures */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Le Propriétaire</Text>
            <Text style={s.metaText}>{org}</Text>
            <View style={s.sigLine} />
            <Text style={s.footerText}>Date et signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Le Locataire</Text>
            <Text style={s.metaText}>{data.customer.name}</Text>
            <View style={s.sigLine} />
            <Text style={s.footerText}>Lu et approuvé — Date et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{org} — Location équipement</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          <Text style={s.footerText}>Réf. {ref}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function renderContractEquipmentPdf(data: ContractData): Promise<Buffer> {
  return renderToBuffer(<EquipmentContract data={data} />);
}
