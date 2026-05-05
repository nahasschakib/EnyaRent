import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_ROLES = ["PROFESSIONAL", "OWNER", "CLIENT"] as const;
type NewRole = (typeof VALID_ROLES)[number];

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { role, companyName, displayName } = body as {
      role: NewRole;
      companyName?: string;
      displayName?: string;
    };

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    let organizationId: string | undefined;

    if (role === "PROFESSIONAL") {
      const orgName = companyName?.trim();
      if (!orgName) {
        return NextResponse.json(
          { error: "Nom de l'entreprise requis" },
          { status: 400 }
        );
      }

      const slug = generateSlug(orgName);
      const org = await db.organization.create({
        data: {
          name: orgName,
          slug: `${slug}-${Date.now()}`,
          plan: "FREE",
          type: "PROFESSIONAL",
          settings: {},
        },
      });
      organizationId = org.id;
    } else if (role === "OWNER") {
      const orgName = (displayName ?? session.user.name).trim();
      const slug = generateSlug(orgName);
      const org = await db.organization.create({
        data: {
          name: orgName,
          slug: `${slug}-${Date.now()}`,
          plan: "FREE",
          type: "PERSONAL",
          settings: {},
        },
      });
      organizationId = org.id;
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        role,
        ...(organizationId ? { organizationId } : {}),
      },
    });

    return NextResponse.json({ success: true, role, organizationId });
  } catch (error) {
    console.error("POST /api/v1/auth/complete-signup", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
