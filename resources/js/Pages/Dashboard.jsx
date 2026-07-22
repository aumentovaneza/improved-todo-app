import { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { toast } from "react-toastify";
import { SlidersHorizontal } from "lucide-react";
import TodoLayout from "@/Layouts/TodoLayout";
import SampleDataBanner from "@/Components/SampleDataBanner";
import GettingStartedChecklist from "@/Components/GettingStartedChecklist";
import DailySummaryCard from "@/Components/DailySummary/DailySummaryCard";
import WidgetGrid from "@/Components/Dashboard/WidgetGrid";
import CustomizeDashboardModal from "@/Components/Dashboard/CustomizeDashboardModal";

/**
 * Customizable widget dashboard. Server state (widget layout, per-widget data,
 * the AI summary) arrives via Inertia props; the only local state here is the
 * optimistic layout and the customize-modal visibility.
 */
export default function Dashboard({
    availableWidgets = [],
    widgetLayout = [],
    widgetData = {},
    dailySummary = null,
    dailySummaryEnabled = true,
    canUseDailySummary,
    gettingStarted = {},
}) {
    const [layout, setLayout] = useState(widgetLayout);
    const [showCustomize, setShowCustomize] = useState(false);

    // Keep local layout in sync when the server sends a new one.
    useEffect(() => {
        setLayout(widgetLayout);
    }, [widgetLayout]);

    const persistLayout = (nextLayout, previousLayout) => {
        const widgets = nextLayout.map((item) => ({
            key: item.key,
            size: item.size,
            enabled: item.enabled,
        }));

        router.post(
            route("dashboard.layout.update"),
            { widgets },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    if (previousLayout) setLayout(previousLayout);
                    toast.error("We couldn’t save your layout just now. Please try again.");
                },
            }
        );
    };

    const handleReorder = (nextLayout) => {
        const previousLayout = layout;
        setLayout(nextLayout); // optimistic
        persistLayout(nextLayout, previousLayout);
    };

    // The customize modal persists on its own; mirror the saved layout locally
    // so the grid updates without waiting for a full page reload.
    const handleCustomizeSaved = (widgets) => {
        setLayout(widgets.map((w) => ({ ...w })));
    };

    return (
        <TodoLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-4 sm:space-y-6">
                <DailySummaryCard
                    summary={dailySummary}
                    enabled={dailySummaryEnabled}
                    canUse={canUseDailySummary ?? true}
                />

                <SampleDataBanner show={!!gettingStarted.hasSampleData} />

                <GettingStartedChecklist gettingStarted={gettingStarted} />

                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-adaptive-primary sm:text-lg">
                        Your widgets
                    </h2>
                    <button
                        type="button"
                        onClick={() => setShowCustomize(true)}
                        className="btn-secondary"
                        data-tour="customize-dashboard"
                    >
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Customize
                    </button>
                </div>

                <WidgetGrid layout={layout} widgetData={widgetData} onReorder={handleReorder} />
            </div>

            <CustomizeDashboardModal
                show={showCustomize}
                onClose={() => setShowCustomize(false)}
                availableWidgets={availableWidgets}
                widgetLayout={layout}
                onSaved={handleCustomizeSaved}
            />
        </TodoLayout>
    );
}
