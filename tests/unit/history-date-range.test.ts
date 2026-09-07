import { describe, expect, it } from "vitest";

import {
  getLocalDayUtcRange,
  getLocalMonthUtcRange,
} from "@/lib/local-date-range";

describe("history date ranges", () => {
  it("uses local midnight for both calendar month boundaries", () => {
    const range = getLocalMonthUtcRange(2026, 8);
    const start = new Date(range.from);
    const end = new Date(range.to);

    expect([
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ]).toEqual([2026, 7, 1, 0, 0]);
    expect([
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ]).toEqual([2026, 8, 1, 0, 0]);
  });

  it("uses consecutive local midnights for a calendar day", () => {
    const range = getLocalDayUtcRange("2026-08-02");
    const start = new Date(range.from);
    const end = new Date(range.to);

    expect([
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
    ]).toEqual([2026, 7, 2, 0]);
    expect([
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      end.getHours(),
    ]).toEqual([2026, 7, 3, 0]);
  });

  it("rejects invalid calendar dates", () => {
    expect(() => getLocalDayUtcRange("2026-02-31")).toThrow(RangeError);
  });
});
