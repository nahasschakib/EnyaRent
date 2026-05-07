// src/lib/pdf/templates/ReservationHoteliere.tsx

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { sharedStyles, COLORS, formatDate, formatAmount } from "../pdf-styles";

export interface ReservationHoteliereData {
  contractId: string;
  contractDate: Date;
  hotel: { name: string; address: string; city: string; phone?: string; email?: string };
  client: { name: string; cin?: string; passport?: string; phone?: string; email?: string; nationality?: string };
  chambre: {
    numero: string; type: string; floor?: number; capacity: number;
    checkinTime: string; checkoutTime: string;
  };
  sejour: {
    checkin: Date; checkout: Date; nights: number;
    pricePerNight: number; currency: string;
    supplements: { label: string; amount: number }[];
    totalBase: number; totalSupplements: number; total: number;
    caution?: number;
  };
}

const sh = StyleSheet.create({
  chambreCard: {
    backgroundColor: COLORS.orangeLight, borderRadius: 8, padding: 16,
    borderWidth: 1, borderColor: COLORS.orangeBorder, marginBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  chambreNum: { fontSize: 32, fontFamily: "Helvetica-Bold", color: COLORS.orange },
  chambreLabel: { fontSize: 8, color: COLORS.slate500, textTransform: "uppercase", letterSpacing: 0.8 },
  chambreType: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginTop: 4 },
  timeBadge: {
    backgroundColor: COLORS.white, borderRadius: 6, padding: 8,
    borderWidth: 1, borderColor: COLORS.slate200, alignItems: "center",
  },
  timeLabel: { fontSize: 7, color: COLORS.slate500, textTransform: "uppercase" },
  timeValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.slate900, marginTop: 2 },
});

