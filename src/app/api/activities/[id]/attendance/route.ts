import { NextResponse } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { validateCsrfOrThrow } from "@/lib/security";
import { isActivityActiveNow } from "@/lib/activity-time";
import { revalidateActivityRoutes } from "@/lib/revalidate-routes";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRole("USER");
  if (response || !user) return response;

  const csrfError = await validateCsrfOrThrow();
  if (csrfError) return csrfError;

  const { id } = await params;
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      participants: {
        where: { userId: user.userId },
      },
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  if (!activity.participants.length) {
    return NextResponse.json({ error: "Join the activity before signing attendance." }, { status: 400 });
  }

  if (!isActivityActiveNow(activity.date, activity.timeLabel, activity.durationMinutes, new Date())) {
    return NextResponse.json(
      { error: "Attendance can only be signed during the event duration." },
      { status: 400 },
    );
  }

  await prisma.attendanceRecord.upsert({
    where: { activityId_userId: { activityId: id, userId: user.userId } },
    update: { status: AttendanceStatus.PRESENT, confirmedAt: new Date() },
    create: {
      activityId: id,
      userId: user.userId,
      status: AttendanceStatus.PRESENT,
    },
  });

  revalidateActivityRoutes();
  return NextResponse.json({ message: "Attendance signed successfully." });
}
