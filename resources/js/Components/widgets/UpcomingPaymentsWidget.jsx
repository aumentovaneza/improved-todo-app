import { Wallet, CalendarClock } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import WidgetFrame from "@/Components/Dashboard/WidgetFrame";
import EmptyState from "@/Components/Finance/UI/EmptyState";
import { formatCurrency } from "@/Utils/currency";

function toDate(value) {
    if (!value) return null;
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
}

/**
 * Upcoming finance payments. Reads the `upcoming_payments` slice — an array of
 * transactions each optionally carrying a `loan` or a `category`. Amounts use
 * the shared en-PH currency helper.
 */
export default function UpcomingPaymentsWidget({ data, dragHandleProps }) {
    const payments = data ?? [];

    return (
        <WidgetFrame
            title="Upcoming payments"
            icon={Wallet}
            iconClassName="bg-emerald-100/60 text-emerald-500 dark:bg-emerald-900/30"
            dragHandleProps={dragHandleProps}
        >
            {payments.length === 0 ? (
                <EmptyState
                    icon={CalendarClock}
                    title="Nothing scheduled yet"
                    description="We’ll keep watch here when you add a payment."
                />
            ) : (
                <ul className="space-y-2">
                    {payments.map((payment) => {
                        const due = toDate(payment.occurred_at);
                        const title =
                            payment.description ||
                            payment.loan?.name ||
                            payment.category?.name ||
                            "Payment";

                        return (
                            <li
                                key={payment.id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-light-hover px-3 py-2 dark:bg-dark-hover"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-adaptive-primary">
                                        {title}
                                    </p>
                                    {payment.loan ? (
                                        <p className="truncate text-xs text-amber-700 dark:text-amber-200">
                                            Loan · {payment.loan.name}
                                        </p>
                                    ) : (
                                        payment.category && (
                                            <span className="mt-0.5 flex items-center gap-1">
                                                <span
                                                    className="h-2 w-2 flex-shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            payment.category.color ?? "#8FA3A6",
                                                    }}
                                                    aria-hidden="true"
                                                />
                                                <span className="truncate text-xs text-adaptive-muted">
                                                    {payment.category.name}
                                                </span>
                                            </span>
                                        )
                                    )}
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className="text-sm font-semibold text-adaptive-primary">
                                        {formatCurrency(payment.amount, payment.currency ?? "PHP")}
                                    </p>
                                    {due && (
                                        <p className="text-xs text-adaptive-muted">
                                            {format(due, "MMM d")}
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </WidgetFrame>
    );
}
