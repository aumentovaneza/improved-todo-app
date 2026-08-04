import TodoLayout from "@/Layouts/TodoLayout";
import Toast from "@/Components/Toast";
import { enableWebPush, isWebPushSupported } from "@/native/registerWebPush";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from "@headlessui/react";
import {
    Mail,
    Bell,
    Sparkles,
    Wallet,
    Send,
    Trash2,
    ChevronDown,
    Check,
    Wrench,
    Smartphone,
} from "lucide-react";
import { toast } from "react-toastify";

function UserCombobox({ users, value, onChange, id }) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        if (query === "") return users;
        const q = query.toLowerCase();
        return users.filter(
            (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
    }, [users, query]);

    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative">
                <div className="relative">
                    <ComboboxInput
                        id={id}
                        className="w-full rounded-md border border-light-border/70 dark:border-white/10 bg-white dark:bg-dark-card px-3 py-2 pr-10 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Search by name or email..."
                        displayValue={(user) => (user ? `${user.name} (${user.email})` : "")}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </ComboboxButton>
                </div>
                <ComboboxOptions className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-light-border/70 dark:border-white/10 bg-white dark:bg-dark-card py-1 shadow-lg focus:outline-none">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No users found.
                        </div>
                    ) : (
                        filtered.map((user) => (
                            <ComboboxOption
                                key={user.id}
                                value={user}
                                className="group flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-gray-100 data-[focus]:bg-primary-50 dark:data-[focus]:bg-primary-900/20"
                            >
                                <span className="truncate">
                                    <span className="font-medium">{user.name}</span>{" "}
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </span>
                                </span>
                                <Check className="hidden h-4 w-4 text-primary-500 group-data-[selected]:block" />
                            </ComboboxOption>
                        ))
                    )}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}

