import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        breadcrumb={["EnyaRent", "Dashboard"]}
      />
      <div className="p-8">
        <p className="text-slate-500 text-sm">Phase 2 — KPIs et analytics a venir.</p>
      </div>
    </div>
  );
}
