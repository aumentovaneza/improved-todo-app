import TourTooltip from "@/Components/TourTooltip";
import { onboardingSteps } from "@/tours";
import { router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";

const MOBILE_BREAKPOINT_PX = 1024;

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window === "undefined"
            ? false
            : window.innerWidth < MOBILE_BREAKPOINT_PX
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        const onResize = () =>
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return isMobile;
}

/**
 * Generic tour component. Default behavior runs the global onboarding tour,
 * but pass `tourKey` + `steps` to run a different tour (e.g. per-page).
 *
 * `requireCompleted` lets a page-level tour wait for the global onboarding
 * tour to finish/skip before auto-starting, so we never show two tours at once.
 */
export default function OnboardingTour({
    tourKey = "onboarding",
    steps = onboardingSteps,
    requireCompleted = [],
    disableOverlay = false,
}) {
    const page = usePage();
    const user = page.props?.auth?.user;
    const allProgress = user?.tutorial_progress ?? {};
    const progress = allProgress[tourKey] ?? null;
    const isCompleted = !!progress?.completed;
    const isSkipped = !!progress?.skipped;
    const isMobile = useIsMobile();
    const resolvedSteps = useMemo(
        () =>
            steps.map((step) => ({
                ...step,
                target:
                    isMobile && step.mobileTarget
                        ? step.mobileTarget
                        : step.target,
                placement:
                    isMobile && step.mobilePlacement
                        ? step.mobilePlacement
                        : step.placement,
            })),
        [steps, isMobile]
    );
    const initialStep = Math.max(
        0,
        Math.min(progress?.step ?? 0, resolvedSteps.length - 1)
    );

    const prerequisitesMet = requireCompleted.every((key) => {
        const p = allProgress[key];
        return p?.completed || p?.skipped;
    });

    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(initialStep);

    useEffect(() => {
        if (!user) return;
        if (isCompleted || isSkipped) return;
        if (!prerequisitesMet) return;

        const id = setTimeout(() => setRun(true), 400);
        return () => clearTimeout(id);
    }, [user?.id, isCompleted, isSkipped, prerequisitesMet]);

    if (!user || isCompleted || isSkipped) return null;
    if (!prerequisitesMet) return null;

    const persist = (payload) => {
        router.post(route("tutorials.update", { key: tourKey }), payload, {
            preserveScroll: true,
            preserveState: true,
            only: ["auth"],
        });
    };

    const handleCallback = (data) => {
        const { action, index, status, type } = data;

        // Terminal states win — write once and stop. Do not also persist the
        // intermediate step here, otherwise the two parallel partial reloads
        // can race and the step write may overwrite `completed: true`.
        if (status === STATUS.FINISHED) {
            setRun(false);
            persist({ completed: true, step: resolvedSteps.length });
            return;
        }
        if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
            setRun(false);
            persist({ skipped: true });
            return;
        }

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            const next = action === ACTIONS.PREV ? index - 1 : index + 1;
            setStepIndex(next);
            // Don't persist past the last step — the FINISHED callback will.
            if (next >= 0 && next < resolvedSteps.length) {
                persist({ step: next });
            }
        }
    };

    return (
        <Joyride
            steps={resolvedSteps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showSkipButton
            disableOverlay={disableOverlay}
            disableOverlayClose
            scrollToFirstStep
            floaterProps={{
                offset: 12,
                styles: { floater: { maxWidth: "92vw" } },
            }}
            tooltipComponent={TourTooltip}
            callback={handleCallback}
            styles={{
                options: {
                    primaryColor: "#4ACF91",
                    zIndex: 10000,
                    arrowColor: "#ffffff",
                    overlayColor: "rgba(15, 23, 42, 0.55)",
                },
                spotlight: {
                    borderRadius: 12,
                },
            }}
        />
    );
}
