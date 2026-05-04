import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