function ToolCard({ icon: Icon, title, description, children }) {
    return (
        <div className="card p-4 sm:p-6">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                    <div className="mt-4 space-y-3">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function Index({ users }) {
    const { props } = usePage();

    useEffect(() => {
        if (props.flash?.message) toast.success(props.flash.message);
    }, [props.flash?.message]);

    useEffect(() => {
        if (props.flash?.error) toast.error(props.flash.error);
    }, [props.flash?.error]);

    // Test email
    const emailForm = useForm({ email: "", subject: "", message: "" });
    const submitEmail = (e) => {
        e.preventDefault();
        emailForm.post(route("admin.tools.test-email"), {
            preserveScroll: true,
        });
    };

    // Test notification
    const [notifyUser, setNotifyUser] = useState(null);
    const notifyForm = useForm({ user_id: "", message: "" });
    const submitNotification = (e) => {
        e.preventDefault();
        notifyForm.transform((data) => ({ ...data, user_id: notifyUser?.id ?? "" }));
        notifyForm.post(route("admin.tools.test-notification"), {
            preserveScroll: true,
        });
    };

    // Enable web push on this device (must run from a user gesture).
    const vapidPublicKey = props.webPush?.vapidPublicKey ?? null;
    const pushSupported = isWebPushSupported();
    const [enablingPush, setEnablingPush] = useState(false);
    const handleEnablePush = async () => {
        setEnablingPush(true);
        try {
            await enableWebPush(vapidPublicKey);
            toast.success("Push enabled on this device. Send yourself a test notification below.");
        } catch (error) {
            toast.error(error?.message || "Couldn't enable push on this device.");
        } finally {
            setEnablingPush(false);
        }
    };

    // Clear daily summary
    const [summaryUser, setSummaryUser] = useState(null);
    const summaryForm = useForm({ user_id: "" });
    const submitClearSummary = (e) => {
        e.preventDefault();
        if (!summaryUser) return;
        if (
            !confirm(
                `Clear the daily summary cache for ${summaryUser.name}? This deletes their cached summaries.`
            )
        )
            return;
        summaryForm.transform((data) => ({ ...data, user_id: summaryUser.id }));
        summaryForm.post(route("admin.tools.clear-daily-summary"), {
            preserveScroll: true,
        });
    };

    // Clear spending insights
    const [insightsUser, setInsightsUser] = useState(null);
    const insightsForm = useForm({ user_id: "" });
    const submitClearInsights = (e) => {
        e.preventDefault();
        if (!insightsUser) return;
        if (
            !confirm(
                `Clear the spending insights cache for ${insightsUser.name}? This deletes their cached insights.`
            )
        )
            return;
        insightsForm.transform((data) => ({ ...data, user_id: insightsUser.id }));
        insightsForm.post(route("admin.tools.clear-spending-insights"), {
            preserveScroll: true,
        });
    };

    const primaryBtn =
        "inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50";
    const dangerBtn =
        "inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50";
    const inputClass =
        "w-full rounded-md border border-light-border/70 dark:border-white/10 bg-white dark:bg-dark-card px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const errorClass = "mt-1 text-sm text-red-600 dark:text-red-400";

    return (
        <TodoLayout
            header={
                <h2 className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    <Wrench className="h-5 w-5" />
                    Tools
                </h2>
            }
        >
            <Head title="Tools" />

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Test Email */}
                <ToolCard
                    icon={Mail}
                    title="Send test email"
                    description="Send a test email to any address to verify mail delivery."
                >
                    <form onSubmit={submitEmail} className="space-y-3">
                        <div>
                            <label htmlFor="test-email" className={labelClass}>
                                Recipient email
                            </label>
                            <input
                                id="test-email"
                                type="email"
                                required
                                value={emailForm.data.email}
                                onChange={(e) => emailForm.setData("email", e.target.value)}
                                placeholder="you@example.com"
                                className={inputClass}
                            />
                            {emailForm.errors.email && (
                                <p className={errorClass}>{emailForm.errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="email-subject" className={labelClass}>
                                Subject <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                id="email-subject"
                                type="text"
                                value={emailForm.data.subject}
                                onChange={(e) => emailForm.setData("subject", e.target.value)}
                                placeholder="Wevie test email"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-message" className={labelClass}>
                                Message <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                id="email-message"
                                rows={2}
                                value={emailForm.data.message}
                                onChange={(e) => emailForm.setData("message", e.target.value)}
                                placeholder="Custom body text..."
                                className={inputClass}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={emailForm.processing}
                            className={primaryBtn}
                        >
                            <Send className="h-4 w-4" />
                            Send test email
                        </button>
                    </form>
                </ToolCard>

                {/* Test Notification */}
                <ToolCard
                    icon={Bell}
                    title="Send test notification"
                    description="Send a test notification (in-app bell + web push + email) to a user."
                >
                    <div className="rounded-md border border-light-border/70 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Web push on this device
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {pushSupported
                                ? "Enable browser notifications, then send yourself a test below to get a real device push."
                                : "This browser doesn't support web push (needs a secure context; on iOS, install the app to your home screen first)."}
                        </p>
                        <button
                            type="button"
                            onClick={handleEnablePush}
                            disabled={!pushSupported || !vapidPublicKey || enablingPush}
                            className={`${primaryBtn} mt-3`}
                            title={
                                !vapidPublicKey
                                    ? "Web push isn't configured on the server (missing VAPID key)."
                                    : undefined
                            }
                        >
                            <Smartphone className="h-4 w-4" />
                            {enablingPush ? "Enabling…" : "Enable notifications on this device"}
                        </button>
                        {!vapidPublicKey && (
                            <p className={errorClass}>
                                Server VAPID key missing — run{" "}
                                <code>php artisan webpush:vapid</code> and set it in .env.
                            </p>
                        )}
                    </div>
                    <form onSubmit={submitNotification} className="space-y-3">
                        <div>
                            <label htmlFor="notify-user" className={labelClass}>
                                Target user
                            </label>
                            <UserCombobox
                                id="notify-user"
                                users={users}
                                value={notifyUser}
                                onChange={setNotifyUser}
                            />
                            {notifyForm.errors.user_id && (
                                <p className={errorClass}>{notifyForm.errors.user_id}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="notify-message" className={labelClass}>
                                Message <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                id="notify-message"
                                rows={2}
                                value={notifyForm.data.message}
                                onChange={(e) => notifyForm.setData("message", e.target.value)}
                                placeholder="Custom notification text..."
                                className={inputClass}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={notifyForm.processing || !notifyUser}
                            className={primaryBtn}
                        >
                            <Send className="h-4 w-4" />
                            Send notification
                        </button>
                    </form>
                </ToolCard>

                {/* Clear Daily Summary */}
                <ToolCard
                    icon={Sparkles}
                    title="Clear daily summary cache"
                    description="Delete a user's cached AI day summaries so they regenerate."
                >
                    <form onSubmit={submitClearSummary} className="space-y-3">
                        <div>
                            <label htmlFor="summary-user" className={labelClass}>
                                Target user
                            </label>
                            <UserCombobox
                                id="summary-user"
                                users={users}
                                value={summaryUser}
                                onChange={setSummaryUser}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={summaryForm.processing || !summaryUser}
                            className={dangerBtn}
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear daily summary
                        </button>
                    </form>
                </ToolCard>

                {/* Clear Spending Insights */}
                <ToolCard
                    icon={Wallet}
                    title="Clear spending insights cache"
                    description="Delete a user's cached WevieWallet AI insights so they regenerate."
                >
                    <form onSubmit={submitClearInsights} className="space-y-3">
                        <div>
                            <label htmlFor="insights-user" className={labelClass}>
                                Target user
                            </label>
                            <UserCombobox
                                id="insights-user"
                                users={users}
                                value={insightsUser}
                                onChange={setInsightsUser}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={insightsForm.processing || !insightsUser}
                            className={dangerBtn}
                        >
                            <Trash2 className="h-4 w-4" />
                            Clear spending insights
                        </button>
                    </form>
                </ToolCard>
            </div>

            <Toast />
        </TodoLayout>
    );
}
