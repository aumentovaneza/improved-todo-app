import { metaForSource } from "@/Components/Calendar/CalendarItemMeta";
import CalendarSources from "@/Components/Calendar/CalendarSources";
import DayDetailModal from "@/Components/Calendar/DayDetailModal";
import EventModal from "@/Components/Calendar/EventModal";
import {
    addPeriod,
    dayRange,
    monthGridRange,
    parseAnchor,
    toDateString,
    weekRange,
} from "@/Components/Calendar/Grid/calendarDates";
import WevieCalendar from "@/Components/Calendar/Grid/WevieCalendar";
import OnboardingTour from "@/Components/OnboardingTour";
import TaskModal from "@/Components/TaskModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TodoLayout from "@/Layouts/TodoLayout";
import { calendarSteps } from "@/tours";
import { formatCompactCurrency } from "@/Utils/currency";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Head, router, usePage } from "@inertiajs/react";
import { CalendarPlus, ChevronLeft, ChevronRight, Ellipsis, ListPlus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Temporal } from "temporal-polyfill";

const VIEW_KEY = "calendar.view.v2";
const SOURCE_KEY = "calendar.sources.v2";
const CALENDAR_KEY = "calendar.native-sources.v2";

// The backend still validates FullCalendar's view names, so translate our short
// names on the way out (query param) and map any stored/legacy FC name back in.
const VIEW_TO_FC = { month: "dayGridMonth", week: "timeGridWeek", day: "timeGridDay" };
const FC_TO_VIEW = {
    dayGridMonth: "month",
    timeGridWeek: "week",
    timeGridDay: "day",
    listMonth: "month", // agenda is retired
};

const formatClock = (value) =>
    new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });

// The local calendar date an item belongs to: all-day/finance items carry a
// Y-m-d occurrenceKey; timed items derive it from their start.
const itemDateKey = (item) => {
    if (item.allDay) {
        const key = item.occurrenceKey || item.start;
        return String(key).slice(0, 10);
    }
    return toDateString(new Date(item.start));
};

const readJson = (key, fallback) => {
    if (typeof window === "undefined") return fallback;
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
};

