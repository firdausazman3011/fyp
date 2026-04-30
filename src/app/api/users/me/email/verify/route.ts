import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  consumeAdminEmailChangeToken,
  markAdminEmailChangeTokenUsed,
} from "@/lib/admin-email-change";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/admin/change-email?status=missing-token`);
  }

  const record = await consumeAdminEmailChangeToken(token);
  if (!record) {
    return NextResponse.redirect(`${appUrl}/admin/change-email?status=invalid-token`);
  }

  const existing = await prisma.user.findUnique({
    where: { email: record.newEmail },
    select: { id: true },
  });
  if (existing && existing.id !== record.adminId) {
    return NextResponse.redirect(`${appUrl}/admin/change-email?status=email-in-use`);
  }

  await prisma.user.update({
    where: { id: record.adminId },
    data: { email: record.newEmail },
  });
  await markAdminEmailChangeTokenUsed(record.id);

  return NextResponse.redirect(`${appUrl}/admin/change-email?status=verified`);
}
