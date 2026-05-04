import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const db = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL!),
});

async function main() {
  // Récupérer tous les contrats avec le secteur de leur asset
  const contracts = await db.contract.findMany({
    include: {
      booking: {
        include: {
          asset: { include: { assetType: true } },
        },
      },
    },
  });

  let fixed = 0;
  for (const contract of contracts) {
    const sector = contract.booking.asset.assetType?.sector;
    if (!sector) continue;
    if (contract.templateType === sector) continue;

    await db.contract.update({
      where: { id: contract.id },
      data: { templateType: sector },
    });

    console.log(
      `✅ Contrat ${contract.id.slice(0, 8)} — "${contract.booking.asset.name}" : ${contract.templateType} → ${sector}`
    );
    fixed++;
  }

  if (fixed === 0) console.log("✅ Tous les contrats sont déjà à jour.");

  // État final
  const all = await db.contract.findMany({
    select: {
      id: true,
      templateType: true,
      booking: { select: { asset: { select: { name: true } } } },
    },
  });

  console.log("\n📋 État final des contrats :");
  console.table(
    all.map((c) => ({
      id:           c.id.slice(0, 8),
      asset:        c.booking.asset.name,
      templateType: c.templateType,
    }))
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
