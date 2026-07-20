/**
 * Shared, presentation-layer helpers for WevieWallet.
 *
 * These derive values from the Inertia props the Finance controllers already
 * return — they do NOT hold server state (rule #2: server state = Inertia props).
 */

/**
 * Badge tone per transaction type. Replaces the `typeStyles` object that was
 * duplicated across the transaction lists. Maps to <Badge tone="...">.
 */
export const TRANSACTION_TONE = {
    income: "success",
    expense: "danger",
    savings: "purple",
    loan: "warning",
    transfer: "info",
};

/**
 * Human-friendly label per transaction type.
 */
export const TRANSACTION_LABEL = {
    income: "Income",
    expense: "Expense",
    savings: "Savings",
    loan: "Loan",
    transfer: "Transfer",
};

/**
 * Sign prefix for an amount, given its transaction type. Income/loan add funds,
 * expenses remove them; savings/transfers are neutral movements.
 */
export const transactionAmountPrefix = (type) => {
    if (type === "income" || type === "loan") return "+";
    if (type === "expense") return "-";
    return "";
};

/**
 * Estimated net worth derived from accounts + loans.
 *
 *   assets       = sum of non-credit-card balances
 *   liabilities  = credit-card used_credit + outstanding loan balances
 *   net worth    = assets - liabilities
 */
export const computeNetWorth = (accounts = [], loans = []) => {
    const assets = (accounts || []).reduce((sum, account) => {
        if (account?.type === "credit-card") return sum;
        return sum + Number(account?.current_balance ?? 0);
    }, 0);

    const cardDebt = (accounts || []).reduce((sum, account) => {
        if (account?.type !== "credit-card") return sum;
        return sum + Number(account?.used_credit ?? 0);
    }, 0);

    const loanDebt = (loans || []).reduce(
        (sum, loan) => sum + Number(loan?.remaining_amount ?? 0),
        0
    );

    return assets - cardDebt - loanDebt;
};

/**
 * Budget progress (0-100, capped) from spent vs. total.
 */
export const budgetProgress = (spent, total) => {
    const spentNum = Number(spent ?? 0);
    const totalNum = Number(total ?? 0);
    if (totalNum <= 0) return 0;
    return Math.min(100, Math.round((spentNum / totalNum) * 100));
};
