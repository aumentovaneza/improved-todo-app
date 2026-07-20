/**
 * Responsive data table: a real table on `lg` and up, stacked cards below so
 * small screens never depend on horizontal scrolling.
 *
 *   columns  = [{ key, header, render?(row), align?: "right", className?, cellClassName? }]
 *   rows     = array of records
 *   renderCard(row) = the mobile card for a row
 *   emptyState = node rendered when there are no rows
 */
export default function ResponsiveTable({
    columns = [],
    rows = [],
    keyField = "id",
    renderCard,
    emptyState = null,
    className = "",
}) {
    if (!rows || rows.length === 0) {
        return emptyState;
    }

    return (
        <>
            <div
                className={`hidden overflow-hidden rounded-xl border border-light-border/70 dark:border-dark-border/70 lg:block ${className}`}
            >
                <table className="min-w-full divide-y divide-light-border/70 dark:divide-dark-border/70">
                    <thead className="bg-light-hover/60 dark:bg-dark-hover/40">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-light-muted dark:text-dark-muted ${
                                        col.align === "right" ? "text-right" : "text-left"
                                    } ${col.className ?? ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
                        {rows.map((row) => (
                            <tr
                                key={row[keyField]}
                                className="hover:bg-light-hover/40 dark:hover:bg-dark-hover/30"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 text-sm text-light-secondary dark:text-dark-secondary ${
                                            col.align === "right" ? "text-right" : "text-left"
                                        } ${col.cellClassName ?? ""}`}
                                    >
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-3 lg:hidden">
                {rows.map((row) => (
                    <div key={row[keyField]}>{renderCard?.(row)}</div>
                ))}
            </div>
        </>
    );
}
