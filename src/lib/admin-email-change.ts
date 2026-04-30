import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_CHANGE_LINK_MINUTES = 30;

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function expiryDate() {
  return new Date(Date.now() + EMAIL_CHANGE_LINK_MINUTES * 60 * 1000);
}

export async function createAdminEmailChangeToken(adminId: string, newEmail: string) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  await prisma.adminEmailChangeToken.create({
    data: {
      adminId,
      newEmail,
      tokenHash,
      expiresAt: expiryDate(),
    },
  });

  return rawToken;
}

export async function consumeAdminEmailChangeToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.adminEmailChangeToken.findUnique({
    where: { tokenHash },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record;
}

export async function markAdminEmailChangeTokenUsed(id: string) {
  await prisma.adminEmailChangeToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
