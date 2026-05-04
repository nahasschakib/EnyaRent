import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";


export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")   ?? "1"));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const status = searchParams.get("status") ?? "";
    const skip   = (page - 1) * limit;

    const where: any = { organizationId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      db.contract.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            include: {
              asset:    { select: { id: true, name: true, assetType: true } },
              customer: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.contract.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/contracts", error);
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
  }
}

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

    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });

    const booking = await db.booking.findFirst({
      where: { id: bookingId, organizationId },
    });
    if (!booking)
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });

    const existing = await db.contract.findUnique({ where: { bookingId } });
    if (existing)
      return NextResponse.json(
        { error: "Un contrat existe déjà pour cette réservation", contractId: existing.id },
        { status: 409 }
      );

    const asset = await db.asset.findFirst({
      where: { id: booking.assetId },
      include: { assetType: true },
    });
    const templateType = asset?.assetType?.sector ?? "REAL_ESTATE";

    // Créer le contrat sans PDF (généré à la demande)
    const contract = await db.contract.create({
      data: {
        organizationId,
        bookingId,
        templateType,
        content: {},
        pdfUrl:  null,
        status:  "DRAFT",
      },
      include: {
        booking: {
          include: {
            asset:    { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    // pdfUrl pointe vers l'endpoint de génération à la demande
    const pdfUrl = `/api/v1/contracts/${contract.id}/pdf`;
    await db.contract.update({ where: { id: contract.id }, data: { pdfUrl } });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "CREATE",
        entity:   "Contract",
        entityId: contract.id,
        newValue: { id: contract.id, bookingId, templateType } as any,
      },
    });

    return NextResponse.json({ ...contract, pdfUrl }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/contracts", error);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
