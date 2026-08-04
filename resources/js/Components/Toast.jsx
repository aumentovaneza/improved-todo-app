import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Toast() {
    const [visible, setVisible] = useState(false);
    const { flash } = usePage().props;
    const message = flash?.message;

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!visible || !message) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-primary-50 dark:bg-dark-card border border-light-border/70 dark:border-white/10 shadow-soft rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                <p className="text-primary-700 dark:text-primary-200">{message}</p>
            </div>
        </div>
    );
}
