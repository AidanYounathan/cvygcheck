import { prisma } from "@/lib/prisma";

export const TOKEN_TTL_MS = 2 * 60 * 1000;         // 2 min — unclaimed QR expires on kiosk
export const SUBMISSION_TTL_MS = 10 * 60 * 1000;   // 10 min — time allowed to fill out form

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
  const expiryThreshold = new Date(Date.now() - TOKEN_TTL_MS);

  return prisma.$transaction(async (tx) => {
    const token = await tx.token.findUnique({ where: { value } });

    if (!token) throw new Error("TOKEN_NOT_FOUND");
    if (token.claimed) throw new Error("TOKEN_ALREADY_CLAIMED");
    if (token.createdAt < expiryThreshold) throw new Error("TOKEN_EXPIRED");

    const [claimed] = await Promise.all([
      tx.token.update({
        where: { id: token.id },
        data: { claimed: true, claimedAt: new Date() },
      }),
      tx.token.create({ data: { value: generateValue() } }),
    ]);

    return claimed;
  });
}
