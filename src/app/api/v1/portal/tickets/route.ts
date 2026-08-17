import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const newTicketSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères"),
  body: z.string().min(10, "La description doit faire au moins 10 caractères"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const tickets = await db.supportTicket.findMany({
      where: { reportedById: session.user.id },
      include: { _count: { select: { comments: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = tickets.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt.toISOString(),
      _count: { comments: t._count.comments },
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/v1/portal/tickets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    const body = await req.json();
    const parsed = newTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { title, body: ticketBody, priority } = parsed.data;

    const orgId = user?.organizationId ?? (
      await db.organization.findFirst({ select: { id: true } })
    )?.id;

    if (!orgId) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    const ticket = await db.supportTicket.create({
      data: {
        organizationId: orgId,
        reportedById: session.user.id,
        title,
        body: ticketBody,
        priority,
        status: "OPEN",
        labels: [],
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/portal/tickets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
