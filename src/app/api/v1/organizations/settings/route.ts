import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getOrgId(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });
  return user?.organizationId ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        isPublic: true,
        plan: true,
      },
    });

    return NextResponse.json(org);
  } catch (error) {
    console.error("GET /api/v1/organizations/settings", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const orgId = await getOrgId(req);
    if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { slug, description, logoUrl, coverUrl, isPublic, name } = body;

    // Validate slug if provided
    if (slug !== undefined) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: "Slug invalide — uniquement lettres minuscules, chiffres et tirets" },
          { status: 400 }
        );
      }
      const existing = await db.organization.findFirst({
        where: { slug, NOT: { id: orgId } },
      });
      if (existing) {
        return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
      }
    }

    const org = await db.organization.update({
      where: { id: orgId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(coverUrl !== undefined ? { coverUrl } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        isPublic: true,
      },
    });

    return NextResponse.json(org);
  } catch (error) {
    console.error("PATCH /api/v1/organizations/settings", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
