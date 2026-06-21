import { prisma } from "@/lib/prisma";

export const TOKEN_TTL_MS = 2 * 60 * 1000;         // 2 min — unclaimed QR expires on kiosk
export const SUBMISSION_TTL_MS = 10 * 60 * 1000;   // 10 min — time allowed to fill out form

// Minimal shape needed for validation — plain objects satisfy this, so tests never import Prisma
export type TokenForValidation = {
  claimed: boolean;
  claimedAt: Date | null;
  used: boolean;
  createdAt: Date;
};

export function validateForClaim(token: TokenForValidation | null, now = Date.now()): void {
  if (!token) throw new Error("TOKEN_NOT_FOUND");
  if (token.claimed) throw new Error("TOKEN_ALREADY_CLAIMED");
  if (token.createdAt.getTime() < now - TOKEN_TTL_MS) throw new Error("TOKEN_EXPIRED");
}

export function validateForSubmit(token: TokenForValidation | null, now = Date.now()): void {
  if (!token) throw new Error("TOKEN_NOT_FOUND");
  if (!token.claimed) throw new Error("TOKEN_NOT_CLAIMED");
  if (token.used) throw new Error("TOKEN_ALREADY_USED");
  const claimedAt = token.claimedAt ?? token.createdAt;
  if (now - claimedAt.getTime() > SUBMISSION_TTL_MS) throw new Error("TOKEN_EXPIRED");
}

function generateValue(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function getOrCreateActiveToken() {
  const expiryThreshold = new Date(Date.now() - TOKEN_TTL_MS);

  const existing = await prisma.token.findFirst({
    where: { claimed: false, createdAt: { gt: expiryThreshold } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return prisma.token.create({ data: { value: generateValue() } });
}

export async function claimToken(value: string) {
  const now = Date.now();

  return prisma.$transaction(async (tx) => {
    const token = await tx.token.findUnique({ where: { value } });

    validateForClaim(token, now);

    const [claimed] = await Promise.all([
      tx.token.update({
        where: { id: token!.id },
        data: { claimed: true, claimedAt: new Date() },
      }),
      tx.token.create({ data: { value: generateValue() } }),
    ]);

    return claimed;
  });
}
