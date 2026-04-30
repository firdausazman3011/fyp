import crypto from "crypto";

import { prisma } from "@/lib/prisma";

const RESET_LINK_MINUTES = 15;

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function resetTokenExpiryDate() {
  return new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000);
}

export async function createResetToken(userId: string) {
  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: resetTokenExpiryDate(),
    },
  });

  return rawToken;
}

export async function consumeResetToken(rawToken: string) {
  const tokenHash = hashResetToken(rawToken);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) return null;
  if (resetRecord.usedAt) return null;
  if (resetRecord.expiresAt.getTime() < Date.now()) return null;

  return resetRecord;
}

export async function markResetTokenUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
