import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard } from "@/lib/authz";
import { z } from "zod";

const createCommentSchema = z.object({
  text: z.string().min(1, "Le commentaire ne peut pas être vide"),
  attachments: z.array(z.unknown()).default([]),
});

/**
 * Vérifie que le ticket existe ET appartient à l'organisation de l'appelant.
 * Retourne null si l'accès doit être refusé.
 */
async function assertTicketAccess(ticketId: string, organizationId: string) {
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, organizationId },
    select: { id: true },
  });
  return ticket;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const g = await guard(req, "ticket:read");
    if (!g.ok) return g.response;

    const ticket = await assertTicketAccess(id, g.organizationId);
    if (!ticket) {
      // 404 volontaire : ne pas révéler l'existence du ticket
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const comments = await db.ticketComment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("[GET /api/v1/tickets/[id]/comments]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const g = await guard(req, "ticket:comment");
    if (!g.ok) return g.response;

    const ticket = await assertTicketAccess(id, g.organizationId);
    if (!ticket) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    const parsed = createCommentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: id,
        authorId: g.userId,
        body: parsed.data.text,
        attachments: JSON.parse(JSON.stringify(parsed.data.attachments)),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/v1/tickets/[id]/comments]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}