/**
 * Centralized currency formatting for WevieWallet.
 *
 * Previously this helper was copy-pasted into ~14 files. Import from here
 * instead so every amount renders identically (en-PH / PHP by default).
 */
export const formatCurrency = (value, currency = "PHP", options = {}) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency || "PHP",
        maximumFractionDigits: 2,
        ...options,
    }).format(value ?? 0);

/**
 * Whole-peso variant used by the KPI cards and charts (no decimals).
 */
export const formatWholeCurrency = (value, currency = "PHP") =>
    formatCurrency(value, currency, { maximumFractionDigits: 0 });

/**
 * Compact variant (e.g. ₱1.2M) for tight spaces like chart axes or chips.
 */
export const formatCompactCurrency = (value, currency = "PHP") =>
    formatCurrency(value, currency, {
        notation: "compact",
        maximumFractionDigits: 1,
    });
