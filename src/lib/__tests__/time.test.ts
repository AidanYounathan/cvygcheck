import { describe, it, expect } from "vitest";
import { localDateKey, localHour, startOfLocalDay, localDayRange } from "@/lib/time";

describe("startOfLocalDay", () => {
  it("puts 4:30pm and 5:30pm PDT on the same day (the old UTC boundary split them)", () => {
    const before = new Date("2026-07-15T23:30:00Z"); // 4:30pm PDT, Jul 15
    const after = new Date("2026-07-16T00:30:00Z"); // 5:30pm PDT, Jul 15
    expect(startOfLocalDay(before).toISOString()).toBe("2026-07-15T07:00:00.000Z");
    expect(startOfLocalDay(after).toISOString()).toBe("2026-07-15T07:00:00.000Z");
  });

  it("uses the PST offset in winter", () => {
    const justAfterMidnight = new Date("2026-01-15T08:30:00Z"); // 12:30am PST, Jan 15
    expect(startOfLocalDay(justAfterMidnight).toISOString()).toBe("2026-01-15T08:00:00.000Z");
  });

  it("rolls to the next day only at local midnight", () => {
    const lateNight = new Date("2026-07-16T06:59:00Z"); // 11:59pm PDT, Jul 15
    const nextDay = new Date("2026-07-16T07:01:00Z"); // 12:01am PDT, Jul 16
    expect(startOfLocalDay(lateNight).toISOString()).toBe("2026-07-15T07:00:00.000Z");
    expect(startOfLocalDay(nextDay).toISOString()).toBe("2026-07-16T07:00:00.000Z");
  });
});

describe("localDateKey", () => {
  it("labels an evening check-in with its local date, not the UTC date", () => {
    expect(localDateKey(new Date("2026-07-16T02:00:00Z"))).toBe("2026-07-15");
  });
});

describe("localHour", () => {
  it("returns the Pacific hour", () => {
    expect(localHour(new Date("2026-07-16T02:00:00Z"))).toBe(19); // 7pm PDT
    expect(localHour(new Date("2026-01-16T03:00:00Z"))).toBe(19); // 7pm PST
  });
});

describe("localDayRange", () => {
  it("covers a full local day", () => {
    const { start, end } = localDayRange("2026-07-15");
    expect(start.toISOString()).toBe("2026-07-15T07:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-16T07:00:00.000Z");
  });

  it("is 23 hours on the spring-forward day", () => {
    const { start, end } = localDayRange("2026-03-08");
    expect(start.toISOString()).toBe("2026-03-08T08:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-09T07:00:00.000Z");
  });

  it("is 25 hours on the fall-back day", () => {
    const { start, end } = localDayRange("2026-11-01");
    expect(start.toISOString()).toBe("2026-11-01T07:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-02T08:00:00.000Z");
  });

  it("handles month and year rollover", () => {
    expect(localDayRange("2026-12-31").end.toISOString()).toBe("2027-01-01T08:00:00.000Z");
  });

  it("rejects malformed dates", () => {
    expect(() => localDayRange("7/15/2026")).toThrow("INVALID_DATE");
  });
});
