import { usePage } from "@inertiajs/react";

export default function AdminOnly({ children, fallback = null }) {
    const { auth } = usePage().props;

    if (!auth.user || auth.user.role !== "admin") {
        return fallback;
    }

    return children;
}
