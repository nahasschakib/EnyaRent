import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { sendContractSignedEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const body   = await req.text();
    const secret = process.env.YOUSIGN_WEBHOOK_SECRET;

    // Vérification HMAC-SHA256 (active si YOUSIGN_WEBHOOK_SECRET est défini)
    if (secret) {
      const signature = req.headers.get("x-yousign-signature-256") ?? "";
      const expected  = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      if (signature !== expected)
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload          = JSON.parse(body);
    const { event_name, data } = payload;
    const signatureRequest = data?.signature_request;

    if (!signatureRequest?.id) return NextResponse.json({ received: true });

    const contract = await db.contract.findFirst({
      where: { yousignRequestId: signatureRequest.id },
    });
    if (!contract) return NextResponse.json({ received: true });

    if (event_name === "signature_request.done") {
      const yousignApiUrl = process.env.YOUSIGN_API_URL ?? "https://api.yousign.app/v3";
      const docsRes = await fetch(
        `${yousignApiUrl}/signature_requests/${signatureRequest.id}/documents`,
        { headers: { "Authorization": `Bearer ${process.env.YOUSIGN_API_KEY!}` } }
      );

      let signedPdfUrl: string | undefined;
      if (docsRes.ok) {
        const docs = await docsRes.json();
        const doc  = Array.isArray(docs)
          ? docs.find((d: any) => d.nature === "signable_document")
          : null;
        signedPdfUrl = doc?.download_url;
      }

      const updatedContract = await db.contract.update({
        where: { id: contract.id },
        data: { status: "SIGNED", ...(signedPdfUrl && { signedPdfUrl }) },
        include: {
          booking: {
            include: {
              asset:    { select: { name: true } },
              customer: { select: { name: true, email: true } },
            },
          },
        },
      });

      if (updatedContract.booking.customer.email) {
        sendContractSignedEmail(updatedContract.booking.customer.email, {
          customerName: updatedContract.booking.customer.name,
          assetName:    updatedContract.booking.asset.name,
          pdfUrl:       signedPdfUrl ?? updatedContract.pdfUrl ?? "",
          contractId:   contract.id,
        }).catch(console.error);
      }

      // Notifier l'ADMIN de l'organisation
      const admin = await db.user.findFirst({
        where: { organizationId: contract.organizationId, role: "ADMIN" },
        select: { id: true },
      });
      if (admin) {
        await db.notification.create({
          data: {
            userId:         admin.id,
            organizationId: contract.organizationId,
            type:           "CONTRACT_SIGNED",
            title:          "Contrat signé",
            body:           "Le contrat a été signé par toutes les parties.",
            link:           `/dashboard/contracts/${contract.id}`,
          },
        });
      }
    }

    if (event_name === "signature_request.declined") {
      await db.contract.update({
        where: { id: contract.id },
        data: { status: "DRAFT" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/webhooks/yousign", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
