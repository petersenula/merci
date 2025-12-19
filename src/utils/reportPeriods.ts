// src/utils/reportPeriods.ts

// ----------------------------
//  MONTHS (12 months back)
// ----------------------------
export function getLast12Months() {
  const result = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));

    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();

    result.push({
      label: `${month} / ${year}`,
      value: `${year}-${month}`,
    });
  }

  return result;
}

// ----------------------------
//  WEEKS with DATE RANGE
//  Example: "Week 4 / 2025 (01.12–07.12)"
// ----------------------------
export function getLast52Weeks() {
  const result = [];
  const now = new Date();

  for (let i = 0; i < 52; i++) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i * 7);

    const year = d.getUTCFullYear();
    const week = getISOWeek(d);

    const start = getISOWeekStart(d);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    result.push({
      label: `Week ${week} / ${year} (${startStr}–${endStr})`,
      value: `${year}-W${String(week).padStart(2, "0")}`,
    });
  }

  return result;
}

// ----------------------------
// Format date: DD.MM
// ----------------------------
function formatDate(d: Date) {
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month}`;
}

// ----------------------------
// ISO Week number (1–53)
// ----------------------------
function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ----------------------------
// ISO Week start (Monday)
// ----------------------------
function getISOWeekStart(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}
