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
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow-lg flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200">{message}</p>
            </div>
        </div>
    );
}
