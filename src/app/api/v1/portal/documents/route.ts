import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const customer = await db.customer.findFirst({ where: { email: session.user.email } });
    if (!customer) return NextResponse.json({ data: [] });

    const [contracts, invoices] = await Promise.all([
      db.contract.findMany({
        where: { booking: { customerId: customer.id } },
        include: { booking: { include: { asset: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.findMany({
        where: { customerId: customer.id },
        include: { booking: { include: { asset: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const docs = [
      ...contracts.map((c) => ({
        id: c.id,
        type: "CONTRACT" as const,
        label: `Contrat — ${c.booking.asset.name}`,
        assetName: c.booking.asset.name,
        date: c.createdAt.toISOString(),
        pdfUrl: c.signedPdfUrl ?? c.pdfUrl,
        status: c.status,
      })),
      ...invoices.map((inv) => ({
        id: inv.id,
        type: "INVOICE" as const,
        label: `Facture ${inv.number}`,
        assetName: inv.booking?.asset.name ?? "—",
        date: inv.createdAt.toISOString(),
        pdfUrl: inv.pdfUrl,
        status: inv.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ data: docs });
  } catch (error) {
    console.error("[GET /api/v1/portal/documents]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
