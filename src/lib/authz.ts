import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const ROLES = [
  "SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER", "CLIENT",
] as const;
export type Role = (typeof ROLES)[number];

// Source unique de vérité. Toute nouvelle route déclare sa permission ici.
export const PERMISSIONS = {
  "asset:read":      ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER", "CLIENT"],
  "asset:create":    ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER"],
  "asset:update":    ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER"],
  "asset:delete":    ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "OWNER"],
  "booking:create":  ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER", "CLIENT"],
  "booking:manage":  ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER"],
  "customer:manage": ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER"],
  "contract:manage": ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "OWNER"],
  "payment:manual":  ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER"],
  "invoice:manage":  ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER"],
  "org:settings":    ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "OWNER"],
  "ticket:read":    ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER", "CLIENT"],
  "ticket:comment": ["SUPER_ADMIN", "PROFESSIONAL", "ADMIN", "MANAGER", "OWNER", "CLIENT"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

type GuardOk = {
  ok: true;
  userId: string;
  role: Role;
  organizationId: string;
};
type GuardFail = { ok: false; response: NextResponse };

/**
 * Garde unique : authentification + permission + résolution du tenant.
 * L'organizationId retourné DOIT être utilisé dans le where de toute requête.
 */
export async function guard(
  req: NextRequest,
  permission: Permission
): Promise<GuardOk | GuardFail> {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Non authentifié" }, { status: 401 }),
    };
  }

  const role = session.user.role as Role;

  if (!hasPermission(role, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Permission insuffisante" },
        { status: 403 }
      ),
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Aucune organisation rattachée" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: session.user.id,
    role,
    organizationId: user.organizationId,
  };
}