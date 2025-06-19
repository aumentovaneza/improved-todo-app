import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, User, Mail, Lock, Shield, Calendar } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { toast } from "react-toastify";
import Toast from "@/Components/Toast";

export default function Edit({ user }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "member",
        password: "",
        password_confirmation: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("admin.users.update", user.id), {
            onSuccess: () => {
                toast.success("User updated successfully");
                setData("password", "");
                setData("password_confirmation", "");
            },
            onError: (errors) => {
                toast.error("Please fix the errors below");
            },
        });
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
            case "member":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
        }
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
                        Edit User
                    </h2>
                </div>
            }
        >
            <Head title={`Edit ${user.name}`} />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* User Info Card */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xl font-medium text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {user.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                            </p>
                            <div className="mt-2 flex items-center space-x-4">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                        user.role
                                    )}`}
                                >
                                    <Shield className="h-3 w-3 mr-1" />
                                    <span className="capitalize">
                                        {user.role}
                                    </span>
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Joined{" "}
                                    {new Date(
                                        user.created_at
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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

                        {/* Password Section */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                Change Password
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Leave password fields empty to keep the current
                                password.
                            </p>

                            {/* New Password Field */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Lock className="inline h-4 w-4 mr-2" />
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter new password (optional)"
                                    minLength={8}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {errors.password}
                                    </p>
                                )}
                                {data.password && (
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Password must be at least 8 characters
                                        long.
                                    </p>
                                )}
                            </div>

                            {/* Confirm New Password Field */}
                            {data.password && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Lock className="inline h-4 w-4 mr-2" />
                                        Confirm New Password
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
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Confirm new password"
                                        minLength={8}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {errors.password_confirmation}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Link href={route("admin.users.index")}>
                                <SecondaryButton type="button">
                                    Cancel
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? "Updating..." : "Update User"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>

            <Toast />
        </TodoLayout>
    );
}
