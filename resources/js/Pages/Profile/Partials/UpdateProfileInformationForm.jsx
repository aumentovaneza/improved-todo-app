import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Switch, Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = "" }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        daily_summary_enabled: user.daily_summary_enabled ?? false,
        daily_summary_time: user.daily_summary_time || "08:00",
    });

    // Auto-detect timezone on component mount
    useEffect(() => {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!user.timezone && detectedTimezone) {
            setData("timezone", detectedTimezone);
        }
    }, []);

    const submit = (e) => {
        e.preventDefault();

        patch(route("profile.update"));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData("name", e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="timezone" value="Timezone" />

                    <select
                        id="timezone"
                        className="mt-1 block w-full border-gray-300 dark:border-white/10 dark:bg-dark-card dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                        value={data.timezone}
                        onChange={(e) => setData("timezone", e.target.value)}
                        required
                    >
                        <option value="">Select Timezone</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                        <option value="America/Chicago">Central Time (US & Canada)</option>
                        <option value="America/Denver">Mountain Time (US & Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Europe/Berlin">Berlin</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Shanghai">Shanghai</option>
                        <option value="Asia/Singapore">Singapore</option>
                        <option value="Asia/Manila">Manila</option>
                        <option value="Asia/Dubai">Dubai</option>
                        <option value="Asia/Kolkata">Mumbai</option>
                        <option value="Australia/Sydney">Sydney</option>
                        <option value="Australia/Melbourne">Melbourne</option>
                        <option value="Pacific/Auckland">Auckland</option>
                    </select>

                    <InputError className="mt-2" message={errors.timezone} />

                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Your timezone is automatically detected. You can change it if needed.
                    </p>
                </div>

                <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wevie-teal to-wevie-mint text-white">
                                <Sparkles className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <InputLabel
                                    htmlFor="daily_summary_enabled"
                                    value="Daily AI summary"
                                    className="!text-base !font-medium text-gray-900 dark:text-gray-100"
                                />
                                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                                    Get an AI recap of your tasks and priorities each morning on
                                    your dashboard.
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="daily_summary_enabled"
                            checked={data.daily_summary_enabled}
                            onChange={(value) => setData("daily_summary_enabled", value)}
                            className={`${
                                data.daily_summary_enabled
                                    ? "bg-gradient-to-r from-wevie-teal to-wevie-mint"
                                    : "bg-gray-300 dark:bg-gray-600"
                            } relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-wevie-teal/40`}
                        >
                            <span className="sr-only">Toggle daily AI summary</span>
                            <span
                                className={`${
                                    data.daily_summary_enabled ? "translate-x-6" : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                    </div>

                    {data.daily_summary_enabled && (
                        <div className="mt-4">
                            <InputLabel htmlFor="daily_summary_time" value="Delivery time" />
                            <input
                                id="daily_summary_time"
                                type="time"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-white/10 dark:bg-dark-card dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600 sm:w-48"
                                value={data.daily_summary_time}
                                onChange={(e) => setData("daily_summary_time", e.target.value)}
                            />
                            <InputError className="mt-2" message={errors.daily_summary_time} />
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                We’ll prepare your summary around this time in your timezone.
                            </p>
                        </div>
                    )}

                    <InputError className="mt-2" message={errors.daily_summary_enabled} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={route("verification.send")}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === "verification-link-sent" && (
                            <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-300">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
