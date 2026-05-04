import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const slug = name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueSlug = `${slug}-${Date.now()}`;

    const org = await db.organization.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        plan: "FREE",
        settings: {},
      },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: {
        organizationId: org.id,
        role: "ADMIN",
      },
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/organizations", error);
    return NextResponse.json({ error: "Échec de la création" }, { status: 500 });
  }
}
