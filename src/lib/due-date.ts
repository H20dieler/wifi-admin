const BUSINESS_TIMEZONE = "Asia/Manila";

export type BusinessDate = { year: number; month: number; day: number };

/**
 * Vercel's functions run in UTC by default, which is 8 hours behind Manila.
 * Naively using `new Date()` for "today" would occasionally compute the
 * wrong due date near midnight Manila time. This reads the actual
 * Manila calendar date regardless of the server's own system timezone.
 */
export function getBusinessToday(): BusinessDate {
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

function toDate(businessDate: BusinessDate): Date {
  return new Date(businessDate.year, businessDate.month, businessDate.day);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * billing_day is 1-31, but not every month has 31 days. A customer billed
 * on the 31st is due on the last day of a 30-day month, not rolled into
 * the next month (which is what naively passing 31 into `new Date()`
 * would do).
 */
export function getNextDueDate(
  billingDay: number,
  today: BusinessDate = getBusinessToday(),
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

/**
 * The mirror image of getNextDueDate: the most recent occurrence of
 * billing_day that has already happened (today counts). Needed for "how
 * many days overdue" -- getNextDueDate can never answer that since it
 * always rolls forward once a due date has passed.
 */
export function getMostRecentDueDate(
  billingDay: number,
  today: BusinessDate = getBusinessToday(),
): Date {
  const { year, month, day } = today;

  const clampedThisMonth = Math.min(billingDay, lastDayOfMonth(year, month));
  const thisMonthDue = new Date(year, month, clampedThisMonth);
  const todayAsDate = new Date(year, month, day);

  if (thisMonthDue <= todayAsDate) {
    return thisMonthDue;
  }

  const prevMonth = month - 1;
  const prevMonthYear = year + Math.floor(prevMonth / 12);
  const normalizedPrevMonth = ((prevMonth % 12) + 12) % 12;
  const clampedPrevMonth = Math.min(
    billingDay,
    lastDayOfMonth(prevMonthYear, normalizedPrevMonth),
  );

  return new Date(prevMonthYear, normalizedPrevMonth, clampedPrevMonth);
}

export type ReminderCase =
  | { type: "upcoming"; daysUntilDue: number; dueDate: Date }
  | { type: "due_today"; dueDate: Date }
  | { type: "overdue"; daysOverdue: 1 | 7 | 14; dueDate: Date };

const OVERDUE_MILESTONES = [1, 7, 14] as const;

/**
 * Classifies a customer into exactly one reminder case (or none), given
 * their billing day and the business's configured reminder_days_before.
 * The three cases are mutually exclusive by construction -- due_today is
 * checked first, so it can never also match as day-0-overdue.
 */
export function classifyReminder(
  billingDay: number,
  reminderDaysBefore: number,
  today: BusinessDate = getBusinessToday(),
): ReminderCase | null {
  const todayAsDate = toDate(today);
  const next = getNextDueDate(billingDay, today);
  const daysUntilNext = daysBetween(todayAsDate, next);

  if (daysUntilNext === 0) {
    return { type: "due_today", dueDate: next };
  }
  if (daysUntilNext === reminderDaysBefore) {
    return { type: "upcoming", daysUntilDue: reminderDaysBefore, dueDate: next };
  }

  const mostRecent = getMostRecentDueDate(billingDay, today);
  const daysSince = daysBetween(mostRecent, todayAsDate);
  if ((OVERDUE_MILESTONES as readonly number[]).includes(daysSince)) {
    return {
      type: "overdue",
      daysOverdue: daysSince as 1 | 7 | 14,
      dueDate: mostRecent,
    };
  }

  return null;
}

/** Whole days between "today" and a customer's most recent due date. */
export function getDaysSinceDue(
  billingDay: number,
  today: BusinessDate = getBusinessToday(),
): number {
  const mostRecent = getMostRecentDueDate(billingDay, today);
  return daysBetween(mostRecent, toDate(today));
}

export function formatDueDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: BUSINESS_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** YYYY-MM-DD for comparing against a Postgres `date` column. */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
