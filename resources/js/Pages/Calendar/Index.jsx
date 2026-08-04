import { metaForSource } from "@/Components/Calendar/CalendarItemMeta";
import CalendarSources from "@/Components/Calendar/CalendarSources";
import DayDetailModal from "@/Components/Calendar/DayDetailModal";
import EventModal from "@/Components/Calendar/EventModal";
import OnboardingTour from "@/Components/OnboardingTour";
import TaskModal from "@/Components/TaskModal";
import TaskViewModal from "@/Components/TaskViewModal";
import TodoLayout from "@/Layouts/TodoLayout";
import { calendarSteps } from "@/tours";
import { formatCompactCurrency } from "@/Utils/currency";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import "@fullcalendar/react/skeleton.css";
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

const toDateString = (value) => {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

// The local calendar date an item belongs to: all-day/finance items carry a
// Y-m-d occurrenceKey; timed items derive it from their start.
const itemDateKey = (item) => {
    if (item.allDay) {
        const key = item.occurrenceKey || item.start;
        return String(key).slice(0, 10);
    }
    return toDateString(item.start);
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
    const calendarRef = useRef(null);
    const loadedRangeRef = useRef(`${visibleStart}|${visibleEnd}`);
    const [title, setTitle] = useState("");
    const [view, setView] = useState(() => {
        if (typeof window === "undefined") return "dayGridMonth";
        // Agenda (listMonth) is retired; ignore a stored/legacy value so nobody
        // is stranded on a view the toggle no longer offers.
        const stored = localStorage.getItem(VIEW_KEY);
        return stored && stored !== "listMonth" ? stored : "dayGridMonth";
    });
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
                view: calendarRef.current?.getApi().view.type || view,
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
        const api = calendarRef.current?.getApi();
        if (!api) return;
        queryRange(
            api.view.activeStart,
            api.view.activeEnd,
            api.getDate(),
            nextSources,
            nextCalendars
        );
    };

    const handleDatesSet = (info) => {
        setTitle(info.view.title);
        const inclusiveEnd = new Date(info.end.getTime() - 1);
        const rangeKey = `${toDateString(info.start)}|${toDateString(inclusiveEnd)}`;
        if (rangeKey !== loadedRangeRef.current) {
            queryRange(info.start, info.end, info.view.currentStart);
        }
    };

    const changeView = (nextView) => {
        setView(nextView);
        localStorage.setItem(VIEW_KEY, nextView);
        calendarRef.current?.getApi().changeView(nextView);
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

    const handleSelect = (info) => {
        // In month view a single-day click is handled by dateClick (it opens the
        // day panel); only a multi-day drag should start a ranged event here.
        if (
            info.view.type === "dayGridMonth" &&
            info.end.getTime() - info.start.getTime() <= 86400000
        ) {
            calendarRef.current?.getApi().unselect();
            return;
        }
        openEvent(null, {
            start: info.startStr,
            end: info.endStr,
            allDay: info.allDay,
            kind: "event",
        });
        calendarRef.current?.getApi().unselect();
    };

    const itemFromCalendarEvent = (event) => ({
        eventId: event.extendedProps.eventId || event.extendedProps.event?.id || null,
        occurrenceKey: event.extendedProps.occurrenceKey,
        sourceType: event.extendedProps.sourceType,
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
        extendedProps: event.extendedProps,
    });

    const openTransactionsForDate = (date) => {
        router.visit(route("weviewallet.transactions.index", { start_date: date, end_date: date }));
    };

    const openMealPlanner = (item) => {
        const householdId = item.extendedProps?.householdId;
        if (householdId) router.visit(route("meal-planning.planner", householdId));
    };

    const handleEventClick = (info) => {
        const item = itemFromCalendarEvent(info.event);
        if (item.sourceType === "event") {
            openEvent(item);
        } else if (item.sourceType === "task") {
            setSelectedTask(info.event.extendedProps.task);
            setShowTaskView(true);
        } else if (item.sourceType === "meal") {
            openMealPlanner(item);
        } else {
            openTransactionsForDate(info.event.extendedProps.date || item.occurrenceKey);
        }
    };

    const handleDateClick = (info) => {
        // The day panel is the month-view affordance; in week/day a slot click
        // still creates an event through the select handler.
        if (info.view.type !== "dayGridMonth") return;
        setDayDetailDate(info.dateStr);
        setShowDayDetail(true);
    };

    const openNewEventForDate = (date) => {
        setShowDayDetail(false);
        openEvent(null, { start: date, allDay: true, kind: "event" });
    };

    const openNewTaskForDate = (date) => {
        setShowDayDetail(false);
        setTaskDefaultDueDate(date);
        setShowTaskModal(true);
    };

    const viewDay = (date) => {
        setShowDayDetail(false);
        changeView("timeGridDay");
        calendarRef.current?.getApi().gotoDate(date);
    };

    const persistScheduleChange = async (info) => {
        const item = itemFromCalendarEvent(info.event);
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
        const date = calendarRef.current?.getApi().getDate() || new Date(currentDate);
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

    const calendarEvents = useMemo(
        () =>
            calendarItems.map((item) => ({
                ...item,
                extendedProps: {
                    ...item.extendedProps,
                    sourceType: item.sourceType,
                    sourceId: item.sourceId,
                    eventId: item.eventId,
                    occurrenceKey: item.occurrenceKey,
                },
            })),
        [calendarItems]
    );

    const itemsForDate = useMemo(() => {
        if (!dayDetailDate) return [];
        return calendarEvents.filter((item) => itemDateKey(item) === dayDetailDate);
    }, [calendarEvents, dayDetailDate]);

    // One renderer for every view: a compact, truncating chip in month/week/day
    // and a labelled row in the agenda, so the three sources stay distinct and
    // never overlap.
    const renderEventContent = (arg) => {
        const { event, view, timeText } = arg;
        const sourceType = event.extendedProps.sourceType;
        const meta = metaForSource(sourceType);
        const { aggregated, count, net, currency, task } = event.extendedProps;

        const title = aggregated ? `${count} transactions` : event.title;

        if (view.type === "listMonth") {
            let secondary = event.allDay ? "All-day" : timeText;
            if (sourceType === "task" && task) {
                secondary = [capitalize(task.priority), capitalize(task.status?.replace("_", " "))]
                    .filter(Boolean)
                    .join(" · ");
            } else if (aggregated) {
                secondary = `Net ${formatCompactCurrency(net, currency)}`;
            }

            return (
                <div className="flex w-full items-center gap-2">
                    <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badgeClass}`}
                    >
                        <meta.Icon className="h-3 w-3" />
                        {meta.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
                    {secondary && (
                        <span className="shrink-0 text-xs text-light-muted dark:text-dark-muted">
                            {secondary}
                        </span>
                    )}
                </div>
            );
        }

        const label = aggregated ? `${count} · ${formatCompactCurrency(net, currency)}` : title;
        // Aggregated finance chips are cryptic on their own ("28 · -₱132.5K"),
        // so spell out what the numbers mean on hover/tap.
        const tooltip = aggregated
            ? `${count} transactions · Net ${formatCompactCurrency(net, currency)}`
            : title;

        return (
            <div className="wv-ev-chip flex items-center gap-1 overflow-hidden" title={tooltip}>
                <meta.Icon className="h-3 w-3 shrink-0 opacity-90" />
                {!event.allDay && timeText && (
                    <span className="shrink-0 text-[0.65rem] font-medium opacity-90">
                        {timeText}
                    </span>
                )}
                <span className="min-w-0 flex-1 truncate">{label}</span>
            </div>
        );
    };

    const viewOptions = [
        ["dayGridMonth", "Month"],
        ["timeGridWeek", "Week"],
        ["timeGridDay", "Day"],
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
                            <MenuButton className="btn-primary min-h-11 flex-1 justify-center gap-2 px-6 sm:flex-none">
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
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => calendarRef.current?.getApi().prev()}
                                aria-label="Previous period"
                                className="min-h-11 min-w-11 rounded-xl p-2 text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => calendarRef.current?.getApi().next()}
                                aria-label="Next period"
                                className="min-h-11 min-w-11 rounded-xl p-2 text-light-secondary hover:bg-light-hover dark:text-dark-secondary dark:hover:bg-dark-hover"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => calendarRef.current?.getApi().today()}
                                className="btn-secondary min-h-11 text-sm"
                            >
                                Today
                            </button>
                        </div>
                        <div className="min-w-0 text-center">
                            <h2 className="truncate text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                                {title}
                            </h2>
                            {monthTitle && (
                                <p className="truncate text-xs text-light-muted dark:text-dark-muted">
                                    {monthTitle}
                                </p>
                            )}
                        </div>
                        <Menu as="div" className="relative">
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
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView={view}
                        initialDate={currentDate}
                        headerToolbar={false}
                        events={calendarEvents}
                        eventContent={renderEventContent}
                        eventClassNames={(arg) => [
                            "wv-ev",
                            `wv-ev--${arg.event.extendedProps.sourceType}`,
                        ]}
                        datesSet={handleDatesSet}
                        selectable
                        selectMirror
                        select={handleSelect}
                        eventClick={handleEventClick}
                        navLinks
                        navLinkDayClick={(date) => viewDay(toDateString(date))}
                        dateClick={handleDateClick}
                        editable
                        eventDrop={persistScheduleChange}
                        eventResize={persistScheduleChange}
                        dayMaxEvents={3}
                        slotEventOverlap={false}
                        nowIndicator
                        allDaySlot
                        slotMinTime="05:00:00"
                        slotMaxTime="24:00:00"
                        scrollTime="07:00:00"
                        height="auto"
                        eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
                        noEventsContent="Nothing scheduled here yet."
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
                onOpenFinance={(date) => {
                    setShowDayDetail(false);
                    openTransactionsForDate(date);
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
