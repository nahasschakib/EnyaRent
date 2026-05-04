import React from "react";
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";
import type { ContractData } from "./contract-residential";

const BRAND          = "#7C3AED";
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
  box:           { backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#C4B5FD", borderRadius: 4, padding: 10, marginBottom: 14 },
  boxRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  boxLabel:      { fontSize: 10, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  boxValue:      { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  checkGrid:     { flexDirection: "row", marginBottom: 12 },
  checkBox:      { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 8, marginRight: 6 },
  checkBoxLast:  { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 8 },
  checkTitle:    { fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 8 },
  checkField:    { fontSize: 8, color: TEXT_SECONDARY, marginBottom: 10 },
  cancelBox:     { backgroundColor: "#FFF1F2", borderWidth: 1, borderColor: "#FECDD3", borderRadius: 4, padding: 8, marginBottom: 14 },
  cancelTitle:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#9F1239", marginBottom: 4 },
  cancelText:    { fontSize: 9, color: "#881337" },
  clauseTitle:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2 },
  clauseText:    { fontSize: 9, color: TEXT_SECONDARY, lineHeight: 1.5 },
  sigSection:    { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sigBox:        { width: "46%", borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 12, minHeight: 80 },
  sigLabel:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 40 },
  sigLine:       { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  footer:        { position: "absolute", bottom: 24, left: 44, right: 44, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText:    { fontSize: 7, color: TEXT_SECONDARY },
});

function HospitalityContract({ data }: { data: ContractData }) {
  const org = data.organization?.name ?? "EnyaRent";
  const ref = data.booking.id.slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.orgName}>{org}</Text>
            <Text style={s.contractTitle}>CONFIRMATION DE RÉSERVATION HÔTELIÈRE</Text>
          </View>
          <View>
            <Text style={s.metaText}>Réf. : {ref}</Text>
            <Text style={s.metaText}>Généré le {fmt(data.generatedAt)}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>INFORMATIONS CLIENT</Text>
          <View style={s.row}><Text style={s.label}>Nom :</Text><Text style={s.value}>{data.customer.name}</Text></View>
          {data.customer.cin     && <View style={s.row}><Text style={s.label}>CIN / Passeport :</Text><Text style={s.value}>{data.customer.cin ?? data.customer.passportNumber}</Text></View>}
          {data.customer.email   && <View style={s.row}><Text style={s.label}>Email :</Text><Text style={s.value}>{data.customer.email}</Text></View>}
          {data.customer.phone   && <View style={s.row}><Text style={s.label}>Téléphone :</Text><Text style={s.value}>{data.customer.phone}</Text></View>}
          {data.customer.address && <View style={s.row}><Text style={s.label}>Adresse :</Text><Text style={s.value}>{data.customer.address}</Text></View>}
        </View>

        {/* Hébergement */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>HÉBERGEMENT</Text>
          <View style={s.row}><Text style={s.label}>Établissement :</Text><Text style={s.value}>{org}</Text></View>
          <View style={s.row}><Text style={s.label}>Chambre / Unité :</Text><Text style={s.value}>{data.asset.name}</Text></View>
          <View style={s.row}><Text style={s.label}>Type :</Text><Text style={s.value}>{data.asset.assetType.name}</Text></View>
          {data.asset.address && (
            <View style={s.row}>
              <Text style={s.label}>Adresse :</Text>
              <Text style={s.value}>{data.asset.address}{data.asset.city ? `, ${data.asset.city}` : ""}</Text>
            </View>
          )}
        </View>

        {/* Séjour */}
        <View style={s.box}>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Arrivée</Text>
            <Text style={s.boxValue}>{fmt(data.booking.startDate)}</Text>
          </View>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Départ</Text>
            <Text style={s.boxValue}>{fmt(data.booking.endDate)}</Text>
          </View>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Montant total</Text>
            <Text style={s.boxValue}>{fmtAmount(data.booking.totalAmount)}</Text>
          </View>
          {data.booking.depositAmount && (
            <View style={s.boxRow}>
              <Text style={s.boxLabel}>Acompte versé</Text>
              <Text style={s.boxValue}>{fmtAmount(data.booking.depositAmount)}</Text>
            </View>
          )}
        </View>

        {/* Check-in / Check-out */}
        <View style={s.checkGrid}>
          <View style={s.checkBox}>
            <Text style={s.checkTitle}>CHECK-IN</Text>
            <Text style={s.checkField}>Date : {fmt(data.booking.startDate)}</Text>
            <Text style={s.checkField}>Heure d'arrivée : ________________</Text>
            <Text style={s.checkField}>Clé remise : ________________</Text>
            <Text style={s.checkField}>Signature : ________________</Text>
          </View>
          <View style={s.checkBoxLast}>
            <Text style={s.checkTitle}>CHECK-OUT</Text>
            <Text style={s.checkField}>Date : {fmt(data.booking.endDate)}</Text>
            <Text style={s.checkField}>Heure de départ : ________________</Text>
            <Text style={s.checkField}>Clé rendue : ________________</Text>
            <Text style={s.checkField}>Signature : ________________</Text>
          </View>
        </View>

        {/* Politique d'annulation */}
        <View style={s.cancelBox}>
          <Text style={s.cancelTitle}>Politique d'annulation</Text>
          <Text style={s.cancelText}>
            Annulation gratuite jusqu'à 48h avant l'arrivée. Entre 48h et 24h : 50% du montant total retenu. Moins de 24h ou no-show : 100% du montant total retenu. L'acompte versé est non remboursable en cas d'annulation tardive.
          </Text>
        </View>

        {/* Clauses */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONDITIONS GÉNÉRALES DU SÉJOUR</Text>

          <Text style={s.clauseTitle}>Article 1 — Horaires</Text>
          <Text style={s.clauseText}>Le check-in s'effectue à partir de 14h00 et le check-out avant 12h00. Tout dépassement d'horaire sera facturé à hauteur d'une demi-journée supplémentaire.</Text>

          <Text style={s.clauseTitle}>Article 2 — Occupants</Text>
          <Text style={s.clauseText}>Le nombre de personnes occupant la chambre ne peut excéder la capacité maximale prévue. Toute personne supplémentaire doit être déclarée à la réception et fera l'objet d'une facturation additionnelle.</Text>

          <Text style={s.clauseTitle}>Article 3 — Comportement</Text>
          <Text style={s.clauseText}>Le client s'engage à respecter le règlement intérieur de l'établissement, notamment en ce qui concerne le calme nocturne (après 22h00), l'interdiction de fumer dans les chambres et le respect des espaces communs.</Text>

          <Text style={s.clauseTitle}>Article 4 — Dommages</Text>
          <Text style={s.clauseText}>Tout dommage causé aux équipements, mobilier ou locaux sera facturé au client sur la base du coût réel de remplacement ou de réparation, en sus du montant de la réservation.</Text>

          <Text style={s.clauseTitle}>Article 5 — Responsabilité</Text>
          <Text style={s.clauseText}>L'établissement décline toute responsabilité en cas de vol ou de perte d'objets non déposés au coffre-fort. Il est conseillé aux clients de souscrire une assurance voyage.</Text>

          {data.booking.notes && (
            <>
              <Text style={s.clauseTitle}>Demandes particulières</Text>
              <Text style={s.clauseText}>{data.booking.notes}</Text>
            </>
          )}
        </View>

        {/* Signatures */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>L'Établissement</Text>
            <Text style={s.metaText}>{org}</Text>
            <View style={s.sigLine} />
            <Text style={s.footerText}>Date et signature</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={s.sigLabel}>Le Client</Text>
            <Text style={s.metaText}>{data.customer.name}</Text>
            <View style={s.sigLine} />
            <Text style={s.footerText}>Lu et approuvé — Date et signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{org} — Réservation hôtelière</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          <Text style={s.footerText}>Réf. {ref}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function renderContractHospitalityPdf(data: ContractData): Promise<Buffer> {
  return renderToBuffer(<HospitalityContract data={data} />);
}
