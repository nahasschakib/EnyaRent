"use client";
import { useQuery } from "@tanstack/react-query";

interface Doc {
  id: string;
  type: string;
  label: string;
  assetName: string;
  date: string;
  pdfUrl: string | null;
  status: string;
}

export default function PortalDocumentsPage() {
  const { data, isLoading } = useQuery<{ data: Doc[] }>({
    queryKey: ["portal-documents"],
    queryFn: async () => {
      const res = await fetch("/api/v1/portal/documents");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const docs = data?.data ?? [];

  const handleOpen = async (doc: Doc) => {
    if (!doc.pdfUrl) {
      if (doc.type === "CONTRACT") {
        const res = await fetch(`/api/v1/contracts/${doc.id}/pdf`, { method: "POST" });
        const data = await res.json();
        if (data.pdfUrl) openPdfUrl(data.pdfUrl);
      }
      return;
    }
    openPdfUrl(doc.pdfUrl);
  };

  function openPdfUrl(url: string) {
    if (url.startsWith("data:")) {
      const [header, b64] = url.split(",");
      const mime = header.match(/:(.*?);/)?.[1] ?? "application/pdf";
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      window.open(URL.createObjectURL(new Blob([arr], { type: mime })), "_blank");
    } else {
      window.open(url, "_blank");
    }
  }

  const DOC_ICONS: Record<string, string> = {
    CONTRACT: "📋", INVOICE: "🧾", RECEIPT: "✅",
  };

  const DOC_LABELS: Record<string, string> = {
    CONTRACT: "Contrat", INVOICE: "Facture", RECEIPT: "Quittance",
  };

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes documents</h1>
        <p className="text-sm text-slate-400 mt-1">Contrats, factures et quittances</p>
      </div>

      {docs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm font-medium text-slate-700">Aucun document</p>
          <p className="text-xs text-slate-400 mt-1">Vos contrats et quittances apparaîtront ici</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                  {DOC_ICONS[doc.type] ?? "📄"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{doc.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {DOC_LABELS[doc.type] ?? doc.type} · {doc.assetName} ·{" "}
                    {new Date(doc.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpen(doc)}
                disabled={!doc.pdfUrl}
                className="flex-shrink-0 h-8 px-3 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                Ouvrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
