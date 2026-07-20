import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

export default function ExportDataForm({ className = "" }) {
    const [wallet, setWallet] = useState({ start_date: "", end_date: "" });
    const [journal, setJournal] = useState({ start_date: "", end_date: "" });

    // Ziggy omits params that are undefined/null, so blank dates → export everything.
    const buildParams = ({ start_date, end_date }) => ({
        start_date: start_date || undefined,
        end_date: end_date || undefined,
    });

    const download = (routeName, range) => {
        window.location.assign(route(routeName, buildParams(range)));
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Export Your Data
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Download a copy of your data to keep or use elsewhere. Leave
                    the dates blank to export everything.
                </p>
            </header>

            {/* WevieWallet → Excel */}
            <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-wevie-teal" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        WevieWallet (Excel)
                    </h3>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Accounts, transactions, budgets, savings goals and loans, as
                    a multi-tab spreadsheet. The date range filters transactions.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="wallet_start" value="Start date" />
                        <TextInput
                            id="wallet_start"
                            type="date"
                            className="mt-1 block w-full"
                            value={wallet.start_date}
                            max={wallet.end_date || undefined}
                            onChange={(e) =>
                                setWallet((prev) => ({
                                    ...prev,
                                    start_date: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="wallet_end" value="End date" />
                        <TextInput
                            id="wallet_end"
                            type="date"
                            className="mt-1 block w-full"
                            value={wallet.end_date}
                            min={wallet.start_date || undefined}
                            onChange={(e) =>
                                setWallet((prev) => ({
                                    ...prev,
                                    end_date: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <PrimaryButton
                    type="button"
                    className="mt-4"
                    onClick={() => download("weviewallet.export.excel", wallet)}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                </PrimaryButton>
            </div>

            {/* Journals → Word */}
            <div className="rounded-xl border border-light-border/70 p-4 dark:border-dark-border/70">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-wevie-teal" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Journals (Word)
                    </h3>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    All your journal entries in one Word document, ordered by
                    date. The date range filters by entry date.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="journal_start" value="Start date" />
                        <TextInput
                            id="journal_start"
                            type="date"
                            className="mt-1 block w-full"
                            value={journal.start_date}
                            max={journal.end_date || undefined}
                            onChange={(e) =>
                                setJournal((prev) => ({
                                    ...prev,
                                    start_date: e.target.value,
                                }))
                            }
                        />
                    </div>
                    <div>
                        <InputLabel htmlFor="journal_end" value="End date" />
                        <TextInput
                            id="journal_end"
                            type="date"
                            className="mt-1 block w-full"
                            value={journal.end_date}
                            min={journal.start_date || undefined}
                            onChange={(e) =>
                                setJournal((prev) => ({
                                    ...prev,
                                    end_date: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                <PrimaryButton
                    type="button"
                    className="mt-4"
                    onClick={() => download("journal.export", journal)}
                >
                    <Download className="mr-2 h-4 w-4" />
                    Download Word
                </PrimaryButton>
            </div>
        </section>
    );
}
