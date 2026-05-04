import { PortalSidebar } from "@/components/portal/sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
