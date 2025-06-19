import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { User, Mail, Calendar, Shield, LogOut, Edit3 } from "lucide-react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;

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

    return (
        <TodoLayout
            header={
                <div className="flex items-center justify-between">
                    <span>Edit Profile</span>
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
            }
        >
            <Head title="Profile" />

            <div className="space-y-6">
                {/* Profile Overview Card */}
                <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                    <div className="flex items-start space-x-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                                {user.name}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            {user.email_verified_at ? (
                                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    ✓ Email Verified
                                </div>
                            ) : (
                                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    ⚠ Email Not Verified
                                </div>
                            )}
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
                            View Tasks
                        </Link>
                        <Link
                            href={route("categories.index")}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                            Manage Categories
                        </Link>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                    <div className="flex items-center space-x-2 mb-6">
                        <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Edit Profile Information
                        </h3>
                    </div>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 dark:bg-gray-800">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </TodoLayout>
    );
}
