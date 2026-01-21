import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, User, Mail, Lock, Shield } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { toast } from "react-toastify";
import Toast from "@/Components/Toast";

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "member",
        timezone: "UTC",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.users.store"), {
            onSuccess: () => {
                toast.success("User created successfully");
                reset();
            },
            onError: (errors) => {
                toast.error("Please fix the errors below");
            },
        });
    };

    return (
        <TodoLayout
            header={
                <div className="flex flex-row items-center gap-2 md:gap-4">
                    <Link
                        href={route("admin.users.index")}
                        className="inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Create New User
                    </h2>
                </div>
            }
        >
            <Head title="Create User" />

            <div className="max-w-2xl mx-auto">
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <User className="inline h-4 w-4 mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                placeholder="Enter user's full name"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Mail className="inline h-4 w-4 mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                placeholder="Enter user's email address"
                                required
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Role Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Shield className="inline h-4 w-4 mr-2" />
                                Role
                            </label>
                            <select
                                value={data.role}
                                onChange={(e) =>
                                    setData("role", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                required
                            >
                                <option value="member">Member</option>
                                <option value="admin">Administrator</option>
                            </select>
                            {errors.role && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.role}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {data.role === "admin"
                                    ? "Administrators have full access to all features and can manage other users."
                                    : "Members have access to personal task management features."}
                            </p>
                        </div>

                        {/* Timezone Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Timezone
                            </label>
                            <select
                                value={data.timezone}
                                onChange={(e) =>
                                    setData("timezone", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                required
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">
                                    Eastern Time (US & Canada)
                                </option>
                                <option value="America/Chicago">
                                    Central Time (US & Canada)
                                </option>
                                <option value="America/Denver">
                                    Mountain Time (US & Canada)
                                </option>
                                <option value="America/Los_Angeles">
                                    Pacific Time (US & Canada)
                                </option>
                                <option value="Europe/London">London</option>
                                <option value="Europe/Paris">Paris</option>
                                <option value="Europe/Berlin">Berlin</option>
                                <option value="Asia/Tokyo">Tokyo</option>
                                <option value="Asia/Shanghai">Shanghai</option>
                                <option value="Asia/Singapore">
                                    Singapore
                                </option>
                                <option value="Asia/Manila">Manila</option>
                                <option value="Asia/Dubai">Dubai</option>
                                <option value="Asia/Kolkata">Mumbai</option>
                                <option value="Australia/Sydney">Sydney</option>
                                <option value="Australia/Melbourne">
                                    Melbourne
                                </option>
                                <option value="Pacific/Auckland">
                                    Auckland
                                </option>
                            </select>
                            {errors.timezone && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.timezone}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                placeholder="Enter a secure password"
                                required
                                minLength={8}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.password}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Password must be at least 8 characters long.
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                placeholder="Confirm the password"
                                required
                                minLength={8}
                            />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-white/10">
                            <Link href={route("admin.users.index")}>
                                <SecondaryButton type="button">
                                    Cancel
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? "Creating..." : "Create User"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>

            <Toast />
        </TodoLayout>
    );
}
