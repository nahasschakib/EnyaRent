import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    const organizationId = userFromDb.organizationId;

    const body = await req.json();
    const { contractId, type, notes, photos, signedBy } = body;

    if (!contractId || !type)
      return NextResponse.json({ error: "contractId et type sont requis" }, { status: 400 });
    if (!["ENTRY", "EXIT"].includes(type))
      return NextResponse.json({ error: "type doit être ENTRY ou EXIT" }, { status: 400 });

    const contract = await db.contract.findFirst({ where: { id: contractId, organizationId } });
    if (!contract)
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });

    const inspection = await db.inspection.create({
      data: {
        contractId,
        type,
        notes:    notes    ?? null,
        photos:   photos   ?? [],
        signedBy: signedBy ?? {},
      },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "CREATE",
        entity:   "Inspection",
        entityId: inspection.id,
        newValue: inspection as any,
      },
    });

    return NextResponse.json(inspection, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/inspections", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}
