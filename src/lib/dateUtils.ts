export type DateRangeKey = "this-month" | "last-month" | "last-3-months" | "all-time";

export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
  };
}

export function getLast3MonthsRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export function getDateRange(key: DateRangeKey): { start: Date | null; end: Date | null } {
  switch (key) {
    case "this-month":
      return getThisMonthRange();
    case "last-month":
      return getLastMonthRange();
    case "last-3-months":
      return getLast3MonthsRange();
    case "all-time":
      return { start: null, end: null };
  }
}

/**
 * Groups expenses by calendar month and returns an array sorted
 * chronologically — used for the monthly spending trend chart.
 */
export function groupExpensesByMonth(
  expenses: Array<{ createdAt: string; amount: number }>
): Array<{ month: string; amount: number }> {
  const grouped: Record<string, { amount: number; year: number; monthIndex: number }> = {};

  for (const expense of expenses) {
    const date = new Date(expense.createdAt);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const label = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

    if (!grouped[label]) {
      grouped[label] = { amount: 0, year, monthIndex };
    }
    grouped[label].amount += expense.amount;
  }

  return Object.entries(grouped)
    .sort(([, a], [, b]) =>
      a.year !== b.year ? a.year - b.year : a.monthIndex - b.monthIndex
    )
    .map(([label, { amount }]) => ({ month: label, amount }));
}

/**
 * Returns the percentage change from previous to current, or null
 * if there is no previous month data to compare against.
 */
export function calcMonthlyChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
