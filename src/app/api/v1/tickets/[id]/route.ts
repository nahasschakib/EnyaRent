// src/app/api/v1/tickets/[id]/route.ts
// GET — Détail ticket avec commentaires + activité
// PUT — Mise à jour statut, priorité, assignation, labels

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

async function getOrgId(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const orgId = await getOrgId(session.user.id);

    const ticket = await db.supportTicket.findUnique({
      where: { id, organizationId: orgId ?? undefined },
      include: {
        reportedBy: { select: { id: true, name: true, image: true, email: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
        },
        activity: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[GET /api/v1/tickets/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  title: z.string().min(5).optional(),
  body: z.string().min(10).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const orgId = await getOrgId(session.user.id);

    const existing = await db.supportTicket.findUnique({
      where: { id, organizationId: orgId ?? undefined },
    });

    if (!existing) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const body = await req.json();
    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const activities: { action: string; metadata: Record<string, unknown> }[] = [];

    if (data.status && data.status !== existing.status) {
      activities.push({ action: "STATUS_CHANGED", metadata: { from: existing.status, to: data.status } });
    }
    if (data.priority && data.priority !== existing.priority) {
      activities.push({ action: "PRIORITY_CHANGED", metadata: { from: existing.priority, to: data.priority } });
    }
    if ("assignedToId" in data && data.assignedToId !== existing.assignedToId) {
      activities.push({
        action: data.assignedToId ? "ASSIGNED" : "UNASSIGNED",
        metadata: { assignedToId: data.assignedToId },
      });
    }

    const updated = await db.supportTicket.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...("assignedToId" in data && { assignedToId: data.assignedToId }),
        ...(data.labels && { labels: JSON.parse(JSON.stringify(data.labels)) }),
        ...(data.title && { title: data.title }),
        ...(data.body && { body: data.body }),
      },
      include: {
        reportedBy: { select: { id: true, name: true, image: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
      },
    });

    await Promise.all(
      activities.map((act) =>
        db.ticketActivity.create({
          data: {
            ticketId: id,
            userId: session.user.id,
            action: act.action,
            metadata: JSON.parse(JSON.stringify(act.metadata)),
          },
        })
      )
    );

    if (data.status && data.status !== existing.status) {
      const statusLabels: Record<string, string> = {
        IN_PROGRESS: "En cours de traitement",
        RESOLVED: "Résolu",
        CLOSED: "Fermé",
        ON_HOLD: "Mis en attente",
      };
      if (statusLabels[data.status]) {
        await db.notification.create({
          data: {
            userId: existing.reportedById,
            organizationId: existing.organizationId,
            type: "TICKET_STATUS_CHANGED",
            title: `Ticket ${statusLabels[data.status]}`,
            body: `Votre ticket "${existing.title}" est maintenant : ${statusLabels[data.status]}`,
            link: `/portal/tickets/${id}`,
          },
        });
      }
    }

    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      await db.notification.create({
        data: {
          userId: data.assignedToId,
          organizationId: existing.organizationId,
          type: "TICKET_ASSIGNED",
          title: "Ticket assigné",
          body: `"${existing.title}" vous a été assigné`,
          link: `/dashboard/tickets/${id}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/v1/tickets/[id]]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
