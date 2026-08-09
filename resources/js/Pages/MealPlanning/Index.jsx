import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import { ChevronRight, Loader2, Plus, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

const inputClass = "input-primary w-full border px-3 py-2 text-sm focus:ring-1 focus:outline-none";

function buildTimezones(preferred) {
    let zones = [];
    try {
        if (typeof Intl.supportedValuesOf === "function") {
            zones = Intl.supportedValuesOf("timeZone");
        }
    } catch {
        zones = [];
    }
    if (!zones.length) {
        zones = [
            "UTC",
            "Asia/Manila",
            "Asia/Singapore",
            "Asia/Tokyo",
            "Australia/Sydney",
            "Europe/London",
            "Europe/Berlin",
            "America/New_York",
            "America/Chicago",
            "America/Los_Angeles",
        ];
    }
    if (preferred && !zones.includes(preferred)) {
        zones = [preferred, ...zones];
    }
    return zones;
}

export default function Index({ households = [], countries = [], userTimezone = null }) {
    const browserTimezone = useMemo(() => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            return null;
        }
    }, []);
    const defaultTimezone = userTimezone || browserTimezone || "Asia/Manila";
    const timezones = useMemo(() => buildTimezones(defaultTimezone), [defaultTimezone]);

    const defaultCountry = countries.find((c) => c.code === "PH")?.code || countries[0]?.code || "";
    const currencyFor = (code) => countries.find((c) => c.code === code)?.currency || "";

    const [form, setForm] = useState({
        name: "",
        country_code: defaultCountry,
        currency: currencyFor(defaultCountry) || "PHP",
        timezone: defaultTimezone,
    });
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    const onCountryChange = (code) => {
        setForm((prev) => ({
            ...prev,
            country_code: code,
            currency: currencyFor(code) || prev.currency,
        }));
    };

    const create = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setError("");
        try {
            const { data } = await axios.post(route("meal-planning.api.households.store"), {
                name: form.name,
                country_code: form.country_code || undefined,
                timezone: form.timezone || undefined,
                currency: form.currency ? form.currency.toUpperCase() : undefined,
            });
            toast.success("Household created.");
            router.visit(route("meal-planning.planner", data.data.id));
        } catch (e) {
            setError(e.response?.data?.message || "Unable to create the household.");
            setProcessing(false);
        }
    };

    return (
        <TodoLayout
            header={
                <h2 className="text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                    Meal Planning
                </h2>
            }
        >
            <Head title="Meal Planning" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-light-primary dark:text-dark-primary">
                        Household meal planning
                    </h1>
                    <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
                        Shared plans, local ingredients, pantry forecasts, and individual meal
                        diaries.
                    </p>
                </div>

                {households.length === 0 ? (
                    <div className="card p-8 text-center">
                        <div className="mb-4 text-light-muted dark:text-dark-muted">
                            <UtensilsCrossed className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold text-light-primary dark:text-dark-primary sm:text-lg">
                            No households yet
                        </h3>
                        <p className="text-sm text-light-secondary dark:text-dark-secondary">
                            Create your first household below to start planning meals together.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {households.map((household) => (
                            <Link
                                key={household.id}
                                href={route("meal-planning.planner", household.id)}
                                className="card-hover group flex items-center justify-between gap-3 p-5"
                            >
                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-semibold text-light-primary dark:text-dark-primary group-hover:text-wevie-teal dark:group-hover:text-wevie-mint">
                                        {household.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-light-secondary dark:text-dark-secondary">
                                        {household.members?.length || 0} members ·{" "}
                                        {household.country_code}
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 flex-shrink-0 text-light-muted transition-transform group-hover:translate-x-0.5 dark:text-dark-muted" />
                            </Link>
                        ))}
                    </div>
                )}

                <form onSubmit={create} className="card max-w-2xl p-5">
                    <h2 className="text-lg font-semibold text-light-primary dark:text-dark-primary">
                        Create a household
                    </h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="hh-name" value="Household name" />
                            <input
                                id="hh-name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="e.g. The Cruz Family"
                                className={`mt-1 ${inputClass}`}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="hh-country" value="Country" />
                            <select
                                id="hh-country"
                                value={form.country_code}
                                onChange={(e) => onCountryChange(e.target.value)}
                                className={`mt-1 ${inputClass}`}
                            >
                                {countries.length === 0 && <option value="">—</option>}
                                {countries.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel htmlFor="hh-currency" value="Currency" />
                            <input
                                id="hh-currency"
                                value={form.currency}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        currency: e.target.value.toUpperCase().slice(0, 3),
                                    })
                                }
                                maxLength={3}
                                placeholder="PHP"
                                className={`mt-1 ${inputClass} uppercase`}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="hh-timezone" value="Time zone" />
                            <select
                                id="hh-timezone"
                                value={form.timezone}
                                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                                className={`mt-1 ${inputClass}`}
                            >
                                {timezones.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <InputError message={error} className="mt-3" />
                    <div className="mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary disabled:opacity-60"
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            {processing ? "Creating…" : "Create household"}
                        </button>
                    </div>
                </form>
            </div>
        </TodoLayout>
    );
}
