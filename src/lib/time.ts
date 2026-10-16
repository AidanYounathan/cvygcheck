// Calendar math in the organization's local time zone.
//
// Check-ins happen at evening events in California. Using UTC for "today"
// splits one local evening across two UTC days (midnight UTC is 5pm PDT /
// 4pm PST), which breaks the one-check-in-per-device-per-day limit and the
// admin dashboard's daily and hourly views. Everything that needs a calendar
// day or an hour of the day goes through these helpers instead.

export const APP_TIME_ZONE = "America/Los_Angeles";

type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

// Milliseconds the zone is ahead of UTC at the given instant (negative for US zones).
function zoneOffsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const truncated = Math.floor(date.getTime() / 1000) * 1000;
  return asUtc - truncated;
}

// The UTC instant of local midnight on the given local calendar date.
function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const firstOffset = zoneOffsetMs(new Date(guess), timeZone);
  let instant = guess - firstOffset;
  // Re-check once in case the offset differs at the corrected instant (DST).
  const secondOffset = zoneOffsetMs(new Date(instant), timeZone);
  if (secondOffset !== firstOffset) instant = guess - secondOffset;
  return new Date(instant);
}

/** Local calendar date as "YYYY-MM-DD". */
export function localDateKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Local hour of the day, 0-23. */
export function localHour(date: Date, timeZone: string = APP_TIME_ZONE): number {
  return zonedParts(date, timeZone).hour;
}

/** UTC instant of local midnight for the local day containing `date`. */
export function startOfLocalDay(date: Date, timeZone: string = APP_TIME_ZONE): Date {
  const p = zonedParts(date, timeZone);
  return zonedMidnight(p.year, p.month, p.day, timeZone);
}

/**
 * Half-open UTC range [start, end) covering a local calendar date given as
 * "YYYY-MM-DD". `end` is the next local midnight, so DST days are 23 or 25 hours.
 */
export function localDayRange(
  dateKey: string,
  timeZone: string = APP_TIME_ZONE,
): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error("INVALID_DATE");
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const start = zonedMidnight(year, month, day, timeZone);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const end = zonedMidnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone);
  return { start, end };
}
