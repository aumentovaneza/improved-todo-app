import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Eye,
    EyeOff,
    RotateCcw,
    Calendar,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import { toast } from "react-toastify";
import Toast from "@/Components/Toast";

export default function Index({ inviteCodes, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "");

    const { delete: destroy, patch, processing } = useForm();

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("admin.invite-codes.index"),
            { search, status },
            { preserveState: true, replace: true }
        );
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        router.get(route("admin.invite-codes.index"));
    };

    const deactivateCode = (inviteCode) => {
        if (confirm("Are you sure you want to deactivate this invite code?")) {
            patch(route("admin.invite-codes.deactivate", inviteCode.id), {
                onSuccess: () => {
                    toast.success("Invite code deactivated successfully");
                },
                onError: () => {
                    toast.error("Failed to deactivate invite code");
                },
            });
        }
    };

    const reactivateCode = (inviteCode) => {
        if (confirm("Are you sure you want to reactivate this invite code?")) {
            patch(route("admin.invite-codes.reactivate", inviteCode.id), {
                onSuccess: () => {
                    toast.success("Invite code reactivated successfully");
                },
                onError: () => {
                    toast.error("Failed to reactivate invite code");
                },
            });
        }
    };

    const getStatusBadge = (inviteCode) => {
        if (!inviteCode.is_active) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                </span>
            );
        }

        if (inviteCode.used_count >= inviteCode.max_uses) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Exhausted
                </span>
            );
        }

        if (
            inviteCode.expires_at &&
            new Date(inviteCode.expires_at) < new Date()
        ) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    <Clock className="w-3 h-3 mr-1" />
                    Expired
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return "Never";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <TodoLayout
            header={
                <div className="flex justify-between items-center gap-2 md:gap-4">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Invite Codes
                    </h2>
                    <Link href={route("admin.invite-codes.create")}>
                        <PrimaryButton>
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Code
                        </PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="Invite Codes - Admin" />
            <Toast />

            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Search className="inline w-4 h-4 mr-2" />
                                    Search Code
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Enter invite code..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Filter className="inline w-4 h-4 mr-2" />
                                    Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="expired">Expired</option>
                                    <option value="exhausted">Exhausted</option>
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <PrimaryButton type="submit">
                                    <Search className="w-4 h-4 mr-2" />
                                    Search
                                </PrimaryButton>
                                <SecondaryButton
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    Clear
                                </SecondaryButton>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Invite Codes Table */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Expires
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {inviteCodes.data.map((inviteCode) => (
                                    <tr
                                        key={inviteCode.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {inviteCode.code}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(inviteCode)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                                                <Users className="w-4 h-4 mr-1" />
                                                {inviteCode.used_count} /{" "}
                                                {inviteCode.max_uses}
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.min(
                                                            (inviteCode.used_count /
                                                                inviteCode.max_uses) *
                                                                100,
                                                            100
                                                        )}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {inviteCode.creator?.name ||
                                                    "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                {formatDate(
                                                    inviteCode.expires_at
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                {formatDate(
                                                    inviteCode.created_at
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                {inviteCode.is_active ? (
                                                    <button
                                                        onClick={() =>
                                                            deactivateCode(
                                                                inviteCode
                                                            )
                                                        }
                                                        disabled={processing}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                        title="Deactivate"
                                                    >
                                                        <EyeOff className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            reactivateCode(
                                                                inviteCode
                                                            )
                                                        }
                                                        disabled={processing}
                                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                                                        title="Reactivate"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {inviteCodes.links && (
                        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    {inviteCodes.prev_page_url && (
                                        <Link
                                            href={inviteCodes.prev_page_url}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Previous
                                        </Link>
                                    )}
                                    {inviteCodes.next_page_url && (
                                        <Link
                                            href={inviteCodes.next_page_url}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            Showing{" "}
                                            <span className="font-medium">
                                                {inviteCodes.from}
                                            </span>{" "}
                                            to{" "}
                                            <span className="font-medium">
                                                {inviteCodes.to}
                                            </span>{" "}
                                            of{" "}
                                            <span className="font-medium">
                                                {inviteCodes.total}
                                            </span>{" "}
                                            results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            {inviteCodes.links.map(
                                                (link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || "#"}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                        } ${
                                                            index === 0
                                                                ? "rounded-l-md"
                                                                : ""
                                                        } ${
                                                            index ===
                                                            inviteCodes.links
                                                                .length -
                                                                1
                                                                ? "rounded-r-md"
                                                                : ""
                                                        }`}
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                )
                                            )}
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {inviteCodes.data.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                            <Users className="mx-auto h-12 w-12 mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                No invite codes found
                            </h3>
                            <p className="mb-4">
                                Get started by generating your first invite
                                code.
                            </p>
                            <Link href={route("admin.invite-codes.create")}>
                                <PrimaryButton>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Generate Code
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </TodoLayout>
    );
}
