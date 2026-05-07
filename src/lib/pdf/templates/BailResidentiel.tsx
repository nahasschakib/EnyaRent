// src/lib/pdf/templates/BailResidentiel.tsx
// Contrat de bail résidentiel — conforme Dahir n°1-94-274 (loi 6-79)
// Généré avec @react-pdf/renderer

import {
  Document, Page, Text, View, StyleSheet,
} from "@react-pdf/renderer";
import { sharedStyles, COLORS, formatDate, formatAmount } from "../pdf-styles";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BailResidentielData {
  // Références
  contractId: string;
  contractDate: Date;

  // Bailleur (l'organisation EnyaRent)
  bailleur: {
    name: string;
    address: string;
    cin?: string;
    phone?: string;
    email?: string;
  };

  // Locataire
  locataire: {
    name: string;
    cin: string;
    address: string;
    phone?: string;
    email?: string;
    profession?: string;
  };

  // Garant (optionnel)
  garant?: {
    name: string;
    cin: string;
    phone?: string;
    address?: string;
  };

  // Bien loué
  bien: {
    address: string;
    city: string;
    surface: number;
    rooms: number;
    floor?: number;
    furnished: boolean;
    description?: string;
  };

  // Conditions financières
  finance: {
    loyerMensuel: number;
    charges: number;
    caution: number;
    currency: string;
    dateDebut: Date;
    dateFin: Date;
    leaseType: "1YR" | "2YR" | "6M" | "MONTHLY";
    jourPaiement: number; // jour du mois
  };
}

// ─── Styles locaux ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  articleNum: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.orange,
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate900,
    marginBottom: 6,
  },
  articleText: {
    fontSize: 9,
    color: COLORS.slate700,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  highlight: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate900,
  },
  partyBox: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  partyLabel: {
    fontSize: 8,
    color: COLORS.orange,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  partyDetail: {
    fontSize: 8.5,
    color: COLORS.slate600,
    lineHeight: 1.5,
  },
});

// ─── Composant Article ────────────────────────────────────────────────────────

