import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-adaptive-primary pt-6 sm:justify-center sm:pt-0">
            <div className="flex flex-col items-center">
                <Link href="/">
                    <ApplicationLogo className="h-20 w-auto text-primary-500" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-bold text-center px-4 text-adaptive-primary">
                    FocusFlow
                </h1>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-adaptive-card px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg border border-light-border dark:border-dark-border">
                {children}
            </div>
        </div>
    );
}
