import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
};
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "assets");

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "Aucune organisation" }, { status: 403 });
    }

    const { id: assetId } = await params;
    const asset = await db.asset.findFirst({
      where: { id: assetId, organizationId: userFromDb.organizationId },
      select: { id: true },
    });
    if (!asset) return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Type non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    const url = `/uploads/assets/${filename}`;

    const maxOrder = await db.assetPhoto.findFirst({
      where: { assetId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const photo = await db.assetPhoto.create({
      data: { assetId, url, order: (maxOrder?.order ?? -1) + 1 },
    });

    return NextResponse.json({ id: photo.id, url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/assets/[id]/photos", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "Aucune organisation" }, { status: 403 });
    }

    const { id: assetId } = await params;
    const asset = await db.asset.findFirst({
      where: { id: assetId, organizationId: userFromDb.organizationId },
      select: { id: true },
    });
    if (!asset) return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    if (!photoId) return NextResponse.json({ error: "photoId requis" }, { status: 400 });

    const photo = await db.assetPhoto.findFirst({ where: { id: photoId, assetId } });
    if (!photo) return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });

    // Delete local file (best-effort)
    if (photo.url.startsWith("/uploads/assets/")) {
      const filepath = join(process.cwd(), "public", photo.url);
      await unlink(filepath).catch(() => {});
    }

    await db.assetPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/assets/[id]/photos", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
