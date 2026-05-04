import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

function createS3() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id: assetId } = await params;

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `assets/${assetId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const s3 = createS3();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = `${process.env.CLOUDFLARE_R2_PUBLIC_DEV_URL}/${key}`;

    const maxOrder = await db.assetPhoto.findFirst({
      where: { assetId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const photo = await db.assetPhoto.create({
      data: { assetId, url, order: (maxOrder?.order ?? -1) + 1 },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/assets/[id]/photos", error);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });
    if (!userFromDb?.organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const organizationId = userFromDb.organizationId;
    const { id: assetId } = await params;

    const asset = await db.asset.findFirst({ where: { id: assetId, organizationId } });
    if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    if (!photoId) return NextResponse.json({ error: "photoId requis" }, { status: 400 });

    const photo = await db.assetPhoto.findFirst({ where: { id: photoId, assetId } });
    if (!photo) return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });

    const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_DEV_URL ?? "";
    const key = photo.url.startsWith(baseUrl + "/")
      ? photo.url.slice(baseUrl.length + 1)
      : null;

    if (key) {
      try {
        const s3 = createS3();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            Key: key,
          })
        );
      } catch {
        // Continue even if R2 delete fails
      }
    }

    await db.assetPhoto.delete({ where: { id: photoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/v1/assets/[id]/photos", error);
    return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 });
  }
}
