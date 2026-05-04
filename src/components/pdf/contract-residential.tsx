import React from "react";
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";

const BRAND          = "#EA580C";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#475569";
const BORDER         = "#E2E8F0";

export interface ContractData {
  booking: {
    id:            string;
    startDate:     Date;
    endDate:       Date;
    type:          string;
    totalAmount:   { toString(): string };
    depositAmount: { toString(): string } | null;
    notes:         string | null;
  };
  asset: {
    name:          string;
    description:   string | null;
    address:       string | null;
    city:          string | null;
    assetType:     { name: string; sector: string };
    metadata?:       Record<string, unknown> | null;
    pricePerDay?:    { toString(): string } | null;
    pricePerNight?:  { toString(): string } | null;
    pricePerMonth?:  { toString(): string } | null;
    immatriculation?: string | null;
    vin?:            string | null;
    marque?:         string | null;
    modele?:         string | null;
    annee?:          string | null;
    couleur?:        string | null;
  };
  customer: {
    name:           string;
    email:          string | null;
    phone:          string | null;
    cin:            string | null;
    passportNumber: string | null;
    address:        string | null;
    type:           string;
  };
  organization: { name: string; logo: string | null } | null;
  generatedAt:  Date;
}

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
  label:         { width: 150, fontSize: 9, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  value:         { flex: 1, fontSize: 9, color: TEXT_PRIMARY },
  box:           { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FDBA74", borderRadius: 4, padding: 10, marginBottom: 14 },
  boxRow:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  boxLabel:      { fontSize: 10, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  boxValue:      { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  clauseTitle:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2 },
  clauseText:    { fontSize: 9, color: TEXT_SECONDARY, lineHeight: 1.5 },
  sigSection:    { flexDirection: "row", justifyContent: "space-between", marginTop: 32, minPresenceAhead: 200 },
  sigBox:        { width: "46%", borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 12, minHeight: 80 },
  sigLabel:      { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 40 },
  sigLine:       { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  footer:        { position: "absolute", bottom: 24, left: 44, right: 44, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText:    { fontSize: 7, color: TEXT_SECONDARY },
});

function ResidentialContract({ data }: { data: ContractData }) {
  const org = data.organization?.name ?? "EnyaRent";
  const ref = data.booking.id.slice(0, 8).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.orgName}>{org}</Text>
            <Text style={s.contractTitle}>CONTRAT DE BAIL RÉSIDENTIEL</Text>
          </View>
          <View>
            <Text style={s.metaText}>Réf. : {ref}</Text>
            <Text style={s.metaText}>Généré le {fmt(data.generatedAt)}</Text>
            <Text style={s.metaText}>Conforme Dahir 25/12/1994</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PARTIES AU CONTRAT</Text>
          <View style={s.row}><Text style={s.label}>Bailleur :</Text><Text style={s.value}>{org}</Text></View>
          <View style={s.row}><Text style={s.label}>Locataire :</Text><Text style={s.value}>{data.customer.name}</Text></View>
          {data.customer.cin     && <View style={s.row}><Text style={s.label}>CIN :</Text><Text style={s.value}>{data.customer.cin}</Text></View>}
          {data.customer.email   && <View style={s.row}><Text style={s.label}>Email :</Text><Text style={s.value}>{data.customer.email}</Text></View>}
          {data.customer.phone   && <View style={s.row}><Text style={s.label}>Téléphone :</Text><Text style={s.value}>{data.customer.phone}</Text></View>}
          {data.customer.address && <View style={s.row}><Text style={s.label}>Adresse :</Text><Text style={s.value}>{data.customer.address}</Text></View>}
        </View>

        {/* Bien loué */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>BIEN LOUÉ</Text>
          <View style={s.row}><Text style={s.label}>Désignation :</Text><Text style={s.value}>{data.asset.name}</Text></View>
          <View style={s.row}><Text style={s.label}>Type :</Text><Text style={s.value}>{data.asset.assetType.name}</Text></View>
          {data.asset.address && (
            <View style={s.row}>
              <Text style={s.label}>Adresse :</Text>
              <Text style={s.value}>{data.asset.address}{data.asset.city ? `, ${data.asset.city}` : ""}</Text>
            </View>
          )}
        </View>

        {/* Conditions financières */}
        <View style={s.box}>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Durée du bail</Text>
            <Text style={s.boxValue}>Du {fmt(data.booking.startDate)} au {fmt(data.booking.endDate)}</Text>
          </View>
          <View style={s.boxRow}>
            <Text style={s.boxLabel}>Loyer mensuel</Text>
            <Text style={s.boxValue}>{fmtAmount(data.booking.totalAmount)}</Text>
          </View>
          {data.booking.depositAmount && (
            <View style={s.boxRow}>
              <Text style={s.boxLabel}>Caution</Text>
              <Text style={s.boxValue}>{fmtAmount(data.booking.depositAmount)}</Text>
            </View>
          )}
        </View>

        {/* Clauses légales */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONDITIONS GÉNÉRALES DU BAIL</Text>

          <Text style={s.clauseTitle}>Article 1 — Destination des lieux</Text>
          <Text style={s.clauseText}>Le présent local est loué à usage d'habitation exclusivement. Le locataire s'interdit expressément d'y exercer toute activité commerciale, artisanale ou professionnelle sans accord préalable écrit du bailleur.</Text>

          <Text style={s.clauseTitle}>Article 2 — Durée et renouvellement</Text>
          <Text style={s.clauseText}>Le bail est conclu pour la durée indiquée ci-dessus. À son expiration, il se renouvelle tacitement par périodes mensuelles, sauf congé donné par l'une des parties avec un préavis d'un (1) mois conformément au Dahir du 25 décembre 1994 (loi n° 64-99).</Text>

          <Text style={s.clauseTitle}>Article 3 — Loyer et modalités de paiement</Text>
          <Text style={s.clauseText}>Le loyer est payable mensuellement et d'avance, le premier de chaque mois. En cas de retard supérieur à quinze (15) jours, une pénalité de 1% par mois de retard sera appliquée de plein droit.</Text>

          <Text style={s.clauseTitle}>Article 4 — Dépôt de garantie</Text>
          <Text style={s.clauseText}>Le dépôt de garantie est restitué dans un délai maximum d'un (1) mois après restitution des clés, déduction faite des sommes dues au titre des loyers impayés et des dégradations constatées à l'état des lieux de sortie.</Text>

          <Text style={s.clauseTitle}>Article 5 — État des lieux</Text>
          <Text style={s.clauseText}>Un état des lieux contradictoire sera établi à l'entrée et à la sortie du locataire. À défaut d'état des lieux d'entrée, le local est présumé avoir été remis en bon état conformément à l'article 678 du DOC.</Text>

          <Text style={s.clauseTitle}>Article 6 — Obligations du locataire</Text>
          <Text style={s.clauseText}>Le locataire s'engage à : (1) user des lieux en bon père de famille, (2) ne pas effectuer de travaux sans autorisation écrite du bailleur, (3) souscrire une assurance responsabilité civile, (4) permettre l'accès pour travaux urgents.</Text>

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
            <Text style={s.sigLabel}>Le Bailleur</Text>
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

        {/* Footer paginé */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{org} — Bail résidentiel</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          <Text style={s.footerText}>Réf. {ref}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function renderContractResidentialPdf(data: ContractData): Promise<Buffer> {
  return renderToBuffer(<ResidentialContract data={data} />);
}