function Article({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.articleNum}>Article {num}</Text>
      <Text style={s.articleTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function BailResidentielPDF({ data }: { data: BailResidentielData }) {
  const leaseLabels = {
    "1YR": "1 (un) an renouvelable",
    "2YR": "2 (deux) ans renouvelable",
    "6M": "6 (six) mois",
    "MONTHLY": "mensuel renouvelable",
  };

  return (
    <Document
      title={`Contrat de Bail — ${data.locataire.name}`}
      author="EnyaRent"
      subject="Contrat de bail résidentiel"
      creator="EnyaRent Platform"
    >
      <Page size="A4" style={sharedStyles.page}>

        {/* ── Header ── */}
        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.logo}>EnyaRent</Text>
            <Text style={sharedStyles.logoTagline}>Plateforme de gestion locative</Text>
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.docTitle}>Contrat de Bail</Text>
            <Text style={sharedStyles.docSubtitle}>Bail Résidentiel — Loi 6-79</Text>
            <Text style={sharedStyles.docRef}>Réf. {data.contractId}</Text>
            <Text style={sharedStyles.docRef}>Le {formatDate(data.contractDate)}</Text>
          </View>
        </View>

        {/* ── Préambule ── */}
        <View style={sharedStyles.infoBoxOrange}>
          <Text style={{ fontSize: 9, color: COLORS.slate700, lineHeight: 1.6 }}>
            Contrat de bail à usage d&apos;habitation établi conformément au Dahir n°1-94-274 du 25 Rabii II
            1415 (3 octobre 1994) portant promulgation de la loi n°6-79 organisant les rapports contractuels
            entre les bailleurs et les locataires des locaux d&apos;habitation et à usage professionnel.
          </Text>
        </View>

        {/* ── Parties ── */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Entre les soussignés</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            {/* Bailleur */}
            <View style={s.partyBox}>
              <Text style={s.partyLabel}>Le Bailleur</Text>
              <Text style={s.partyName}>{data.bailleur.name}</Text>
              {data.bailleur.cin && <Text style={s.partyDetail}>CIN : {data.bailleur.cin}</Text>}
              <Text style={s.partyDetail}>{data.bailleur.address}</Text>
              {data.bailleur.phone && <Text style={s.partyDetail}>Tél : {data.bailleur.phone}</Text>}
              {data.bailleur.email && <Text style={s.partyDetail}>{data.bailleur.email}</Text>}
            </View>
            {/* Locataire */}
            <View style={s.partyBox}>
              <Text style={s.partyLabel}>Le Locataire</Text>
              <Text style={s.partyName}>{data.locataire.name}</Text>
              <Text style={s.partyDetail}>CIN : {data.locataire.cin}</Text>
              <Text style={s.partyDetail}>{data.locataire.address}</Text>
              {data.locataire.phone && <Text style={s.partyDetail}>Tél : {data.locataire.phone}</Text>}
              {data.locataire.profession && <Text style={s.partyDetail}>Profession : {data.locataire.profession}</Text>}
            </View>
          </View>

          {/* Garant optionnel */}
          {data.garant && (
            <View style={[s.partyBox, { flexDirection: "row", gap: 12 }]}>
              <Text style={s.partyLabel}>Garant solidaire</Text>
              <View>
                <Text style={s.partyName}>{data.garant.name}</Text>
                <Text style={s.partyDetail}>CIN : {data.garant.cin}</Text>
                {data.garant.address && <Text style={s.partyDetail}>{data.garant.address}</Text>}
                {data.garant.phone && <Text style={s.partyDetail}>Tél : {data.garant.phone}</Text>}
              </View>
            </View>
          )}
        </View>

        {/* ── Articles ── */}

        <Article num="1" title="Objet du bail">
          <Text style={s.articleText}>
            Le Bailleur loue au Locataire qui accepte, le logement situé au{" "}
            <Text style={s.highlight}>{data.bien.address}, {data.bien.city}</Text>,{" "}
            d&apos;une superficie de <Text style={s.highlight}>{data.bien.surface} m²</Text>,{" "}
            comprenant <Text style={s.highlight}>{data.bien.rooms} pièce(s)</Text>
            {data.bien.floor !== undefined && (
              <Text>, au <Text style={s.highlight}>{data.bien.floor === 0 ? "rez-de-chaussée" : `${data.bien.floor}e étage`}</Text></Text>
            )}.{" "}
            Le logement est loué {data.bien.furnished ? "meublé" : "non meublé"}.
          </Text>
        </Article>

        <Article num="2" title="Durée du bail">
          <Text style={s.articleText}>
            Le présent bail est consenti pour une durée de{" "}
            <Text style={s.highlight}>{leaseLabels[data.finance.leaseType]}</Text>,
            prenant effet le{" "}
            <Text style={s.highlight}>{formatDate(data.finance.dateDebut)}</Text>
            {" "}pour se terminer le{" "}
            <Text style={s.highlight}>{formatDate(data.finance.dateFin)}</Text>.
            À défaut de congé donné par l&apos;une ou l&apos;autre des parties, le bail sera reconduit
            tacitement dans les conditions prévues par la loi n°6-79.
          </Text>
        </Article>

        <Article num="3" title="Loyer et modalités de paiement">
          <View style={sharedStyles.infoBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={sharedStyles.fieldLabel}>Loyer mensuel</Text>
                <Text style={sharedStyles.fieldValue}>{formatAmount(data.finance.loyerMensuel, data.finance.currency)}</Text>
              </View>
              <View>
                <Text style={sharedStyles.fieldLabel}>Charges mensuelles</Text>
                <Text style={sharedStyles.fieldValue}>{formatAmount(data.finance.charges, data.finance.currency)}</Text>
              </View>
              <View>
                <Text style={sharedStyles.fieldLabel}>Total mensuel</Text>
                <Text style={[sharedStyles.fieldValue, { color: COLORS.orange }]}>
                  {formatAmount(data.finance.loyerMensuel + data.finance.charges, data.finance.currency)}
                </Text>
              </View>
              <View>
                <Text style={sharedStyles.fieldLabel}>Jour de paiement</Text>
                <Text style={sharedStyles.fieldValue}>Le {data.finance.jourPaiement} du mois</Text>
              </View>
            </View>
          </View>
          <Text style={s.articleText}>
            Le loyer est payable d&apos;avance le{" "}
            <Text style={s.highlight}>{data.finance.jourPaiement} de chaque mois</Text>.
            Tout retard de paiement supérieur à 5 jours entraîne des pénalités de retard
            conformément à la loi.
          </Text>
        </Article>

        <Article num="4" title="Dépôt de garantie (Caution)">
          <Text style={s.articleText}>
            Le Locataire verse ce jour au Bailleur, à titre de garantie, la somme de{" "}
            <Text style={s.highlight}>{formatAmount(data.finance.caution, data.finance.currency)}</Text>{" "}
            correspondant à{" "}
            <Text style={s.highlight}>{Math.round(data.finance.caution / data.finance.loyerMensuel)} mois de loyer</Text>.
            Ce dépôt sera restitué dans un délai de 30 jours après la libération des lieux
            et la remise des clés, déduction faite des sommes éventuellement dues.
          </Text>
        </Article>

        <Article num="5" title="Obligations du locataire">
          <Text style={s.articleText}>
            Le Locataire s&apos;engage à :{"\n"}
            • Payer le loyer aux échéances convenues ;{"\n"}
            • User paisiblement des locaux loués conformément à leur destination ;{"\n"}
            • Répondre des dégradations et pertes survenues pendant la durée du bail ;{"\n"}
            • Ne pas sous-louer ou céder le bail sans l&apos;accord écrit du Bailleur ;{"\n"}
            • Entretenir les locaux en bon état et effectuer les réparations locatives.
          </Text>
        </Article>

        <Article num="6" title="Résiliation">
          <Text style={s.articleText}>
            Chacune des parties peut mettre fin au bail en respectant un préavis de{" "}
            <Text style={s.highlight}>3 mois</Text> par lettre recommandée avec accusé de réception.
            En cas de manquement grave aux obligations du présent contrat, la résiliation
            pourra être prononcée par voie judiciaire.
          </Text>
        </Article>

        {/* ── Signatures ── */}
        <View style={sharedStyles.signatureSection}>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Bailleur</Text>
            <Text style={sharedStyles.signatureName}>{data.bailleur.name}</Text>
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Lu et approuvé — Signature :</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Locataire</Text>
            <Text style={sharedStyles.signatureName}>{data.locataire.name}</Text>
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Lu et approuvé — Signature :</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
          {data.garant && (
            <View style={sharedStyles.signatureBox}>
              <Text style={sharedStyles.signatureLabel}>Le Garant</Text>
              <Text style={sharedStyles.signatureName}>{data.garant.name}</Text>
              <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Lu et approuvé — Signature :</Text>
              <View style={sharedStyles.signatureLine} />
              <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={sharedStyles.footer} fixed>
          <Text style={sharedStyles.footerText}>Réf. {data.contractId} • Bail résidentiel • Dahir n°1-94-274</Text>
          <Text style={sharedStyles.footerBrand}>EnyaRent</Text>
          <Text style={sharedStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
// Ajouter à la fin du fichier
export function buildBailResidentielDocument(data: BailResidentielData) {
  return <BailResidentielPDF data={data} />;
}