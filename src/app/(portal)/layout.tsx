// src/app/(portal)/portal/layout.tsx
// Layout du portail client — navigation simplifiée, identité client

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import PortalSidebar from "@/components/portal/Portalsidebar";


export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }

  // Le portail est accessible aux CLIENTs et aux autres rôles aussi
  // (un ADMIN peut consulter le portail pour tester)

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <PortalSidebar user={session.user} />
      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}