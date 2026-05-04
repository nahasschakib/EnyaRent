import { Resend } from "resend";
import React from "react";
import {
  Body, Button, Container, Head, Heading, Hr,
  Html, Preview, Section, Text,
} from "@react-email/components";

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? "noreply@enyarent.ma";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const BRAND  = "#EA580C";
const TEXT   = "#0F172A";
const MUTED  = "#64748B";
const BORDER = "#E2E8F0";
const BG     = "#F8FAFC";

const fmt = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

// ─── Styles de base ──────────────────────────────────────────────────────────

const base = {
  body:      { backgroundColor: BG, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  container: { maxWidth: "600px", margin: "0 auto", padding: "20px 0" },
  header:    { backgroundColor: BRAND, padding: "24px 32px", borderRadius: "8px 8px 0 0" },
  h1:        { color: "#FFFFFF", fontSize: "22px", fontWeight: "700", margin: "0", lineHeight: "1" },
  headerSub: { color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "4px 0 0" },
  content:   { backgroundColor: "#FFFFFF", padding: "32px", borderRadius: "0 0 8px 8px", border: `1px solid ${BORDER}` },
  h2:        { color: TEXT, fontSize: "18px", fontWeight: "600", margin: "0 0 16px" },
  p:         { color: TEXT, fontSize: "14px", lineHeight: "1.6", margin: "0 0 12px" },
  muted:     { color: MUTED, fontSize: "13px", lineHeight: "1.5", margin: "0 0 8px" },
  infoBox:   { backgroundColor: "#FFF7ED", border: `1px solid #FDBA74`, borderRadius: "6px", padding: "16px", margin: "16px 0" },
  infoLabel: { color: MUTED, fontSize: "12px", fontWeight: "600", margin: "0 0 2px" },
  infoValue: { color: TEXT, fontSize: "14px", fontWeight: "600", margin: "0 0 8px" },
  btn:       { backgroundColor: BRAND, color: "#FFFFFF", borderRadius: "6px", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none", display: "inline-block" },
  btnSlate:  { backgroundColor: "#475569", color: "#FFFFFF", borderRadius: "6px", fontSize: "14px", fontWeight: "600", padding: "12px 24px", textDecoration: "none", display: "inline-block" },
  hr:        { borderColor: BORDER, margin: "24px 0" },
  footer:    { padding: "16px 32px", textAlign: "center" as const },
  footerP:   { color: MUTED, fontSize: "12px", margin: "0 0 4px" },
};

// ─── Template de base ────────────────────────────────────────────────────────

function EmailBase({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={base.body}>
        <Container style={base.container}>
          <Section style={base.header}>
            <Heading as="h1" style={base.h1}>EnyaRent</Heading>
            <Text style={base.headerSub}>Universal Rental Management System</Text>
          </Section>
          <Section style={base.content}>{children}</Section>
          <Section style={base.footer}>
            <Text style={base.footerP}>EnyaRent — Tous droits réservés 2025</Text>
            <Text style={base.footerP}>Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</Text>
            <Text style={base.footerP}>Vous recevez cet email en tant que client ou gestionnaire sur la plateforme EnyaRent.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── 1. Nouvelle réservation ─────────────────────────────────────────────────

export interface BookingCreatedData {
  customerName: string;
  assetName:    string;
  startDate:    Date;
  endDate:      Date;
  totalAmount:  number;
  currency:     string;
  bookingId:    string;
}

function BookingCreatedEmail({ data, isManager }: { data: BookingCreatedData; isManager: boolean }) {
  const url = `${APP_URL}/${isManager ? "dashboard" : "portal"}/bookings/${data.bookingId}`;
  return (
    <EmailBase preview={`Réservation confirmée — ${data.assetName}`}>
      <Heading as="h2" style={base.h2}>
        {isManager ? "Nouvelle réservation" : "Votre réservation est confirmée"}
      </Heading>
      <Text style={base.p}>
        {isManager
          ? `Une nouvelle réservation vient d'être créée pour ${data.customerName}.`
          : `Bonjour ${data.customerName}, votre réservation a bien été enregistrée.`}
      </Text>
      <Section style={base.infoBox}>
        <Text style={base.infoLabel}>Asset</Text>
        <Text style={base.infoValue}>{data.assetName}</Text>
        <Text style={base.infoLabel}>Arrivée</Text>
        <Text style={base.infoValue}>{fmt(data.startDate)}</Text>
        <Text style={base.infoLabel}>Départ</Text>
        <Text style={base.infoValue}>{fmt(data.endDate)}</Text>
        <Text style={base.infoLabel}>Montant total</Text>
        <Text style={base.infoValue}>{data.totalAmount.toLocaleString("fr-FR")} {data.currency}</Text>
      </Section>
      <Button href={url} style={base.btn}>
        {isManager ? "Voir la réservation" : "Consulter ma réservation"}
      </Button>
    </EmailBase>
  );
}

export async function sendBookingCreatedEmail(
  to: string,
  data: BookingCreatedData,
  isManager = false
) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Réservation ${isManager ? "créée" : "confirmée"} — ${data.assetName}`,
    react:   <BookingCreatedEmail data={data} isManager={isManager} />,
  });
}

// ─── 2. Contrat à signer ─────────────────────────────────────────────────────

export interface ContractSignatureData {
  customerName: string;
  assetName:    string;
  signatureUrl: string;
  contractId:   string;
  expiresAt?:   Date;
}

function ContractSignatureEmail({ data }: { data: ContractSignatureData }) {
  return (
    <EmailBase preview={`Signature requise — Contrat ${data.assetName}`}>
      <Heading as="h2" style={base.h2}>Votre contrat est prêt à signer</Heading>
      <Text style={base.p}>Bonjour {data.customerName},</Text>
      <Text style={base.p}>
        Votre contrat de location pour <strong>{data.assetName}</strong> est prêt.
        Merci de le lire attentivement et de le signer électroniquement.
      </Text>
      {data.expiresAt && (
        <Text style={{ ...base.muted, color: "#B45309" }}>
          Ce lien de signature expire le {fmt(data.expiresAt)}.
        </Text>
      )}
      <Hr style={base.hr} />
      <Button href={data.signatureUrl} style={base.btn}>
        Signer le contrat
      </Button>
      <Text style={{ ...base.muted, marginTop: "16px" }}>
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur.
      </Text>
    </EmailBase>
  );
}

export async function sendContractSignatureEmail(to: string, data: ContractSignatureData) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Signature requise — Contrat ${data.assetName}`,
    react:   <ContractSignatureEmail data={data} />,
  });
}

// ─── 3. Contrat signé ────────────────────────────────────────────────────────

export interface ContractSignedData {
  customerName: string;
  assetName:    string;
  pdfUrl:       string;
  contractId:   string;
}

function ContractSignedEmail({ data, isManager }: { data: ContractSignedData; isManager: boolean }) {
  const contractUrl = `${APP_URL}/${isManager ? "dashboard" : "portal"}/contracts/${data.contractId}`;
  return (
    <EmailBase preview={`Contrat signé — ${data.assetName}`}>
      <Heading as="h2" style={base.h2}>Contrat signé avec succès</Heading>
      <Text style={base.p}>
        {isManager
          ? `Le contrat pour ${data.assetName} a été signé par ${data.customerName}.`
          : `Bonjour ${data.customerName}, votre contrat pour ${data.assetName} est signé.`}
      </Text>
      <Section style={base.infoBox}>
        <Text style={base.infoLabel}>Asset loué</Text>
        <Text style={base.infoValue}>{data.assetName}</Text>
      </Section>
      <Button href={data.pdfUrl} style={base.btn}>
        Télécharger le contrat signé
      </Button>
      <Hr style={base.hr} />
      <Button href={contractUrl} style={base.btnSlate}>
        Voir le dossier
      </Button>
    </EmailBase>
  );
}

export async function sendContractSignedEmail(
  to: string,
  data: ContractSignedData,
  isManager = false
) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Contrat signé — ${data.assetName}`,
    react:   <ContractSignedEmail data={data} isManager={isManager} />,
  });
}

// ─── 4. Rappel loyer ─────────────────────────────────────────────────────────

export interface RentReminderData {
  customerName: string;
  assetName:    string;
  amount:       number;
  currency:     string;
  dueDate:      Date;
  bookingId:    string;
  daysOverdue?: number;
}

function RentReminderEmail({ data }: { data: RentReminderData }) {
  const payUrl    = `${APP_URL}/portal/pay/${data.bookingId}`;
  const isOverdue = (data.daysOverdue ?? 0) > 0;
  const accentRed = "#B91C1C";
  return (
    <EmailBase preview={`${isOverdue ? "Loyer en retard" : "Rappel loyer"} — ${data.assetName}`}>
      <Heading as="h2" style={{ ...base.h2, color: isOverdue ? accentRed : TEXT }}>
        {isOverdue ? "Loyer en retard" : "Rappel de paiement"}
      </Heading>
      <Text style={base.p}>Bonjour {data.customerName},</Text>
      <Text style={base.p}>
        {isOverdue
          ? `Le paiement de votre loyer pour ${data.assetName} est en retard de ${data.daysOverdue} jour(s).`
          : `Votre loyer pour ${data.assetName} arrive à échéance le ${fmt(data.dueDate)}.`}
      </Text>
      <Section style={{
        ...base.infoBox,
        backgroundColor: isOverdue ? "#FEF2F2" : "#FFF7ED",
        borderColor:     isOverdue ? "#FECACA" : "#FDBA74",
      }}>
        <Text style={base.infoLabel}>Montant dû</Text>
        <Text style={{ ...base.infoValue, color: isOverdue ? accentRed : BRAND }}>
          {data.amount.toLocaleString("fr-FR")} {data.currency}
        </Text>
        <Text style={base.infoLabel}>Date d'échéance</Text>
        <Text style={base.infoValue}>{fmt(data.dueDate)}</Text>
        <Text style={base.infoLabel}>Asset</Text>
        <Text style={base.infoValue}>{data.assetName}</Text>
      </Section>
      <Button href={payUrl} style={{ ...base.btn, backgroundColor: isOverdue ? accentRed : BRAND }}>
        Payer maintenant
      </Button>
    </EmailBase>
  );
}

export async function sendRentReminderEmail(to: string, data: RentReminderData) {
  const subject = (data.daysOverdue ?? 0) > 0
    ? `Loyer en retard — ${data.assetName} (${data.daysOverdue}j de retard)`
    : `Rappel loyer — ${data.assetName} — échéance ${fmt(data.dueDate)}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    react: <RentReminderEmail data={data} />,
  });
}

