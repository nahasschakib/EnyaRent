import React from "react";
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from "@react-pdf/renderer";
import type { ContractData } from "./contract-residential";

const BRAND          = "#0891B2";
const TEXT_PRIMARY   = "#0F172A";
const TEXT_SECONDARY = "#475569";
const BORDER         = "#E2E8F0";

const fmt = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const fmtDateTime = (d: Date) =>
  `${fmt(d)} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

const fmtAmount = (a: { toString(): string } | null | undefined) =>
  a ? `${parseFloat(a.toString()).toLocaleString("fr-FR")} MAD` : "—";

const blank = (n = 30) => "_".repeat(n);

const s = StyleSheet.create({
  page:            { fontFamily: "Helvetica", fontSize: 10, color: TEXT_PRIMARY, paddingTop: 40, paddingBottom: 60, paddingHorizontal: 44, backgroundColor: "#FFFFFF" },
  header:          { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: BRAND },
  orgName:         { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND },
  contractTitle:   { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 4, color: TEXT_PRIMARY },
  metaText:        { fontSize: 9, color: TEXT_SECONDARY, textAlign: "right" },
  section:         { marginBottom: 14 },
  sectionTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BORDER },
  row:             { flexDirection: "row", marginBottom: 5 },
  label:           { width: 160, fontSize: 9, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  value:           { flex: 1, fontSize: 9, color: TEXT_PRIMARY },
  col2:            { flexDirection: "row", marginBottom: 5 },
  col2Label:       { width: 120, fontSize: 9, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  col2Value:       { flex: 1, fontSize: 9, color: TEXT_PRIMARY, marginRight: 16 },
  box:             { backgroundColor: "#ECFEFF", borderWidth: 1, borderColor: "#67E8F9", borderRadius: 4, padding: 10, marginBottom: 14 },
  boxRow:          { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  boxLabel:        { fontSize: 10, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold" },
  boxValue:        { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  finRow:          { flexDirection: "row", justifyContent: "space-between", marginBottom: 3, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: BORDER },
  finLabel:        { fontSize: 9, color: TEXT_SECONDARY },
  finValue:        { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT_PRIMARY },
  finTotal:        { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  finTotalLabel:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND },
  finTotalValue:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  warningBox:      { backgroundColor: "#FEF9C3", borderWidth: 1, borderColor: "#FDE047", borderRadius: 4, padding: 8, marginBottom: 14 },
  warningText:     { fontSize: 9, color: "#713F12" },
  stateGrid:       { flexDirection: "row", marginBottom: 8 },
  stateCol:        { flex: 1, marginRight: 8 },
  stateColLast:    { flex: 1 },
  stateHeader:     { fontSize: 9, fontFamily: "Helvetica-Bold", color: BRAND, backgroundColor: "#ECFEFF", padding: 5, marginBottom: 6, borderRadius: 2 },
  stateField:      { fontSize: 8, color: TEXT_SECONDARY, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 10, marginBottom: 6 },
  stateFieldLabel: { fontSize: 8, color: TEXT_SECONDARY, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  fuelRow:         { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  fuelBox:         { borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 6, width: "45%", alignItems: "center" },
  fuelLabel:       { fontSize: 8, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 4 },
  fuelTicks:       { flexDirection: "row" },
  fuelTick:        { width: 18, height: 10, borderWidth: 1, borderColor: BORDER, marginRight: 2 },
  clauseTitle:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: TEXT_PRIMARY, marginTop: 8, marginBottom: 2 },
  clauseText:      { fontSize: 9, color: TEXT_SECONDARY, lineHeight: 1.5 },
  sigSection:      { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  sigBox:          { width: "46%", borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 12, minHeight: 80 },
  sigLabel:        { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEXT_SECONDARY, marginBottom: 40 },
  sigLine:         { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  footer:          { position: "absolute", bottom: 24, left: 44, right: 44, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
  footerText:      { fontSize: 7, color: TEXT_SECONDARY },
});

function FuelGauge({ label }: { label: string }) {
  return (
    <View style={s.fuelBox}>
      <Text style={s.fuelLabel}>{label}</Text>
      <View style={s.fuelTicks}>
        {["E", "1/4", "1/2", "3/4", "F"].map((t) => (
          <View key={t} style={s.fuelTick}>
            <Text style={{ fontSize: 6, textAlign: "center", color: TEXT_SECONDARY }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function VehicleContract({ data }: { data: ContractData }) {
  const org = data.organization?.name ?? "EnyaRent";
  const ref = data.booking.id.slice(0, 8).toUpperCase();
  const meta = (data.asset.metadata ?? {}) as Record<string, string>;
  const asset = data.asset as typeof data.asset & {
    immatriculation?: string | null;
    vin?: string | null;
    marque?: string | null;
    modele?: string | null;
    annee?: string | null;
    couleur?: string | null;
  };

  // Calcul durée et tarif
  const start   = new Date(data.booking.startDate);
  const end     = new Date(data.booking.endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days    = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
  const unitLabel =
    data.booking.type === "NIGHTLY" ? "nuit(s)" :
    data.booking.type === "MONTHLY" ? "mois" : "jour(s)";
  const unitPrice =
    data.booking.type === "NIGHTLY" ? data.asset.pricePerNight :
    data.booking.type === "MONTHLY" ? data.asset.pricePerMonth :
    data.asset.pricePerDay;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* En-tête */}
        <View style={s.header}>
          <View>
            <Text style={s.orgName}>{org}</Text>
            <Text style={s.contractTitle}>CONTRAT DE LOCATION DE VÉHICULE</Text>
          </View>
          <View>
            <Text style={s.metaText}>Réf. : {ref}</Text>
            <Text style={s.metaText}>Généré le {fmt(data.generatedAt)}</Text>
            <Text style={s.metaText}>Conforme Code de la route marocain</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PARTIES AU CONTRAT</Text>
          <View style={s.row}><Text style={s.label}>Loueur :</Text><Text style={s.value}>{org}</Text></View>
          <View style={s.row}><Text style={s.label}>Locataire :</Text><Text style={s.value}>{data.customer.name}</Text></View>
          {data.customer.email   && <View style={s.row}><Text style={s.label}>Email :</Text><Text style={s.value}>{data.customer.email}</Text></View>}
          {data.customer.phone   && <View style={s.row}><Text style={s.label}>Téléphone :</Text><Text style={s.value}>{data.customer.phone}</Text></View>}
          {data.customer.address && <View style={s.row}><Text style={s.label}>Adresse :</Text><Text style={s.value}>{data.customer.address}</Text></View>}
        </View>

        {/* Identité du locataire */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>IDENTITÉ DU LOCATAIRE</Text>
          <View style={s.row}>
            <Text style={s.label}>CIN / Passeport :</Text>
            <Text style={s.value}>{data.customer.cin ?? data.customer.passportNumber ?? blank(20)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>N° permis de conduire :</Text>
            <Text style={s.value}>{blank(20)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Date d'expiration permis :</Text>
            <Text style={s.value}>{blank(16)}</Text>
          </View>
        </View>

        {/* Véhicule loué */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>VÉHICULE LOUÉ</Text>
          <View style={s.row}>
            <Text style={s.label}>Désignation :</Text>
            <Text style={s.value}>{data.asset.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Catégorie :</Text>
            <Text style={s.value}>{data.asset.assetType.name}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Immatriculation :</Text>
            <Text style={s.value}>{asset.immatriculation ?? meta.immatriculation ?? blank(18)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Marque / Modèle :</Text>
            <Text style={s.value}>
              {(asset.marque ?? meta.marque) && (asset.modele ?? meta.modele)
                ? `${asset.marque ?? meta.marque} ${asset.modele ?? meta.modele}`
                : data.asset.name}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Année :</Text>
            <Text style={s.value}>{asset.annee ?? meta.annee ?? blank(10)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Couleur :</Text>
            <Text style={s.value}>{asset.couleur ?? meta.couleur ?? blank(14)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>N° VIN / Châssis :</Text>
            <Text style={s.value}>{asset.vin ?? meta.vin ?? blank(22)}</Text>
          </View>
          {data.asset.description && (
            <View style={s.row}>
              <Text style={s.label}>Description :</Text>
              <Text style={s.value}>{data.asset.description}</Text>
            </View>
          )}
        </View>

        {/* Détail financier */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONDITIONS FINANCIÈRES</Text>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Tarif unitaire</Text>
            <Text style={s.finValue}>{fmtAmount(unitPrice)} / {unitLabel.replace(/\(s\)/, "")}</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Durée</Text>
            <Text style={s.finValue}>{days} {unitLabel}</Text>
          </View>
          <View style={s.finRow}>
            <Text style={s.finLabel}>Mode de paiement</Text>
            <Text style={s.finValue}>{blank(18)}</Text>
          </View>
          <View style={s.finTotal}>
            <Text style={s.finTotalLabel}>Loyer total</Text>
            <Text style={s.finTotalValue}>{fmtAmount(data.booking.totalAmount)}</Text>
          </View>
          {data.booking.depositAmount && (
            <View style={[s.finTotal, { marginTop: 4 }]}>
              <Text style={[s.finTotalLabel, { color: TEXT_SECONDARY }]}>Caution (restituée sous 7 j)</Text>
              <Text style={[s.finTotalValue, { color: TEXT_SECONDARY }]}>{fmtAmount(data.booking.depositAmount)}</Text>
            </View>
          )}
        </View>

        {/* Avertissement caution */}
        <View style={s.warningBox}>
          <Text style={s.warningText}>
            La caution sera restituée dans les 7 jours suivant la restitution du véhicule, déduction faite des éventuels dommages constatés à l'état des lieux de retour.
          </Text>
        </View>

        {/* État du véhicule */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ÉTAT DU VÉHICULE</Text>

          <View style={s.stateGrid}>
            <View style={s.stateCol}>
              <Text style={s.stateHeader}>DÉPART</Text>
              <Text style={s.stateFieldLabel}>Date / Heure :</Text>
              <Text style={s.stateField}>{fmtDateTime(start)}</Text>
              <Text style={s.stateFieldLabel}>Kilométrage :</Text>
              <Text style={s.stateField}>{blank(18)} km</Text>
              <Text style={s.stateFieldLabel}>Observations :</Text>
              <Text style={s.stateField}>{blank(22)}</Text>
            </View>
            <View style={s.stateColLast}>
              <Text style={s.stateHeader}>RETOUR</Text>
              <Text style={s.stateFieldLabel}>Date / Heure :</Text>
              <Text style={s.stateField}>{fmtDateTime(end)}</Text>
              <Text style={s.stateFieldLabel}>Kilométrage :</Text>
              <Text style={s.stateField}>{blank(18)} km</Text>
              <Text style={s.stateFieldLabel}>Observations :</Text>
              <Text style={s.stateField}>{blank(22)}</Text>
            </View>
          </View>

          <View style={s.fuelRow}>
            <FuelGauge label="Carburant — DÉPART" />
            <FuelGauge label="Carburant — RETOUR" />
          </View>

          <View style={s.row}>
            <Text style={[s.label, { fontSize: 8 }]}>Carrosserie / dommages (départ) :</Text>
            <Text style={[s.value,  { fontSize: 8 }]}>{blank(28)}</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.label, { fontSize: 8 }]}>Carrosserie / dommages (retour) :</Text>
            <Text style={[s.value,  { fontSize: 8 }]}>{blank(28)}</Text>
          </View>
        </View>

        {/* Clauses */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>CONDITIONS GÉNÉRALES DE LOCATION</Text>

          <Text style={s.clauseTitle}>Article 1 — Objet du contrat</Text>
          <Text style={s.clauseText}>Le bailleur loue au locataire le véhicule désigné ci-dessus pour un usage strictement personnel et non commercial.</Text>

          <Text style={s.clauseTitle}>Article 2 — Durée de location</Text>
          <Text style={s.clauseText}>La location est conclue pour la durée indiquée. Le véhicule doit être restitué à la date et lieu convenus, faute de quoi une indemnité de retard sera appliquée.</Text>

          <Text style={s.clauseTitle}>Article 3 — Loyer et caution</Text>
          <Text style={s.clauseText}>Le loyer est payable d'avance. La caution est restituée dans les 7 jours suivant la restitution du véhicule, déduction faite des éventuels dommages.</Text>

          <Text style={s.clauseTitle}>Article 4 — État du véhicule et kilométrage</Text>
          <Text style={s.clauseText}>Un état des lieux du véhicule est établi au départ et au retour (carburant, rayures, équipements). Le kilométrage est noté à la remise et à la restitution.</Text>

          <Text style={s.clauseTitle}>Article 5 — Responsabilité et assurance</Text>
          <Text style={s.clauseText}>Le locataire est responsable de tout dommage survenu durant la période de location. Il s'engage à souscrire une assurance ou accepte la franchise définie par le bailleur.</Text>

          <Text style={s.clauseTitle}>Article 6 — Obligations du locataire</Text>
          <Text style={s.clauseText}>Le locataire s'interdit : (1) de sous-louer le véhicule, (2) de le conduire en dehors du territoire convenu, (3) de l'utiliser en compétition, (4) de le confier à un tiers non autorisé.</Text>

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
            <Text style={s.sigLabel}>Le Loueur</Text>
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
          <Text style={s.footerText}>{org} — Location véhicule</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          <Text style={s.footerText}>Réf. {ref}</Text>
        </View>

      </Page>
    </Document>
  );
}

export async function renderContractVehiclePdf(data: ContractData): Promise<Buffer> {
  return renderToBuffer(<VehicleContract data={data} />);
}
