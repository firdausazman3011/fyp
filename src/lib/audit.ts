import { prisma } from "@/lib/prisma";

export async function logAdminAction(adminId: string, action: string, entityType: string, entityId: string, details?: string) {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      entityType,
      entityId,
      details,
    },
  });
}