// ─── 5. Nouveau ticket ───────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#B91C1C",
  HIGH:     "#D97706",
  MEDIUM:   "#2563EB",
  LOW:      "#64748B",
};

export interface NewTicketData {
  recipientName: string;
  ticketTitle:   string;
  ticketId:      string;
  priority:      string;
  createdBy:     string;
  isPortal:      boolean;
}

function NewTicketEmail({ data }: { data: NewTicketData }) {
  const ticketUrl     = `${APP_URL}/${data.isPortal ? "portal" : "dashboard"}/tickets/${data.ticketId}`;
  const priorityColor = PRIORITY_COLORS[data.priority] ?? PRIORITY_COLORS.MEDIUM;
  return (
    <EmailBase preview={`Nouveau ticket — ${data.ticketTitle}`}>
      <Heading as="h2" style={base.h2}>Nouveau ticket ouvert</Heading>
      <Text style={base.p}>Bonjour {data.recipientName},</Text>
      <Text style={base.p}>
        Un nouveau ticket a été ouvert par <strong>{data.createdBy}</strong>.
      </Text>
      <Section style={base.infoBox}>
        <Text style={base.infoLabel}>Titre</Text>
        <Text style={base.infoValue}>{data.ticketTitle}</Text>
        <Text style={base.infoLabel}>Priorité</Text>
        <Text style={{ ...base.infoValue, color: priorityColor }}>{data.priority}</Text>
        <Text style={base.infoLabel}>Ouvert par</Text>
        <Text style={base.infoValue}>{data.createdBy}</Text>
      </Section>
      <Button href={ticketUrl} style={base.btn}>
        Voir le ticket
      </Button>
    </EmailBase>
  );
}

export async function sendNewTicketEmail(to: string, data: NewTicketData) {
  return resend.emails.send({
    from:    FROM,
    to,
    subject: `Nouveau ticket — ${data.ticketTitle}`,
    react:   <NewTicketEmail data={data} />,
  });
}