export default function Index({
    calendarItems = [],
    eventCalendars = [],
    sourceFilters = ["events", "tasks", "meals"],
    selectedCalendarIds = [],
    currentDate,
    visibleStart,
    visibleEnd,
    monthTitle,
    categories = [],
    lists = [],
    userTimezone = "UTC",
}) {
    const userId = usePage().props.auth?.user?.id || "guest";
    const calendarStorageKey = `${CALENDAR_KEY}.${userId}`;
    const loadedRangeRef = useRef(`${visibleStart}|${visibleEnd}`);
    const [view, setView] = useState(() => {
        if (typeof window === "undefined") return "month";
        // Map any stored FC/legacy name (incl. retired listMonth) to a short name
        // so nobody is stranded on a view the toggle no longer offers.
        const stored = localStorage.getItem(VIEW_KEY);
        if (!stored) return "month";
        return FC_TO_VIEW[stored] || (["month", "week", "day"].includes(stored) ? stored : "month");
    });
    const [date, setDate] = useState(() => parseAnchor(currentDate));
    const [sources, setSources] = useState(() => readJson(SOURCE_KEY, sourceFilters));
    const [calendarIds, setCalendarIds] = useState(() => {
        const hasStoredChoice =
            typeof window !== "undefined" && localStorage.getItem(calendarStorageKey) !== null;
        const stored = hasStoredChoice ? readJson(calendarStorageKey, []) : selectedCalendarIds;
        const available = eventCalendars.map((calendar) => calendar.id);
        return stored.filter((id) => available.includes(id));
    });
    const [showEventModal, setShowEventModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTaskView, setShowTaskView] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selection, setSelection] = useState(null);
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [dayDetailDate, setDayDetailDate] = useState(null);
    const [taskDefaultDueDate, setTaskDefaultDueDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [monthTitleDraft, setMonthTitleDraft] = useState(monthTitle || "");

    useEffect(() => setMonthTitleDraft(monthTitle || ""), [monthTitle]);

    useEffect(() => {
        const available = eventCalendars.map((calendar) => calendar.id);
        setCalendarIds((current) => {
            return current.filter((id) => available.includes(id));
        });
    }, [eventCalendars]);

    // The rendered heading, previously supplied by FullCalendar's view.title.
    const title = useMemo(() => {
        if (view === "month") {
            return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        }
        if (view === "day") {
            return date.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        }
        const { days } = weekRange(date);
        const first = days[0];
        const last = days[6];
        const sameMonth = first.getMonth() === last.getMonth();
        const startLabel = first.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const endLabel = last.toLocaleDateString(
            undefined,
            sameMonth
                ? { day: "numeric", year: "numeric" }
                : { month: "short", day: "numeric", year: "numeric" }
        );
        return `${startLabel} – ${endLabel}`;
    }, [view, date]);

    const currentRange = () => {
        if (view === "week") return weekRange(date);
        if (view === "day") return dayRange(date);
        return monthGridRange(date);
    };

    const queryRange = (start, end, anchor, nextSources = sources, nextCalendars = calendarIds) => {
        const inclusiveEnd = new Date(end.getTime() - 1);
        const rangeKey = `${toDateString(start)}|${toDateString(inclusiveEnd)}`;
        loadedRangeRef.current = rangeKey;
        router.get(
            route("calendar.index"),
            {
                date: toDateString(anchor),
                start: toDateString(start),
                end: toDateString(inclusiveEnd),
                view: VIEW_TO_FC[view],
                sources: nextSources.join(","),
                calendars: nextCalendars.join(","),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
                onError: () => toast.error("We couldn’t load that calendar range."),
            }
        );
    };

    const reloadCurrentRange = (nextSources = sources, nextCalendars = calendarIds) => {
        const range = currentRange();
        queryRange(range.start, range.end, date, nextSources, nextCalendars);
    };

    // Replaces FullCalendar's datesSet: refetch only when the visible range moves.
    const handleRangeChange = ({ start, end }) => {
        const inclusiveEnd = new Date(end.getTime() - 1);
        const rangeKey = `${toDateString(start)}|${toDateString(inclusiveEnd)}`;
        if (rangeKey !== loadedRangeRef.current) {
            queryRange(start, end, date);
        }
    };

    const changeView = (nextView) => {
        setView(nextView);
        localStorage.setItem(VIEW_KEY, nextView);
    };

    const changeSources = (nextSources) => {
        const safeSources = nextSources.length ? nextSources : ["events"];
        setSources(safeSources);
        localStorage.setItem(SOURCE_KEY, JSON.stringify(safeSources));
        reloadCurrentRange(safeSources, calendarIds);
    };

    const changeCalendars = (nextIds) => {
        setCalendarIds(nextIds);
        localStorage.setItem(calendarStorageKey, JSON.stringify(nextIds));
        reloadCurrentRange(sources, nextIds);
    };

    const openEvent = (item, initial = null) => {
        setSelectedItem(item);
        setSelection(initial);
        setShowEventModal(true);
    };

    const openTransactionsForDate = (transactionDate) => {
        router.visit(
            route("weviewallet.transactions.index", {
                start_date: transactionDate,
                end_date: transactionDate,
            })
        );
    };

    const openMealPlanner = (item) => {
        const householdId = item.extendedProps?.householdId;
        if (householdId) router.visit(route("meal-planning.planner", householdId));
    };

    // A calendar item was clicked → route it to the right destination.
    const handleSelectEvent = (item) => {
        if (item.sourceType === "event") {
            openEvent(item);
        } else if (item.sourceType === "task") {
            setSelectedTask(item.extendedProps?.task);
            setShowTaskView(true);
        } else if (item.sourceType === "meal") {
            openMealPlanner(item);
        } else {
            openTransactionsForDate(item.extendedProps?.date || item.occurrenceKey);
        }
    };

    // Month empty-day click / "+N more" → the themed day panel.
    const handleSelectDay = (dateStr) => {
        setDayDetailDate(dateStr);
        setShowDayDetail(true);
    };

    // Week/Day empty slot (click or short drag) → prefilled new-event modal.
    const handleSelectSlot = ({ start, end, allDay }) => {
        openEvent(null, { start, end, allDay, kind: "event" });
    };

    const openNewEventForDate = (dateStr) => {
        setShowDayDetail(false);
        openEvent(null, { start: dateStr, allDay: true, kind: "event" });
    };

    const openNewTaskForDate = (dateStr) => {
        setShowDayDetail(false);
        setTaskDefaultDueDate(dateStr);
        setShowTaskModal(true);
    };

    const viewDay = (dateStr) => {
        setShowDayDetail(false);
        changeView("day");
        setDate(parseAnchor(dateStr));
    };

    // Kept for the (deferred) drag-to-reschedule phase; intentionally unwired.
    // eslint-disable-next-line no-unused-vars
    const persistScheduleChange = async (info) => {
        const item = {
            eventId: info.event.eventId,
            occurrenceKey: info.event.occurrenceKey,
            sourceType: info.event.sourceType,
        };
        if (item.sourceType === "meal") {
            const householdId = info.event.extendedProps.householdId;
            if (!householdId || !item.eventId) {
                info.revert();
                return;
            }
            const startsAt = info.event.start;
            const endsAt = info.event.end || new Date(startsAt.getTime() + 3600000);
            router.patch(
                route("meal-planning.api.events.move", [householdId, item.eventId]),
                { starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() },
                {
                    preserveScroll: true,
                    onError: () => {
                        info.revert();
                        toast.error(
                            "We couldn’t move that meal item. Its original time was restored."
                        );
                    },
                }
            );
            return;
        }
        if (item.sourceType !== "event") {
            info.revert();
            return;
        }

        let scope = "series";
        if (info.event.extendedProps.isRecurring) {
            const result = await Swal.fire({
                title: "Change this schedule?",
                text: "Choose whether this move applies once or to the whole series.",
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: "This occurrence",
                denyButtonText: "Whole series",
                confirmButtonColor: "#4ACF91",
            });
            if (result.isDismissed) {
                info.revert();
                return;
            }
            scope = result.isDenied ? "series" : "occurrence";
        } else {
            const result = await Swal.fire({
                title: "Save the new time?",
                showCancelButton: true,
                confirmButtonText: "Save change",
                confirmButtonColor: "#4ACF91",
            });
            if (!result.isConfirmed) {
                info.revert();
                return;
            }
        }

        const payload = {
            scope,
            occurrence_key: item.occurrenceKey,
            is_all_day: info.event.allDay,
            timezone: userTimezone,
        };
        if (info.event.allDay) {
            payload.start_date = info.event.startStr.slice(0, 10);
            const exclusiveEnd = (info.event.endStr || info.event.startStr).slice(0, 10);
            payload.end_date = info.event.end
                ? Temporal.PlainDate.from(exclusiveEnd).subtract({ days: 1 }).toString()
                : exclusiveEnd;
        } else {
            payload.starts_at = info.event.start.toISOString();
            payload.ends_at = (
                info.event.end || new Date(info.event.start.getTime() + 3600000)
            ).toISOString();
        }

        router.put(route("calendar-events.update", item.eventId), payload, {
            preserveScroll: true,
            onError: () => {
                info.revert();
                toast.error("We couldn’t move that event. Its original time was restored.");
            },
        });
    };

    const saveMonthTitle = () => {
        router.post(
            route("calendar.month-title.update"),
            {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                title: monthTitleDraft.trim(),
            },
            { preserveScroll: true }
        );
    };

    const itemsForDate = useMemo(() => {
        if (!dayDetailDate) return [];
        return calendarItems.filter((item) => itemDateKey(item) === dayDetailDate);
    }, [calendarItems, dayDetailDate]);

    // One compact chip renderer for every view: a per-source icon + optional time
    // + a truncating label, so the sources stay visually distinct and never overflow.
    const renderEvent = (item) => {
        const meta = metaForSource(item.sourceType);
        const { aggregated, count, net, currency } = item.extendedProps || {};
        const title = aggregated ? `${count} transactions` : item.title;
        const timeText = !item.allDay && item.start ? formatClock(item.start) : "";
        const label = aggregated ? `${count} · ${formatCompactCurrency(net, currency)}` : title;
        // Aggregated finance chips are cryptic on their own ("28 · -₱132.5K"),
        // so spell out what the numbers mean on hover/tap.
        const tooltip = aggregated
            ? `${count} transactions · Net ${formatCompactCurrency(net, currency)}`
            : title;

        return (
            <div className="wv-ev-chip flex items-center gap-1 overflow-hidden" title={tooltip}>
                <meta.Icon className="wv-ev-icon h-3 w-3 shrink-0" />
                {timeText && (
                    <span className="shrink-0 text-[0.65rem] font-medium opacity-90">
                        {timeText}
                    </span>
                )}
                <span className="min-w-0 flex-1 truncate">{label}</span>
            </div>
        );
    };

    const viewOptions = [
        ["month", "Month"],
        ["week", "Week"],
        ["day", "Day"],
    ];

    return (
        <TodoLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
                            Calendar
                        </h1>
                        <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                            See your time clearly, without the extra noise.
                        </p>
                    </div>
                    <div className="relative flex w-full items-center gap-2 sm:w-auto">
                        <CalendarSources
                            calendars={eventCalendars}
                            sources={sources}
                            selectedCalendarIds={calendarIds}
                            onSourcesChange={changeSources}
                            onCalendarsChange={changeCalendars}
                        />
                        <Menu as="div" className="relative">
                            <MenuButton className="btn-primary min-h-9 flex-1 justify-center gap-2 px-4 text-sm sm:flex-none">
                                <Plus className="h-4 w-4" />
                                Add
                            </MenuButton>
                            <MenuItems
                                anchor="bottom end"
                                className="z-40 mt-2 w-52 rounded-xl border border-light-border bg-light-card p-1.5 shadow-xl dark:border-dark-border dark:bg-dark-card"
                            >
                                <MenuItem>
                                    <button
                                        type="button"
                                        onClick={() => openEvent(null)}
                                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-light-primary hover:bg-light-hover focus:bg-light-hover focus:outline-none dark:text-dark-primary dark:hover:bg-dark-hover dark:focus:bg-dark-hover"
                                    >
                                        <CalendarPlus className="h-4 w-4 text-wevie-teal" />
                                        New event
                                    </button>
                                </MenuItem>
                                <MenuItem>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTaskDefaultDueDate("");
                                            setShowTaskModal(true);
                                        }}
                                        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-light-primary hover:bg-light-hover focus:bg-light-hover focus:outline-none dark:text-dark-primary dark:hover:bg-dark-hover dark:focus:bg-dark-hover"
                                    >
                                        <ListPlus className="h-4 w-4 text-secondary-500" />
                                        New task
                                    </button>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                </div>
            }
        >
            <Head title="Calendar" />
            <div className="card overflow-hidden" data-tour="calendar-grid">
                <div
                    className="flex flex-col gap-3 border-b border-light-border/70 p-3 dark:border-dark-border/70 sm:p-4"
                    data-tour="calendar-header"
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setDate((current) => addPeriod(view, current, -1))}
                                aria-label="Previous period"
                                className="min-h-11 min-w-11 rounded-xl p-2 text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDate((current) => addPeriod(view, current, 1))}
                                aria-label="Next period"
                                className="min-h-11 min-w-11 rounded-xl p-2 text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDate(new Date())}
                                className="btn-secondary min-h-11 text-sm"
                            >
                                Today
                            </button>
                        </div>
                        <div className="min-w-0 px-2 text-center">
                            <h2 className="truncate text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                                {title}
                            </h2>
                            {monthTitle && (
                                <p className="truncate text-xs text-light-muted dark:text-dark-muted">
                                    {monthTitle}
                                </p>
                            )}
                        </div>
                        <Menu as="div" className="relative flex flex-1 justify-end">
                            <MenuButton
                                aria-label="More calendar options"
                                className="min-h-11 min-w-11 rounded-xl p-2 text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                <Ellipsis className="h-5 w-5" />
                            </MenuButton>
                            <MenuItems
                                anchor="bottom end"
                                className="z-40 mt-2 w-72 rounded-xl border border-light-border bg-light-card p-3 shadow-xl dark:border-dark-border dark:bg-dark-card"
                            >
                                <div>
                                    <label
                                        htmlFor="month-title"
                                        className="text-xs font-medium text-light-secondary dark:text-dark-secondary"
                                    >
                                        Name this month
                                    </label>
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            id="month-title"
                                            value={monthTitleDraft}
                                            maxLength="60"
                                            onChange={(e) => setMonthTitleDraft(e.target.value)}
                                            className="input-primary min-w-0 flex-1 py-2 text-sm"
                                            placeholder="Optional theme"
                                        />
                                        <button
                                            type="button"
                                            onClick={saveMonthTitle}
                                            className="btn-primary px-3 text-sm"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </MenuItems>
                        </Menu>
                    </div>
                    <div className="flex w-full overflow-x-auto rounded-xl bg-light-hover p-1 dark:bg-dark-hover sm:mx-auto sm:w-auto">
                        {viewOptions.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => changeView(value)}
                                aria-pressed={view === value}
                                className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-medium sm:flex-none ${view === value ? "bg-light-card text-light-primary shadow-sm dark:bg-dark-card dark:text-dark-primary" : "text-light-muted hover:text-light-primary dark:text-dark-muted dark:hover:text-dark-primary"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="calendar-shell relative p-2 sm:p-4">
                    {isLoading && (
                        <div
                            className="absolute right-4 top-4 z-20 rounded-full bg-light-card/95 px-3 py-1.5 text-xs font-medium text-light-secondary shadow-soft dark:bg-dark-card/95 dark:text-dark-secondary"
                            role="status"
                        >
                            Updating calendar…
                        </div>
                    )}
                    <WevieCalendar
                        view={view}
                        date={date}
                        events={calendarItems}
                        renderEvent={renderEvent}
                        onRangeChange={handleRangeChange}
                        onSelectEvent={handleSelectEvent}
                        onSelectDay={handleSelectDay}
                        onSelectSlot={handleSelectSlot}
                        onMore={handleSelectDay}
                        onNavLinkDay={viewDay}
                    />
                </div>
            </div>

            <EventModal
                key={`${selectedItem?.eventId || "new"}:${selectedItem?.occurrenceKey || selection?.start || "blank"}:${showEventModal}`}
                show={showEventModal}
                onClose={() => {
                    setShowEventModal(false);
                    setSelectedItem(null);
                    setSelection(null);
                }}
                calendars={eventCalendars}
                timezone={userTimezone}
                item={selectedItem}
                initialSelection={selection}
            />
            <TaskModal
                show={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setTaskDefaultDueDate("");
                }}
                categories={categories}
                lists={lists}
                defaultDueDate={taskDefaultDueDate}
            />
            <DayDetailModal
                show={showDayDetail}
                onClose={() => setShowDayDetail(false)}
                date={dayDetailDate}
                items={itemsForDate}
                onNewEvent={openNewEventForDate}
                onNewTask={openNewTaskForDate}
                onViewDay={viewDay}
                onOpenEvent={(item) => {
                    setShowDayDetail(false);
                    openEvent(item);
                }}
                onOpenTask={(task) => {
                    if (!task) return;
                    setShowDayDetail(false);
                    setSelectedTask(task);
                    setShowTaskView(true);
                }}
                onOpenFinance={(financeDate) => {
                    setShowDayDetail(false);
                    openTransactionsForDate(financeDate);
                }}
                onOpenMeal={(item) => {
                    setShowDayDetail(false);
                    openMealPlanner(item);
                }}
            />
            <TaskViewModal
                show={showTaskView}
                onClose={() => setShowTaskView(false)}
                task={selectedTask}
                onTaskUpdate={setSelectedTask}
            />
            <OnboardingTour
                tourKey="calendar"
                steps={calendarSteps}
                requireCompleted={["onboarding"]}
            />
        </TodoLayout>
    );
}
