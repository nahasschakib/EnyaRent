// src/app/api/v1/tickets/route.ts
// GET — Liste tickets avec filtres
// POST — Créer un ticket

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

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orgId = await getOrgId(session.user.id);
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedTo");
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { organizationId: orgId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reportedBy: { select: { id: true, name: true, image: true } },
          assignedTo: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
        },
      }),
      db.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/v1/tickets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const createTicketSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères"),
  body: z.string().min(10, "La description doit faire au moins 10 caractères"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  sector: z.enum(["REAL_ESTATE", "VEHICLE", "HOSPITALITY", "EQUIPMENT"]).optional(),
  assignedToId: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const orgId = await getOrgId(session.user.id);
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        organizationId: orgId,
        reportedById: session.user.id,
        title: parsed.data.title,
        body: parsed.data.body,
        priority: parsed.data.priority,
        sector: parsed.data.sector ?? null,
        assignedToId: parsed.data.assignedToId ?? null,
        status: "OPEN",
        labels: JSON.parse(JSON.stringify(parsed.data.labels)),
      },
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Activité : création
    await db.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: session.user.id,
        action: "CREATED",
        metadata: JSON.parse(JSON.stringify({ title: ticket.title })),
      },
    });

    // Notification à l'assigné si défini
    if (parsed.data.assignedToId) {
      await db.notification.create({
        data: {
          userId: parsed.data.assignedToId,
          organizationId: orgId,
          type: "TICKET_ASSIGNED",
          title: "Nouveau ticket assigné",
          body: `"${ticket.title}" vous a été assigné`,
          link: `/dashboard/tickets/${ticket.id}`,
        },
      });
    }

    await db.auditLog.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        action: "CREATE_TICKET",
        entity: "SupportTicket",
        entityId: ticket.id,
        newValue: JSON.parse(JSON.stringify({ title: ticket.title, priority: ticket.priority })),
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/tickets]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}