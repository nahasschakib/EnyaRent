import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { renderContractPdf } from "@/lib/render-contract-pdf";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userFromDb = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    if (!userFromDb?.organizationId)
      return NextResponse.json({ error: "No organization" }, { status: 403 });

    const { id } = await params;
    const contract = await db.contract.findFirst({
      where: { id, organizationId: userFromDb.organizationId },
      include: {
        booking: {
          include: {
            asset:    { include: { assetType: true } },
            customer: true,
          },
        },
      },
    });

    if (!contract) return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });

    const org = await db.organization.findUnique({
      where: { id: userFromDb.organizationId },
    });

    const contractData = {
      booking:      contract.booking,
      asset:        contract.booking.asset,
      customer:     contract.booking.customer,
      organization: org,
      generatedAt:  new Date(),
    };

    const liveTemplateType =
      contract.booking.asset.assetType?.sector ?? contract.templateType;

    console.log("DEBUG asset:", JSON.stringify({
      assetType: contract.booking.asset.assetType,
      sector: contract.booking.asset.assetType?.sector,
      liveTemplateType,
    }, null, 2));

    const buffer = await renderContractPdf(liveTemplateType, contractData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="contrat-${id}.pdf"`,
        "Content-Length":      String(buffer.length),
        "Cache-Control":       "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/v1/contracts/[id]/pdf", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
