import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search") ?? "";
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { cin: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          guarantor: true,
          _count: { select: { bookings: true } },
        },
      }),
      db.customer.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET /api/v1/customers", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, email, phone, cin, passportNumber, address, type, guarantor } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        organizationId,
        name,
        email,
        phone,
        cin,
        passportNumber,
        address,
        type: type ?? "INDIVIDUAL",
        ...(guarantor && {
          guarantor: {
            create: {
              name: guarantor.name,
              cin: guarantor.cin,
              phone: guarantor.phone,
              address: guarantor.address,
              documentUrl: guarantor.documentUrl,
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
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id,
        newValue: customer as any,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/customers", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
