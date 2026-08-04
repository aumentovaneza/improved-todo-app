import { useEffect, useMemo, useRef } from "react";
import { dayRange, monthGridRange, parseAnchor, weekRange } from "./calendarDates";
import MonthGrid from "./MonthGrid";
import TimeGrid from "./TimeGrid";

/**
 * Controlled Google-style calendar shell. Index.jsx drives it with plain props
 * (view + date) instead of an imperative ref; it computes the visible range for
 * the active view and fires `onRangeChange` whenever that range changes — the
 * replacement for FullCalendar's `datesSet`.
 */
export default function WevieCalendar({
    view = "month",
    date,
    events = [],
    renderEvent,
    onRangeChange,
    onSelectEvent,
    onSelectDay,
    onSelectSlot,
    onMore,
    onNavLinkDay,
}) {
    const anchor = useMemo(() => parseAnchor(date), [date]);

    const range = useMemo(() => {
        if (view === "week") return weekRange(anchor);
        if (view === "day") return dayRange(anchor);
        return monthGridRange(anchor);
    }, [view, anchor]);

    // Fire only when the resolved range actually changes, so navigating within
    // the same range (or an unrelated re-render) never triggers a refetch. The
    // parent keeps its own `loadedRangeRef` guard as a second line of defence.
    const lastKey = useRef(null);
    useEffect(() => {
        const key = `${view}|${range.start.getTime()}|${range.end.getTime()}`;
        if (lastKey.current === key) return;
        lastKey.current = key;
        onRangeChange?.({ start: range.start, end: range.end, view });
    });

    if (view === "week" || view === "day") {
        return (
            <TimeGrid
                view={view}
                range={range}
                events={events}
                renderEvent={renderEvent}
                onSelectSlot={onSelectSlot}
                onSelectEvent={onSelectEvent}
                onNavLinkDay={onNavLinkDay}
            />
        );
    }

    return (
        <MonthGrid
            anchor={anchor}
            range={range}
            events={events}
            renderEvent={renderEvent}
            onSelectDay={onSelectDay}
            onSelectEvent={onSelectEvent}
            onMore={onMore}
            onNavLinkDay={onNavLinkDay}
        />
    );
}
