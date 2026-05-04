import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const customer = await db.customer.findFirst({
      where: { id, organizationId },
      include: {
        guarantor: true,
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { asset: { include: { assetType: true } } },
        },
        payments: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { bookings: true, payments: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("GET /api/v1/customers/[id]", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const existing = await db.customer.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, phone, cin, passportNumber, address, type, score, guarantor } = body;

    const updated = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(cin !== undefined && { cin }),
        ...(passportNumber !== undefined && { passportNumber }),
        ...(address !== undefined && { address }),
        ...(type !== undefined && { type }),
        ...(score !== undefined && { score }),
        ...(guarantor !== undefined && {
          guarantor: {
            upsert: {
              create: {
                name: guarantor.name,
                cin: guarantor.cin,
                phone: guarantor.phone,
                address: guarantor.address,
                documentUrl: guarantor.documentUrl,
              },
              update: {
                name: guarantor.name,
                cin: guarantor.cin,
                phone: guarantor.phone,
                address: guarantor.address,
                documentUrl: guarantor.documentUrl,
              },
            },
          },
        }),
      },
      include: { guarantor: true },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "UPDATE",
        entity: "Customer",
        entityId: id,
        oldValue: existing as any,
        newValue: updated as any,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/v1/customers/[id]", error);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id } = await params;

    const existing = await db.customer.findFirst({ where: { id, organizationId } });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await db.customer.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "DELETE",
        entity: "Customer",
        entityId: id,
        oldValue: existing as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/customers/[id]", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
