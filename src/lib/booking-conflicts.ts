import { db } from "./db";

export async function checkConflict(
  assetId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<{ conflict: boolean; reason?: string }> {
  const bookingConflict = await db.booking.findFirst({
    where: {
      assetId,
      status: { notIn: ["CANCELLED"] },
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
    select: { id: true, startDate: true, endDate: true },
  });

  if (bookingConflict) {
    return {
      conflict: true,
      reason: `Réservation existante du ${bookingConflict.startDate.toLocaleDateString("fr-FR")} au ${bookingConflict.endDate.toLocaleDateString("fr-FR")}`,
    };
  }

  const blockConflict = await db.availabilityBlock.findFirst({
    where: {
      assetId,
      AND: [
        { startDate: { lt: endDate } },
        { endDate: { gt: startDate } },
      ],
    },
    select: { reason: true, startDate: true, endDate: true },
  });

  if (blockConflict) {
    return {
      conflict: true,
      reason: blockConflict.reason ?? `Asset bloqué du ${blockConflict.startDate.toLocaleDateString("fr-FR")} au ${blockConflict.endDate.toLocaleDateString("fr-FR")}`,
    };
  }

  return { conflict: false };
}
