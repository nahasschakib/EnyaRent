import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });

    const { id } = await params;
    const contract = await db.contract.findFirst({
      where: { id, organizationId: userFromDb.organizationId },
      include: {
        booking: {
          include: {
            asset:    { include: { assetType: true, photos: { take: 1 } } },
            customer: { include: { guarantor: true } },
            payments: { orderBy: { createdAt: "desc" } },
          },
        },
        inspections: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!contract) return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    return NextResponse.json(contract);
  } catch (error) {
    console.error("GET /api/v1/contracts/[id]", error);
    return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const existing = await db.contract.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });

    const body = await req.json();
    const { status, signedPdfUrl, yousignRequestId, content } = body;

    const updated = await db.contract.update({
      where: { id },
      data: {
        ...(status           !== undefined && { status }),
        ...(signedPdfUrl     !== undefined && { signedPdfUrl }),
        ...(yousignRequestId !== undefined && { yousignRequestId }),
        ...(content          !== undefined && { content }),
      },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "UPDATE",
        entity:   "Contract",
        entityId: id,
        oldValue: { status: existing.status } as any,
        newValue: { status: updated.status  } as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/v1/contracts/[id]", error);
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}
