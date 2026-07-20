import { PiggyBank, Sparkles, Target, Users, Wallet } from "lucide-react";

/**
 * Slides for the WevieWallet first-run welcome carousel. WevieWallet is a
 * distinct entity within the app, so it gets its own value-prop intro before
 * the wallet dashboard tour — separate from the app-wide welcome.
 */
export const walletWelcomeSlides = [
    {
        icon: Wallet,
        title: "Meet WevieWallet 💰",
        body: "Your money, right next to your tasks. Track income, spending, savings, budgets, and loans — no separate app, no spreadsheets. It works just as fully on your phone as on desktop.",
    },
    {
        icon: PiggyBank,
        title: "Know where it goes",
        body: "See your net worth and every number at a glance, then switch the time range — this month, last month, or year to date — and the summary and charts update instantly.",
    },
    {
        icon: Target,
        title: "Plan ahead with confidence",
        body: "Set budgets and savings goals, track loans you owe or are owed, and stay ahead of recurring bills before they hit. Reach each one from the WevieWallet menu in the sidebar.",
    },
    {
        icon: Users,
        title: "Share a wallet",
        body: "Invite a partner or family to a shared wallet and manage money together — while your personal wallet stays private.",
    },
    {
        icon: Sparkles,
        title: "Ready to explore?",
        body: "Take a quick tour of your WevieWallet dashboard and see how it all fits together.",
        isFinal: true,
    },
];
