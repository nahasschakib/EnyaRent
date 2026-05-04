"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import {
  ArrowLeft, Send, Download, Archive, FileText,
  CheckCircle2, Clock, Plus, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  SENT:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SIGNED:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    "Brouillon",
  SENT:     "Envoyé pour signature",
  SIGNED:   "Signé",
  ARCHIVED: "Archivé",
};

const TEMPLATE_LABELS: Record<string, string> = {
  VEHICLE:     "Location véhicule",
  REAL_ESTATE: "Bail résidentiel",
  EQUIPMENT:   "Location équipement",
  HOSPITALITY: "Hôtellerie",
};

const INSPECTION_LABELS = {
  ENTRY: "État des lieux d'entrée",
  EXIT:  "État des lieux de sortie",
} as const;

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [showInspForm, setShowInspForm] = useState(false);
  const [inspType, setInspType] = useState<"ENTRY" | "EXIT">("ENTRY");
  const [inspNotes, setInspNotes] = useState("");

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/contracts/${id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const sendSignature = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/contracts/${id}/send-signature`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Échec de l'envoi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Contrat envoyé pour signature YouSign");
      qc.invalidateQueries({ queryKey: ["contract", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveContract = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v1/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!res.ok) throw new Error("Échec");
    },
    onSuccess: () => {
      toast.success("Contrat archivé");
      qc.invalidateQueries({ queryKey: ["contract", id] });
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  const createInspection = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: id,
          type: inspType,
          notes: inspNotes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Échec");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("État des lieux créé");
      setShowInspForm(false);
      setInspNotes("");
      qc.invalidateQueries({ queryKey: ["contract", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Chargement..." breadcrumb={["EnyaRent", "Contrats", "..."]} />
        <div className="p-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="Introuvable" breadcrumb={["EnyaRent", "Contrats"]} />
        <div className="p-8">
          <p className="text-sm text-slate-500">Contrat introuvable.</p>
        </div>
      </div>
    );
  }

  const pdfUrl = contract.signedPdfUrl ?? contract.pdfUrl;

  return (
    <div>
      <PageHeader
        title={`Contrat — ${contract.booking?.asset?.name ?? ""}`}
        breadcrumb={["EnyaRent", "Contrats", contract.booking?.asset?.name ?? id]}
        actions={
          <Link
            href="/dashboard/contracts"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={15} /> Retour
          </Link>
        }
      />

      <div className="p-8 grid grid-cols-3 gap-6 max-w-6xl">

        {/* Colonne principale — PDF + États des lieux */}
        <div className="col-span-2 space-y-6">

          {/* PDF Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText size={15} className="text-slate-400" />
                {TEMPLATE_LABELS[contract.templateType] ?? contract.templateType}
                {contract.signedPdfUrl && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} /> Signé
                  </span>
                )}
              </h2>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <Download size={13} /> Télécharger
                </a>
              )}
            </div>

            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[640px] bg-slate-50"
                title="Aperçu du contrat"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-20 text-slate-400">
                <FileText size={36} className="text-slate-300" />
                <p className="text-sm">PDF non disponible</p>
                <p className="text-xs text-slate-400">Le PDF sera généré à la création du contrat</p>
              </div>
            )}
          </div>

          {/* États des lieux */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList size={15} className="text-slate-400" />
                États des lieux
                {contract.inspections?.length > 0 && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {contract.inspections.length}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowInspForm(!showInspForm)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus size={13} />
                Nouvel état des lieux
              </button>
            </div>

            {showInspForm && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex gap-2">
                  {(["ENTRY", "EXIT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setInspType(t)}
                      className={cn(
                        "flex-1 h-9 text-sm font-medium rounded-lg border transition-colors",
                        inspType === t
                          ? "bg-primary-600 border-primary-600 text-white"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-600"
                      )}
                    >
                      {INSPECTION_LABELS[t]}
                    </button>
                  ))}
                </div>
                <textarea
                  value={inspNotes}
                  onChange={(e) => setInspNotes(e.target.value)}
                  placeholder="Observations, remarques, état général..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:border-primary-600 transition-colors"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowInspForm(false); setInspNotes(""); }}
                    className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => createInspection.mutate()}
                    disabled={createInspection.isPending}
                    className="px-3 py-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                  >
                    {createInspection.isPending ? "Création..." : "Créer"}
                  </button>
                </div>
              </div>
            )}

            {contract.inspections?.length === 0 && !showInspForm ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Aucun état des lieux enregistré
              </p>
            ) : (
              <div className="space-y-2">
                {contract.inspections?.map((insp: any) => (
                  <div
                    key={insp.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        insp.type === "ENTRY" ? "bg-blue-500" : "bg-orange-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {INSPECTION_LABELS[insp.type as keyof typeof INSPECTION_LABELS]}
                        </p>
                        <p className="text-xs text-slate-400 tabular-nums shrink-0 ml-4">
                          {fmt(insp.createdAt)}
                        </p>
                      </div>
                      {insp.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                          {insp.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Actions + Infos */}
        <div className="space-y-4">

          {/* Statut + Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Statut</h2>
              <span
                className={cn(
                  "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                  STATUS_STYLES[contract.status]
                )}
              >
                {STATUS_LABELS[contract.status] ?? contract.status}
              </span>
            </div>

            <div className="space-y-2">
              {contract.status === "DRAFT" && (
                <button
                  onClick={() => sendSignature.mutate()}
                  disabled={!contract.pdfUrl || sendSignature.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  title={!contract.pdfUrl ? "PDF requis pour envoyer la signature" : undefined}
                >
                  <Send size={14} />
                  {sendSignature.isPending ? "Envoi en cours..." : "Envoyer pour signature"}
                </button>
              )}

              {contract.status === "SENT" && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    En attente de signature du client via YouSign
                  </p>
                </div>
              )}

              {contract.status === "SIGNED" && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Contrat signé par toutes les parties
                  </p>
                </div>
              )}

              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  <Download size={14} />
                  {contract.signedPdfUrl ? "Télécharger (signé)" : "Télécharger le PDF"}
                </a>
              )}

              {contract.status !== "ARCHIVED" && (
                <button
                  onClick={() => {
                    if (confirm("Archiver ce contrat ?")) archiveContract.mutate();
                  }}
                  disabled={archiveContract.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Archive size={14} />
                  Archiver
                </button>
              )}
            </div>
          </div>

          {/* Informations contrat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Informations
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Asset
                </p>
                <Link
                  href={`/dashboard/assets/${contract.booking?.asset?.id}`}
                  className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 transition-colors"
                >
                  {contract.booking?.asset?.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {contract.booking?.asset?.assetType?.name}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Client
                </p>
                <Link
                  href={`/dashboard/customers/${contract.booking?.customer?.id}`}
                  className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 transition-colors"
                >
                  {contract.booking?.customer?.name}
                </Link>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Période
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  {contract.booking?.startDate ? fmt(contract.booking.startDate) : "—"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  au {contract.booking?.endDate ? fmt(contract.booking.endDate) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Montant
                </p>
                <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {contract.booking?.totalAmount
                    ? `${parseFloat(contract.booking.totalAmount).toLocaleString("fr-FR")} MAD`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Créé le
                </p>
                <p className="text-slate-700 dark:text-slate-300">{fmt(contract.createdAt)}</p>
              </div>
              {contract.yousignRequestId && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                    Réf. YouSign
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {contract.yousignRequestId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lien réservation */}
          <Link
            href={`/dashboard/bookings/${contract.bookingId}`}
            className="block w-full text-center py-2 text-sm text-primary-600 hover:text-primary-700 border border-slate-200 dark:border-slate-700 hover:border-primary-600 rounded-xl transition-colors"
          >
            Voir la réservation
          </Link>
        </div>
      </div>
    </div>
  );
}