export function ReservationHotelierePDF({ data }: { data: ReservationHoteliereData }) {
  const roomTypeLabels: Record<string, string> = {
    SINGLE: "Chambre Simple", DOUBLE: "Chambre Double", SUITE: "Suite", FAMILY: "Chambre Familiale",
  };

  return (
    <Document title={`Réservation Hôtelière — ${data.client.name}`} author="EnyaRent">
      <Page size="A4" style={sharedStyles.page}>

        <View style={sharedStyles.header}>
          <View style={sharedStyles.headerLeft}>
            <Text style={sharedStyles.logo}>{data.hotel.name}</Text>
            <Text style={sharedStyles.logoTagline}>{data.hotel.address}, {data.hotel.city}</Text>
          </View>
          <View style={sharedStyles.headerRight}>
            <Text style={sharedStyles.docTitle}>Confirmation de Réservation</Text>
            <Text style={sharedStyles.docSubtitle}>Hébergement hôtelier</Text>
            <Text style={sharedStyles.docRef}>Réf. {data.contractId} • {formatDate(data.contractDate)}</Text>
          </View>
        </View>

        {/* Chambre */}
        <View style={sh.chambreCard}>
          <View>
            <Text style={sh.chambreLabel}>Chambre</Text>
            <Text style={sh.chambreNum}>{data.chambre.numero}</Text>
            <Text style={sh.chambreType}>{roomTypeLabels[data.chambre.type] ?? data.chambre.type}</Text>
            {data.chambre.floor !== undefined && (
              <Text style={{ fontSize: 8, color: COLORS.slate500, marginTop: 2 }}>
                {data.chambre.floor === 0 ? "Rez-de-chaussée" : `${data.chambre.floor}e étage`} • {data.chambre.capacity} personne(s)
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={sh.timeBadge}>
              <Text style={sh.timeLabel}>Check-in</Text>
              <Text style={sh.timeValue}>{data.chambre.checkinTime}</Text>
            </View>
            <View style={sh.timeBadge}>
              <Text style={sh.timeLabel}>Check-out</Text>
              <Text style={sh.timeValue}>{data.chambre.checkoutTime}</Text>
            </View>
          </View>
        </View>

        {/* Client */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Informations client</Text>
          <View style={sharedStyles.infoBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={sharedStyles.fieldLabel}>Nom complet</Text>
                <Text style={sharedStyles.fieldValue}>{data.client.name}</Text>
              </View>
              {data.client.cin && (
                <View><Text style={sharedStyles.fieldLabel}>CIN</Text><Text style={sharedStyles.fieldValue}>{data.client.cin}</Text></View>
              )}
              {data.client.passport && (
                <View><Text style={sharedStyles.fieldLabel}>Passeport</Text><Text style={sharedStyles.fieldValue}>{data.client.passport}</Text></View>
              )}
              {data.client.nationality && (
                <View><Text style={sharedStyles.fieldLabel}>Nationalité</Text><Text style={sharedStyles.fieldValue}>{data.client.nationality}</Text></View>
              )}
              {data.client.phone && (
                <View><Text style={sharedStyles.fieldLabel}>Téléphone</Text><Text style={sharedStyles.fieldValue}>{data.client.phone}</Text></View>
              )}
            </View>
          </View>
        </View>

        {/* Séjour */}
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Détails du séjour</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={[sharedStyles.infoBox, { flex: 1, alignItems: "center", marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Arrivée</Text>
              <Text style={sharedStyles.fieldValue}>{formatDate(data.sejour.checkin)}</Text>
            </View>
            <View style={[sharedStyles.infoBox, { flex: 1, alignItems: "center", marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Départ</Text>
              <Text style={sharedStyles.fieldValue}>{formatDate(data.sejour.checkout)}</Text>
            </View>
            <View style={[sharedStyles.infoBox, { flex: 1, alignItems: "center", marginBottom: 0 }]}>
              <Text style={sharedStyles.fieldLabel}>Durée</Text>
              <Text style={sharedStyles.fieldValue}>{data.sejour.nights} nuit(s)</Text>
            </View>
          </View>

          {/* Décomposition */}
          <View style={sharedStyles.table}>
            <View style={sharedStyles.tableHeader}>
              <Text style={[sharedStyles.tableHeaderCell, { flex: 3 }]}>Désignation</Text>
              <Text style={[sharedStyles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Montant</Text>
            </View>
            <View style={sharedStyles.tableRow}>
              <Text style={[sharedStyles.tableCell, { flex: 3 }]}>
                {data.sejour.nights} nuit(s) × {formatAmount(data.sejour.pricePerNight, data.sejour.currency)}
              </Text>
              <Text style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}>
                {formatAmount(data.sejour.totalBase, data.sejour.currency)}
              </Text>
            </View>
            {data.sejour.supplements.map((sup, i) => (
              <View key={i} style={i % 2 === 0 ? sharedStyles.tableRowAlt : sharedStyles.tableRow}>
                <Text style={[sharedStyles.tableCell, { flex: 3 }]}>{sup.label}</Text>
                <Text style={[sharedStyles.tableCell, { flex: 1, textAlign: "right" }]}>{formatAmount(sup.amount, data.sejour.currency)}</Text>
              </View>
            ))}
          </View>

          <View style={sharedStyles.totalBox}>
            <Text style={sharedStyles.totalLabel}>Total séjour</Text>
            <Text style={sharedStyles.totalAmount}>{formatAmount(data.sejour.total, data.sejour.currency)}</Text>
          </View>

          {data.sejour.caution && (
            <View style={[sharedStyles.infoBox, { marginTop: 8 }]}>
              <Text style={sharedStyles.fieldLabel}>Caution préautorisée (non débitée)</Text>
              <Text style={sharedStyles.fieldValue}>{formatAmount(data.sejour.caution, data.sejour.currency)}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={sharedStyles.signatureSection}>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>L&apos;Hôtel — {data.hotel.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
          <View style={sharedStyles.signatureBox}>
            <Text style={sharedStyles.signatureLabel}>Le Client</Text>
            <Text style={sharedStyles.signatureName}>{data.client.name}</Text>
            <View style={sharedStyles.signatureLine} />
            <Text style={[sharedStyles.textMuted, sharedStyles.mt4]}>Date : ___/___/______</Text>
          </View>
        </View>

        <View style={sharedStyles.footer} fixed>
          <Text style={sharedStyles.footerText}>Réf. {data.contractId} • Réservation hôtelière</Text>
          <Text style={sharedStyles.footerBrand}>EnyaRent</Text>
          <Text style={sharedStyles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
export function buildReservationDocument(data: ReservationHoteliereData) {
  return <ReservationHotelierePDF data={data} />;
}