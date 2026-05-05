import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!user?.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { isPublished } = await req.json();

    const asset = await db.asset.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!asset) return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

    const updated = await db.asset.update({
      where: { id },
      data: { isPublished: Boolean(isPublished) },
      select: { id: true, isPublished: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/v1/assets/[id]/published", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
