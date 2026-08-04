import { addDays, addMonths, startOfDay, startOfMonth, startOfWeek } from "date-fns";

// The custom calendar engine positions everything by browser-local time, exactly
// as FullCalendar did with its default `timeZone: 'local'`. Week starts SUNDAY to
// match the backend's `startOfWeek(SUNDAY)` range calculation.

// Time-grid geometry shared by Week/Day views.
export const GRID_START_HOUR = 5; // first visible hour row (05:00)
export const GRID_END_HOUR = 24; // last boundary (24:00)
export const SCROLL_HOUR = 7; // initial scroll position (07:00)
export const HOUR_HEIGHT = 48; // px per hour row
export const GRID_HOURS = GRID_END_HOUR - GRID_START_HOUR;
export const GRID_BODY_HEIGHT = GRID_HOURS * HOUR_HEIGHT;

const p2 = (n) => String(n).padStart(2, "0");

// Local Y-m-d for a Date, independent of timezone offset artifacts.
export const toDateString = (date) =>
    `${date.getFullYear()}-${p2(date.getMonth() + 1)}-${p2(date.getDate())}`;

// Local Y-m-dTHH:mm:ss for a Date (what EventModal expects for prefilled slots).
export const toLocalDateTimeString = (date) =>
    `${toDateString(date)}T${p2(date.getHours())}:${p2(date.getMinutes())}:00`;

// Parse an anchor value (Date or Y-m-d / ISO string) into a local Date. A bare
// Y-m-d is anchored to local midnight so it never slips a day in negative offsets.
export const parseAnchor = (value) => {
    if (value instanceof Date) return value;
    const str = String(value);
    return new Date(str.length <= 10 ? `${str}T00:00:00` : str);
};

// 6-row (42-day) Sunday-started grid covering the month of `date`.
export const monthGridRange = (date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const end = addDays(start, 42); // exclusive
    return { start, end, days };
};

// Sunday–Saturday week containing `date`.
export const weekRange = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const end = addDays(start, 7); // exclusive
    return { start, end, days };
};

// Single day containing `date`.
export const dayRange = (date) => {
    const start = startOfDay(date);
    const end = addDays(start, 1); // exclusive
    return { start, end, days: [start] };
};

// Prev/next navigation for the active view.
export const addPeriod = (view, date, dir) => {
    if (view === "month") return addMonths(date, dir);
    if (view === "week") return addDays(date, dir * 7);
    return addDays(date, dir);
};

// Minutes past midnight for a Date, in local time.
export const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

// Vertical offset (px) within the time-grid body for a given minutes-past-midnight.
export const minutesToOffset = (minutes) =>
    ((minutes - GRID_START_HOUR * 60) / 60) * HOUR_HEIGHT;

// Convert a vertical offset (px) back to minutes past midnight, clamped to the grid.
export const offsetToMinutes = (offset) => {
    const raw = (offset / HOUR_HEIGHT) * 60 + GRID_START_HOUR * 60;
    return Math.max(GRID_START_HOUR * 60, Math.min(GRID_END_HOUR * 60, raw));
};

// Greedy overlap tiling: assign each event a column index and the total number of
// columns in its overlap cluster, so the caller can render side-by-side blocks.
// `events` must each carry numeric `start`/`end` (any consistent unit). Returns a
// Map keyed by the event object → { col, cols }.
export const layoutColumns = (events) => {
    const placements = new Map();
    const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);

    let cluster = [];
    let clusterEnd = -Infinity;

    const flush = () => {
        const columnEnds = []; // last end time occupying each column
        const placed = [];
        cluster.forEach((ev) => {
            let col = columnEnds.findIndex((end) => ev.start >= end);
            if (col === -1) {
                col = columnEnds.length;
                columnEnds.push(ev.end);
            } else {
                columnEnds[col] = ev.end;
            }
            placed.push([ev, col]);
        });
        const cols = columnEnds.length;
        placed.forEach(([ev, col]) => placements.set(ev, { col, cols }));
        cluster = [];
    };

    sorted.forEach((ev) => {
        if (cluster.length && ev.start >= clusterEnd) {
            flush();
            clusterEnd = -Infinity;
        }
        cluster.push(ev);
        clusterEnd = Math.max(clusterEnd, ev.end);
    });
    if (cluster.length) flush();

    return placements;
};
