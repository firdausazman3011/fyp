export function getActivityStart(date: Date, timeLabel: string) {
  const [hours, minutes] = timeLabel.split(":").map((value) => Number(value));
  const start = new Date(date);
  start.setHours(hours || 0, minutes || 0, 0, 0);
  return start;
}

export function getActivityEnd(date: Date, timeLabel: string, durationMinutes: number) {
  const start = getActivityStart(date, timeLabel);
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

export function isActivityCompleted(date: Date, timeLabel: string, durationMinutes: number, now = new Date()) {
  return getActivityEnd(date, timeLabel, durationMinutes).getTime() < now.getTime();
}

export function isActivityActiveNow(date: Date, timeLabel: string, durationMinutes: number, now = new Date()) {
  const start = getActivityStart(date, timeLabel);
  const end = getActivityEnd(date, timeLabel, durationMinutes);
  return now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
}

export function rangesOverlap(
  firstStart: Date,
  firstDurationMinutes: number,
  secondStart: Date,
  secondDurationMinutes: number,
) {
  const firstEnd = new Date(firstStart.getTime() + firstDurationMinutes * 60 * 1000);
  const secondEnd = new Date(secondStart.getTime() + secondDurationMinutes * 60 * 1000);
  return firstStart.getTime() < secondEnd.getTime() && secondStart.getTime() < firstEnd.getTime();
}
