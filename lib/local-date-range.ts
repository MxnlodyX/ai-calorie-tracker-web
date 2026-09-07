export type UtcDateRange = {
  from: string;
  to: string;
};

export function getLocalMonthUtcRange(
  year: number,
  month: number,
): UtcDateRange {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function getLocalDayUtcRange(date: string): UtcDateRange {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new RangeError("date must be YYYY-MM-DD");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const start = new Date(year, monthIndex, day);
  if (
    start.getFullYear() !== year ||
    start.getMonth() !== monthIndex ||
    start.getDate() !== day
  ) {
    throw new RangeError("date must be a valid calendar date");
  }
  const end = new Date(year, monthIndex, day + 1);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}
