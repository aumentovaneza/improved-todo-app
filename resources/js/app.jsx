import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { PomodoroProvider } from "./Components/Pomodoro";
import { registerSW } from "virtual:pwa-register";

const appName = import.meta.env.VITE_APP_NAME || "Wevie";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <PomodoroProvider>
                <App {...props} />
            </PomodoroProvider>
        );
    },
    progress: {
        color: "#4B5563",
    },
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    registerSW({ immediate: true });
}
