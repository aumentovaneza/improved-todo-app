import { useMemo } from "react";
import { toDateString } from "./calendarDates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 3;

// The local Y-m-d an all-day item starts on.
const allDayStartKey = (item) => String(item.occurrenceKey || item.start).slice(0, 10);

// Exclusive end Y-m-d for an all-day item (backend already sends +1 day).
const allDayEndKey = (item) => {
    if (item.end) return String(item.end).slice(0, 10);
    // No end → single day: exclusive end is the day after start.
    const start = new Date(`${allDayStartKey(item)}T00:00:00`);
    start.setDate(start.getDate() + 1);
    return toDateString(start);
};

export default function MonthGrid({
    anchor,
    range,
    events = [],
    renderEvent,
    onSelectDay,
    onSelectEvent,
    onMore,
    onNavLinkDay,
}) {
    const anchorMonth = anchor.getMonth();
    const todayKey = toDateString(new Date());

    // Bucket every item onto each local day it covers. All-day/multi-day items
    // land on every day in [start, end); timed items land on their start day.
    const byDay = useMemo(() => {
        const map = new Map();
        const push = (key, item) => {
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        };
        events.forEach((item) => {
            if (item.allDay) {
                const endKey = allDayEndKey(item);
                let cursor = new Date(`${allDayStartKey(item)}T00:00:00`);
                // Cap the walk so a malformed range can't spin forever.
                for (let i = 0; i < 366; i += 1) {
                    const key = toDateString(cursor);
                    if (key >= endKey) break;
                    push(key, item);
                    cursor.setDate(cursor.getDate() + 1);
                }
            } else {
                push(toDateString(new Date(item.start)), item);
            }
        });
        // All-day/multi-day pills first, then timed items by start time.
        map.forEach((items) =>
            items.sort((a, b) => {
                if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
                return new Date(a.start) - new Date(b.start);
            })
        );
        return map;
    }, [events]);

    return (
        <div className="wv-cal-month">
            <div className="wv-cal-weekdays" role="row">
                {WEEKDAYS.map((label) => (
                    <div key={label} className="wv-cal-weekday" role="columnheader">
                        {label}
                    </div>
                ))}
            </div>
            <div className="wv-cal-grid">
                {range.days.map((day) => {
                    const key = toDateString(day);
                    const items = byDay.get(key) || [];
                    const isOtherMonth = day.getMonth() !== anchorMonth;
                    const isToday = key === todayKey;
                    const isPast = key < todayKey;
                    const visible = items.slice(0, MAX_CHIPS);
                    const overflow = items.length - visible.length;
                    const dayLabel =
                        day.getDate() === 1
                            ? `${day.toLocaleDateString(undefined, { month: "short" })} 1`
                            : String(day.getDate());

                    return (
                        <div
                            key={key}
                            className={`wv-cal-day${isOtherMonth ? " wv-cal-day--other" : ""}${
                                isToday ? " wv-cal-day--today" : ""
                            }`}
                            onClick={() => onSelectDay?.(key)}
                        >
                            <div className="wv-cal-day-top">
                                <button
                                    type="button"
                                    className={`wv-cal-daynum${isToday ? " wv-cal-daynum--today" : ""}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavLinkDay?.(key);
                                    }}
                                >
                                    {dayLabel}
                                </button>
                            </div>
                            <div className="wv-cal-day-events">
                                {visible.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        data-source={item.sourceType}
                                        className={`wv-cal-chip${
                                            item.allDay
                                                ? " wv-cal-chip--pill"
                                                : " wv-cal-chip--timed"
                                        }${isPast ? " wv-cal-chip--past" : ""}`}
                                        style={item.allDay ? { backgroundColor: item.color } : undefined}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectEvent?.(item);
                                        }}
                                    >
                                        {renderEvent(item)}
                                    </button>
                                ))}
                                {overflow > 0 && (
                                    <button
                                        type="button"
                                        className="wv-cal-more"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onMore?.(key);
                                        }}
                                    >
                                        +{overflow} more
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
