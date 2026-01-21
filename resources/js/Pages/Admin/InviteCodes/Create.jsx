import TodoLayout from "@/Layouts/TodoLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Users, Calendar, Clock, Info } from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { toast } from "react-toastify";
import Toast from "@/Components/Toast";

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        max_uses: 1,
        expires_at: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.invite-codes.store"), {
            onSuccess: () => {
                toast.success("Invite code generated successfully");
                reset();
            },
            onError: (errors) => {
                toast.error("Please fix the errors below");
            },
        });
    };

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // At least 1 minute from now
        return now.toISOString().slice(0, 16);
    };

    return (
        <TodoLayout
            header={
                <div className="flex items-center space-x-4">
                    <Link href={route("admin.invite-codes.index")}>
                        <SecondaryButton>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Invite Codes
                        </SecondaryButton>
                    </Link>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Generate Invite Code
                    </h2>
                </div>
            }
        >
            <Head title="Generate Invite Code - Admin" />
            <Toast />

            <div className="max-w-2xl mx-auto">
                <div className="card p-6">
                    {/* Info Banner */}
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">
                                    About Invite Codes
                                </p>
                                <p>
                                    Invite codes are required for new user
                                    registration during the testing phase. Each
                                    code can be used a limited number of times
                                    and can optionally expire at a specific
                                    date.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Max Uses Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Users className="inline h-4 w-4 mr-2" />
                                Maximum Uses
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={data.max_uses}
                                onChange={(e) =>
                                    setData(
                                        "max_uses",
                                        parseInt(e.target.value) || 1
                                    )
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                                placeholder="Enter maximum number of uses"
                                required
                            />
                            {errors.max_uses && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.max_uses}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                How many users can register using this invite
                                code (1-1000).
                            </p>
                        </div>

                        {/* Expiration Date Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="inline h-4 w-4 mr-2" />
                                Expiration Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.expires_at}
                                min={getMinDateTime()}
                                onChange={(e) =>
                                    setData("expires_at", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-light-border/70 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-dark-card dark:text-white"
                            />
                            {errors.expires_at && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.expires_at}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Leave empty for no expiration. If set, the code
                                will become invalid after this date.
                            </p>
                        </div>

                        {/* Preview Section */}
                        <div className="bg-gray-50 dark:bg-dark-card/70 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Invite Code Preview
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    <span>
                                        Can be used by up to{" "}
                                        <strong>{data.max_uses}</strong> user
                                        {data.max_uses !== 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span>
                                        {data.expires_at
                                            ? `Expires on ${new Date(
                                                  data.expires_at
                                              ).toLocaleString()}`
                                            : "Never expires"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-white/10">
                            <Link href={route("admin.invite-codes.index")}>
                                <SecondaryButton type="button">
                                    Cancel
                                </SecondaryButton>
                            </Link>
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating...
                                    </div>
                                ) : (
                                    <>
                                        <Users className="w-4 h-4 mr-2" />
                                        Generate Invite Code
                                    </>
                                )}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </TodoLayout>
    );
}
