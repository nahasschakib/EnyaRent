import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgSlug, assetId, name, email, phone, startDate, endDate, message } = body;

    if (!orgSlug || !assetId || !name || !email || !startDate || !endDate) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const org = await db.organization.findFirst({
      where: { slug: orgSlug, isPublic: true },
    });
    if (!org) {
      return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });
    }

    const asset = await db.asset.findFirst({
      where: { id: assetId, organizationId: org.id, isPublished: true },
      include: { assetType: true },
    });
    if (!asset) {
      return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }

    // Find or create customer by email
    let customer = email
      ? await db.customer.findFirst({ where: { email, organizationId: org.id } })
      : null;

    if (!customer) {
      customer = await db.customer.create({
        data: {
          organizationId: org.id,
          name,
          email,
          phone: phone ?? null,
          type: "INDIVIDUAL",
        },
      });
    } else if (phone && !customer.phone) {
      await db.customer.update({ where: { id: customer.id }, data: { phone } });
    }

    // Determine booking type and amount
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const sector = asset.assetType.sector;
    let bookingType: "NIGHTLY" | "DAILY" | "MONTHLY" = "DAILY";
    let amount = 0;

    if (sector === "REAL_ESTATE") {
      bookingType = "MONTHLY";
      amount = Number(asset.pricePerMonth ?? 0) * Math.max(1, Math.round(diffDays / 30));
    } else if (sector === "HOSPITALITY") {
      bookingType = "NIGHTLY";
      amount = Number(asset.pricePerNight ?? 0) * diffDays;
    } else {
      bookingType = "DAILY";
      amount = Number(asset.pricePerDay ?? 0) * diffDays;
    }

    const booking = await db.booking.create({
      data: {
        organizationId: org.id,
        assetId: asset.id,
        customerId: customer.id,
        startDate: start,
        endDate: end,
        type: bookingType,
        status: "PENDING",
        totalAmount: amount,
        depositAmount: asset.deposit ?? null,
        notes: message ?? null,
      },
    });

    return NextResponse.json({ bookingId: booking.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/public/booking-requests", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
