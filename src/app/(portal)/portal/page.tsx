import { PageHeader } from "@/components/page-header";

export default function PortalPage() {
  return (
    <div>
      <PageHeader
        title="Mon espace"
        breadcrumb={["EnyaRent", "Portail Client"]}
      />
      <div className="p-8">
        <p className="text-slate-500 text-sm">Phase 6 — Dashboard client a venir.</p>
      </div>
    </div>
  );
}
