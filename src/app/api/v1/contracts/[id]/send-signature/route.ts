import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderContractPdf } from "@/lib/render-contract-pdf";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    const organizationId = userFromDb.organizationId;

    const { id } = await params;
    const contract = await db.contract.findFirst({
      where: { id, organizationId },
      include: {
        booking: {
          include: {
            customer: true,
            asset:    { include: { assetType: true } },
          },
        },
      },
    });

    if (!contract)
      return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
    if (contract.status === "SIGNED")
      return NextResponse.json({ error: "Contrat déjà signé" }, { status: 400 });

    const org = await db.organization.findUnique({ where: { id: organizationId } });

    // Générer le PDF directement (sans R2)
    const contractData = {
      booking:      contract.booking,
      asset:        contract.booking.asset,
      customer:     contract.booking.customer,
      organization: org,
      generatedAt:  new Date(),
    };
    const pdfBuffer = await renderContractPdf(contract.templateType, contractData);

    const yousignApiUrl = process.env.YOUSIGN_API_URL ?? "https://api.yousign.app/v3";
    const apiKey        = process.env.YOUSIGN_API_KEY!;
    const authHeaders   = { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" };

    // 1. Créer la demande de signature
    const srRes = await fetch(`${yousignApiUrl}/signature_requests`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name:          `Contrat - ${contract.booking.asset.name}`,
        delivery_mode: "email",
        timezone:      "Africa/Casablanca",
      }),
    });
    if (!srRes.ok) throw new Error("Échec création demande YouSign");
    const signatureRequest = await srRes.json();

    // 2. Envoyer le PDF généré directement à YouSign
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }), "contrat.pdf");
    formData.append("nature", "signable_document");

    const docRes = await fetch(
      `${yousignApiUrl}/signature_requests/${signatureRequest.id}/documents`,
      { method: "POST", headers: { "Authorization": `Bearer ${apiKey}` }, body: formData }
    );
    if (!docRes.ok) throw new Error("Échec upload document YouSign");
    const document = await docRes.json();

    // 3. Ajouter le signataire (client)
    const customer  = contract.booking.customer;
    const nameParts = customer.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(" ") || "-";

    const signerRes = await fetch(
      `${yousignApiUrl}/signature_requests/${signatureRequest.id}/signers`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          info: {
            first_name: firstName,
            last_name:  lastName,
            email:      customer.email ?? "",
            locale:     "fr",
            ...(customer.phone && { phone_number: customer.phone }),
          },
          signature_level:               "electronic_signature",
          signature_authentication_mode: "no_otp",
          fields: [{
            document_id: document.id,
            type:        "signature",
            page:        1,
            x:           100,
            y:           700,
            width:       200,
            height:      50,
          }],
        }),
      }
    );
    if (!signerRes.ok) throw new Error("Échec ajout signataire YouSign");

    // 4. Activer la demande
    const activateRes = await fetch(
      `${yousignApiUrl}/signature_requests/${signatureRequest.id}/activate`,
      { method: "POST", headers: authHeaders }
    );
    if (!activateRes.ok) throw new Error("Échec activation YouSign");

    // 5. Mettre à jour le contrat
    const updated = await db.contract.update({
      where: { id },
      data: { status: "SENT", yousignRequestId: signatureRequest.id },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId:   session.user.id,
        action:   "SEND_SIGNATURE",
        entity:   "Contract",
        entityId: id,
        newValue: { yousignRequestId: signatureRequest.id } as any,
      },
    });

    return NextResponse.json({
      success:          true,
      yousignRequestId: signatureRequest.id,
      contract:         updated,
    });
  } catch (error) {
    console.error("POST /api/v1/contracts/[id]/send-signature", error);
    return NextResponse.json({ error: "Échec envoi signature" }, { status: 500 });
  }
}
