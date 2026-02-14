// ────────────────────────────────────────────────────────────
// Date parsing helpers for WhatsApp timestamps
// ────────────────────────────────────────────────────────────
import { format } from "date-fns";

/**
 * Patterns we try, in order.
 * Each regex must capture groups: month, day, year, hour, minute, (optional second), (optional ampm)
 * We use named groups for clarity.
 */
const TIMESTAMP_PATTERNS: {
    regex: RegExp;
    parse: (m: RegExpMatchArray) => Date | null;
}[] = [
        // Pattern A: "12/31/23, 9:41 PM" or "12/31/2023, 9:41 PM"  (US MM/DD/YY)
        {
            regex:
                /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, mo, d, y, h, mi, s, ampm] = m;
                return buildDate(
                    parseInt(mo),
                    parseInt(d),
                    normalizeYear(y),
                    to24(parseInt(h), ampm),
                    parseInt(mi),
                    s ? parseInt(s) : 0
                );
            },
        },
        // Pattern B: "31.12.23, 21:41" or "31.12.2023, 21:41" (EU DD.MM.YY)
        {
            regex:
                /^(\d{1,2})\.(\d{1,2})\.(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(
                    parseInt(mo),
                    parseInt(d),
                    normalizeYear(y),
                    to24(parseInt(h), ampm),
                    parseInt(mi),
                    s ? parseInt(s) : 0
                );
            },
        },
        // Pattern C: "31/12/2023, 21:41" (EU DD/MM/YYYY with slash)
        {
            regex:
                /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(
                    parseInt(mo),
                    parseInt(d),
                    normalizeYear(y),
                    to24(parseInt(h), ampm),
                    parseInt(mi),
                    s ? parseInt(s) : 0
                );
            },
        },
        // Pattern D: "[31/12/2023, 21:41:00]" (iOS bracket style)
        {
            regex:
                /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\]\s*/,
            parse: (m) => {
                const [, d, mo, y, h, mi, s, ampm] = m;
                return buildDate(
                    parseInt(mo),
                    parseInt(d),
                    normalizeYear(y),
                    to24(parseInt(h), ampm),
                    parseInt(mi),
                    s ? parseInt(s) : 0
                );
            },
        },
        // Pattern E: "2023-12-31, 21:41" (ISO-ish YYYY-MM-DD)
        {
            regex:
                /^(\d{4})-(\d{1,2})-(\d{1,2}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\s*-\s*/,
            parse: (m) => {
                const [, y, mo, d, h, mi, s, ampm] = m;
                return buildDate(
                    parseInt(mo),
                    parseInt(d),
                    parseInt(y),
                    to24(parseInt(h), ampm),
                    parseInt(mi),
                    s ? parseInt(s) : 0
                );
            },
        },
    ];

function normalizeYear(y: string): number {
    const n = parseInt(y);
    if (n < 100) return 2000 + n;
    return n;
}

function to24(h: number, ampm?: string): number {
    if (!ampm) return h;
    const upper = ampm.toUpperCase();
    if (upper === "PM" && h < 12) return h + 12;
    if (upper === "AM" && h === 12) return 0;
    return h;
}

function buildDate(
    month: number,
    day: number,
    year: number,
    hour: number,
    minute: number,
    second: number
): Date | null {
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day, hour, minute, second);
    if (isNaN(d.getTime())) return null;
    return d;
}

/**
 * Timestamp regex used to detect if a line starts a new message.
 * We use a combined pattern that matches the beginning of any known format.
 */
export const LINE_START_REGEX =
    /^(?:\[?\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{2,4}[,\s])/;

/**
 * Try to parse a timestamp from the start of a line.
 * Returns { date, rest } where rest is the part of the line after the timestamp separator.
 */
export function parseTimestamp(line: string): {
    date: Date | null;
    rest: string;
} {
    for (const { regex, parse } of TIMESTAMP_PATTERNS) {
        const m = line.match(regex);
        if (m) {
            const date = parse(m);
            const rest = line.slice(m[0].length);
            return { date, rest };
        }
    }
    return { date: null, rest: line };
}

/**
 * Format a Date to YYYY-MM-DD for grouping.
 */
export function toDateKey(d: Date): string {
    return format(d, "yyyy-MM-dd");
}

/**
 * Format a Date to a user-friendly time string.
 */
export function toTimeString(d: Date): string {
    return format(d, "h:mm a");
}

/**
 * Format a YYYY-MM-DD key to a user-friendly date label.
 */
export function toDateLabel(dateKey: string): string {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (sameDay(date, today)) return "Today";
    if (sameDay(date, yesterday)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
}

function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
