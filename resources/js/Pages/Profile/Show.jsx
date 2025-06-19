import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    User,
    Mail,
    Calendar,
    Shield,
    LogOut,
    Edit3,
    CheckCircle,
    Clock,
    AlertTriangle,
    BarChart3,
} from "lucide-react";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Show({ user, stats }) {
    const { post } = useForm();

    const handleLogout = (e) => {
        e.preventDefault();
        post(route("logout"));
    };

    // Format the date
    const formatDate = (dateString) => {
        if (!dateString) return "Not verified";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Calculate completion rate
    const completionRate =
        stats.total_tasks > 0
            ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
            : 0;

    return (
        <TodoLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <span>My Profile</span>
                    <div className="flex items-center space-x-3">
                        <Link href={route("profile.edit")}>
                            <SecondaryButton className="flex items-center space-x-2">
                                <Edit3 className="h-4 w-4" />
                                <span>Edit Profile</span>
                            </SecondaryButton>
                        </Link>
                        <form onSubmit={handleLogout}>
                            <DangerButton
                                type="submit"
                                className="flex items-center space-x-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span>Logout</span>
                            </DangerButton>
                        </form>
                    </div>
                </div>
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                {/* Profile Overview Card */}
                <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                    <div className="flex items-start space-x-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {user.name}
                            </h3>
                            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                                Welcome back! Here's your profile overview.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Email Address
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Shield className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Role
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                            {user.role || "Member"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Email Verified
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(user.email_verified_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            Member Since
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Email Verification Status */}
                            <div className="mt-6">
                                {user.email_verified_at ? (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        ✓ Email Verified
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        ⚠ Email Not Verified
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Task Statistics */}
                <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                    <div className="flex items-center space-x-2 mb-6">
                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            Your Task Statistics
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Tasks */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {stats.total_tasks}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total Tasks
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {stats.completed_tasks}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Completed
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pending Tasks */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {stats.pending_tasks}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Pending
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Overdue Tasks */}
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {stats.overdue_tasks}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Overdue
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Completion Rate
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {completionRate}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={route("dashboard")}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            href={route("tasks.index")}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
                        >
                            View All Tasks
                        </Link>
                        <Link
                            href={route("categories.index")}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            Manage Categories
                        </Link>
                        <Link
                            href={route("profile.edit")}
                            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
                        >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>
        </TodoLayout>
    );
}
