import { addDays } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { isCompletedTask } from "@/Components/Calendar/CalendarItemMeta";
import {
    GRID_BODY_HEIGHT,
    GRID_END_HOUR,
    GRID_START_HOUR,
    HOUR_HEIGHT,
    layoutColumns,
    minutesToOffset,
    offsetToMinutes,
    SCROLL_HOUR,
    toDateString,
    toLocalDateTimeString,
} from "./calendarDates";

const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => GRID_START_HOUR + i);
const MIN_BLOCK_HEIGHT = 22;

const formatHour = (hour) => {
    const h = hour % 24;
    const period = h < 12 ? "AM" : "PM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display} ${period}`;
};

// The local Y-m-d an all-day item starts on / its exclusive end.
const allDayStartKey = (item) => String(item.occurrenceKey || item.start).slice(0, 10);
const allDayEndKey = (item, startKey) => {
    if (item.end) return String(item.end).slice(0, 10);
    const start = new Date(`${startKey}T00:00:00`);
    start.setDate(start.getDate() + 1);
    return toDateString(start);
};

export default function TimeGrid({
    view,
    range,
    events = [],
    renderEvent,
    onSelectSlot,
    onSelectEvent,
    onNavLinkDay,
}) {
    const scrollRef = useRef(null);
    const dragCtx = useRef(null);
    const [drag, setDrag] = useState(null);
    const [now, setNow] = useState(() => new Date());

    // Initial scroll to the morning; refresh the "now" line every minute.
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = minutesToOffset(SCROLL_HOUR * 60);
        }
    }, []);
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const todayKey = toDateString(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowVisible = nowMinutes >= GRID_START_HOUR * 60 && nowMinutes <= GRID_END_HOUR * 60;

    // Split all-day items per day-column from the timed grid items.
    const allDayByDay = useMemo(() => {
        const map = new Map();
        range.days.forEach((day) => map.set(toDateString(day), []));
        events
            .filter((item) => item.allDay)
            .forEach((item) => {
                const startKey = allDayStartKey(item);
                const endKey = allDayEndKey(item, startKey);
                range.days.forEach((day) => {
                    const key = toDateString(day);
                    if (key >= startKey && key < endKey) map.get(key).push(item);
                });
            });
        return map;
    }, [events, range]);

    const timedEvents = useMemo(() => events.filter((item) => !item.allDay), [events]);

    // Compute positioned, column-tiled blocks for one day column.
    const blocksForDay = (day) => {
        const dayStart = day.getTime();
        const dayEnd = addDays(day, 1).getTime();
        const positioned = [];
        timedEvents.forEach((item) => {
            const start = new Date(item.start).getTime();
            const end = new Date(item.end || start + 3600000).getTime();
            if (end <= dayStart || start >= dayEnd) return;
            const startMin = Math.max(0, (Math.max(start, dayStart) - dayStart) / 60000);
            const endMin = Math.min(24 * 60, (Math.min(end, dayEnd) - dayStart) / 60000);
            positioned.push({ item, start: startMin, end: endMin });
        });
        const placements = layoutColumns(positioned);
        return positioned.map((entry) => {
            const { col, cols } = placements.get(entry) || { col: 0, cols: 1 };
            const top = minutesToOffset(entry.start);
            const bottom = minutesToOffset(entry.end);
            const height = Math.max(MIN_BLOCK_HEIGHT, bottom - top);
            return { ...entry, top, height, col, cols };
        });
    };

    const snap = (min) => Math.round(min / 30) * 30;

    const onColPointerDown = (e, day) => {
        if (e.button !== 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const min = snap(offsetToMinutes(e.clientY - rect.top));
        e.currentTarget.setPointerCapture(e.pointerId);
        dragCtx.current = { day, rectTop: rect.top, key: toDateString(day) };
        setDrag({ key: toDateString(day), startMin: min, endMin: min + 30 });
    };

    const onColPointerMove = (e) => {
        if (!dragCtx.current) return;
        const min = snap(offsetToMinutes(e.clientY - dragCtx.current.rectTop));
        setDrag((prev) => (prev ? { ...prev, endMin: min } : prev));
    };

    const onColPointerUp = () => {
        if (!dragCtx.current || !drag) {
            dragCtx.current = null;
            setDrag(null);
            return;
        }
        const { day } = dragCtx.current;
        let from = Math.min(drag.startMin, drag.endMin);
        let to = Math.max(drag.startMin, drag.endMin);
        if (to - from < 30) to = from + 60; // treat a click as a 1-hour slot
        const start = new Date(day);
        start.setHours(0, from, 0, 0);
        const end = new Date(day);
        end.setHours(0, to, 0, 0);
        onSelectSlot?.({
            start: toLocalDateTimeString(start),
            end: toLocalDateTimeString(end),
            allDay: false,
        });
        dragCtx.current = null;
        setDrag(null);
    };

    const onAllDayClick = (day) => {
        onSelectSlot?.({
            start: toDateString(day),
            end: toDateString(addDays(day, 1)),
            allDay: true,
        });
    };

    return (
        <div className={`wv-cal-time wv-cal-time--${view}`}>
            <div className="wv-cal-time-head">
                <div className="wv-cal-time-gutter wv-cal-time-corner" />
                {range.days.map((day) => {
                    const key = toDateString(day);
                    const isToday = key === todayKey;
                    return (
                        <div
                            key={key}
                            className={`wv-cal-colhead${isToday ? " wv-cal-colhead--today" : ""}`}
                        >
                            <span className="wv-cal-colhead-day">
                                {day.toLocaleDateString(undefined, { weekday: "short" })}
                            </span>
                            <button
                                type="button"
                                className={`wv-cal-colhead-num${
                                    isToday ? " wv-cal-colhead-num--today" : ""
                                }`}
                                onClick={() => onNavLinkDay?.(key)}
                            >
                                {day.getDate()}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="wv-cal-allday">
                <div className="wv-cal-time-gutter wv-cal-allday-label">All day</div>
                {range.days.map((day) => {
                    const key = toDateString(day);
                    const items = allDayByDay.get(key) || [];
                    return (
                        <div
                            key={key}
                            className="wv-cal-allday-cell"
                            onClick={() => onAllDayClick(day)}
                        >
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    data-source={item.sourceType}
                                    data-completed={isCompletedTask(item) ? "true" : undefined}
                                    className="wv-cal-chip wv-cal-chip--pill"
                                    style={{ backgroundColor: item.color }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectEvent?.(item);
                                    }}
                                >
                                    {renderEvent(item)}
                                </button>
                            ))}
                        </div>
                    );
                })}
            </div>

            <div className="wv-cal-time-body" ref={scrollRef}>
                <div className="wv-cal-time-scroll" style={{ height: GRID_BODY_HEIGHT }}>
                    <div className="wv-cal-time-axis">
                        {HOURS.map((hour) => (
                            <div key={hour} className="wv-cal-hour-cell" style={{ height: HOUR_HEIGHT }}>
                                <span className="wv-cal-hour-label">{formatHour(hour)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="wv-cal-time-cols">
                        {range.days.map((day) => {
                            const key = toDateString(day);
                            const isToday = key === todayKey;
                            const blocks = blocksForDay(day);
                            return (
                                <div
                                    key={key}
                                    className="wv-cal-time-col"
                                    onPointerDown={(e) => onColPointerDown(e, day)}
                                    onPointerMove={onColPointerMove}
                                    onPointerUp={onColPointerUp}
                                >
                                    {HOURS.map((hour) => (
                                        <div
                                            key={hour}
                                            className="wv-cal-hour-cell"
                                            style={{ height: HOUR_HEIGHT }}
                                        />
                                    ))}

                                    {drag && drag.key === key && (
                                        <div
                                            className="wv-cal-slot-mirror"
                                            style={{
                                                top: minutesToOffset(
                                                    Math.min(drag.startMin, drag.endMin)
                                                ),
                                                height: Math.max(
                                                    HOUR_HEIGHT / 2,
                                                    minutesToOffset(Math.max(drag.startMin, drag.endMin)) -
                                                        minutesToOffset(Math.min(drag.startMin, drag.endMin))
                                                ),
                                            }}
                                        />
                                    )}

                                    {blocks.map(({ item, top, height, col, cols }) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            data-source={item.sourceType}
                                            data-completed={isCompletedTask(item) ? "true" : undefined}
                                            className="wv-cal-block"
                                            style={{
                                                top,
                                                height,
                                                left: `calc(${(col / cols) * 100}% + 1px)`,
                                                width: `calc(${100 / cols}% - 2px)`,
                                                backgroundColor: item.color,
                                            }}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectEvent?.(item);
                                            }}
                                        >
                                            {renderEvent(item)}
                                        </button>
                                    ))}

                                    {isToday && nowVisible && (
                                        <div
                                            className="wv-cal-now"
                                            style={{ top: minutesToOffset(nowMinutes) }}
                                            aria-hidden="true"
                                        >
                                            <span className="wv-cal-now-dot" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
