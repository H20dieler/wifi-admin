const BUSINESS_TIMEZONE = "Asia/Manila";

/**
 * Vercel's functions run in UTC by default, which is 8 hours behind Manila.
 * Naively using `new Date()` for "today" would occasionally compute the
 * wrong due date near midnight Manila time. This reads the actual
 * Manila calendar date regardless of the server's own system timezone.
 */
function getBusinessToday(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return { year, month, day };
}

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of "next month" is the last day of "month" (0-indexed).
  return new Date(year, month + 1, 0).getDate();
}

/**
 * billing_day is 1-31, but not every month has 31 days. A customer billed
 * on the 31st is due on the last day of a 30-day month, not rolled into
 * the next month (which is what naively passing 31 into `new Date()`
 * would do).
 */
export function getNextDueDate(
  billingDay: number,
  today: { year: number; month: number; day: number } = getBusinessToday(),
): Date {
  const { year, month, day } = today;

  const clampedThisMonth = Math.min(billingDay, lastDayOfMonth(year, month));
  const thisMonthDue = new Date(year, month, clampedThisMonth);
  const todayAsDate = new Date(year, month, day);

  if (thisMonthDue >= todayAsDate) {
    return thisMonthDue;
  }

  const nextMonth = month + 1;
  const nextMonthYear = year + Math.floor(nextMonth / 12);
  const normalizedNextMonth = nextMonth % 12;
  const clampedNextMonth = Math.min(
    billingDay,
    lastDayOfMonth(nextMonthYear, normalizedNextMonth),
  );

  return new Date(nextMonthYear, normalizedNextMonth, clampedNextMonth);
}

export function formatDueDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: BUSINESS_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
