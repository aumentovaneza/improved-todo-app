/**
 * Steps may set `mobileTarget` and/or `mobilePlacement` to override the
 * desktop selector / placement when the viewport is below the lg breakpoint.
 * The OnboardingTour component picks the right one at mount time.
 */
export const onboardingSteps = [
    {
        target: "body",
        placement: "center",
        title: "Welcome to Wevie 👋",
        content:
            "Take a quick tour of the main features. You can skip at any time.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="logo-dashboard"]',
        mobileTarget: '[data-tour="mobile-nav-dashboard"]',
        title: "Dashboard",
        content:
            "Your daily overview. On mobile, tap the Dashboard tab at the bottom.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="nav-tasks"]',
        mobileTarget: '[data-tour="mobile-nav-tasks"]',
        title: "Tasks",
        content:
            "Create tasks with subtasks, tags, reminders, recurrence, and start/end times.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="nav-categories"]',
        title: "Categories",
        content:
            "Group your tasks by topic — Work, Personal, Health — and color-code them.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-workspaces"]',
        title: "Workspaces & Boards",
        content: "Plan visually with kanban-style boards inside shared workspaces.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-calendar"]',
        title: "Calendar",
        content:
            "See your tasks and events laid out across days, weeks, and months.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-analytics"]',
        title: "Analytics",
        content:
            "Track your productivity — completion rates, weekly patterns, and trends.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-weviewallet"]',
        mobileTarget: '[data-tour="mobile-nav-weviewallet"]',
        title: "WevieWallet",
        content:
            "Track accounts, budgets, savings goals, and transactions — all in one place.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="user-menu"]',
        mobileTarget: '[data-tour="mobile-user-menu"]',
        title: "Replay this tour anytime",
        content:
            'Open the menu and click "Replay tour" to see this walkthrough again.',
        placement: "top",
        mobilePlacement: "top",
    },
    {
        target: "body",
        placement: "center",
        title: "You're all set 🎉",
        content:
            "Have fun exploring. You can always replay this tour from your profile menu.",
    },
];

export const walletDashboardSteps = [
    {
        target: "body",
        placement: "center",
        title: "Welcome to WevieWallet",
        content:
            "This is your finance hub — accounts, budgets, savings goals, loans, and transactions all live here.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="wallet-selector"]',
        title: "Switch wallets",
        content:
            "If you collaborate on shared wallets, switch between yours and shared ones from this menu.",
        placement: "bottom",
    },
    {
        target: "body",
        placement: "center",
        title: "Net summary",
        content:
            "Scroll the page for income, expenses, savings, and net cash flow over the selected period.",
    },
    {
        target: "body",
        placement: "center",
        title: "Manage everything from one page",
        content:
            "Add transactions, budgets, savings goals, loans, and accounts via the action buttons in each section.",
    },
    {
        target: "body",
        placement: "center",
        title: "WevieWallet Management",
        content:
            "Need to set up accounts or categories? Open the user menu → Profile, or visit WevieWallet Management for the full editor.",
    },
];

export const walletTransactionsSteps = [
    {
        target: "body",
        placement: "center",
        title: "Adding transactions",
        content:
            "This page is where you log every income, expense, transfer, savings deposit, and loan payment.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="transactions-filters"]',
        title: "Narrow the list",
        content:
            "Filter by type, category, account, or date range to find specific transactions quickly.",
        placement: "bottom",
    },
    {
        target: '[data-tour="transactions-form"]',
        title: "Fill in the details",
        content:
            "Pick a type, amount, account, and category. Optional fields cover transfers, recurrence, and tags.",
        placement: "top",
    },
    {
        target: "body",
        placement: "center",
        title: "Tip",
        content:
            "Use recurring transactions for things like rent or salary so they auto-populate each period.",
    },
];

export const walletManagementSteps = [
    {
        target: "body",
        placement: "center",
        title: "WevieWallet management",
        content:
            "Manage the building blocks of your wallet — Accounts and Categories — in one place.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="management-tabs"]',
        title: "Two tabs",
        content:
            "Switch between Accounts (banks, e-wallets, credit cards) and Categories (income/expense buckets).",
        placement: "bottom",
    },
    {
        target: '[data-tour="management-content"]',
        title: "Add or edit",
        content:
            "Create new entries, edit existing ones, or remove items you no longer need from this section.",
        placement: "top",
    },
];

export const tasksSteps = [
    {
        target: "body",
        placement: "center",
        title: "Tasks",
        content:
            "Capture every to-do here — short ones, long ones, recurring ones. The list is sorted by date and time.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="tasks-create"]',
        title: "Create a task",
        content:
            "Click New task to open the form. You can set a date, time range, category, tags, subtasks, reminders, and recurrence.",
        placement: "bottom",
    },
    {
        target: '[data-tour="tasks-filters"]',
        title: "Find what you need",
        content:
            "Search by keyword, or filter by status, priority, category, or tag.",
        placement: "bottom",
    },
    {
        target: "body",
        placement: "center",
        title: "Tip",
        content:
            "Mark a task as recurring (daily/weekly/monthly) and Wevie will auto-reset it for the next occurrence after you complete it.",
    },
];

export const categoriesSteps = [
    {
        target: "body",
        placement: "center",
        title: "Categories",
        content:
            "Group tasks into buckets like Work, Personal, or Health. Each category gets a color you can use to spot tasks at a glance.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="categories-create"]',
        title: "Add a category",
        content:
            "Click New Category to create one. Give it a name, color, and an optional description.",
        placement: "bottom",
    },
    {
        target: '[data-tour="categories-list"]',
        title: "Edit anytime",
        content:
            "Click the pencil to rename or recolor a category, or the trash to remove it. The eye icon shows all tasks in that category.",
        placement: "top",
    },
];

export const workspacesSteps = [
    {
        target: "body",
        placement: "center",
        title: "Workspaces",
        content:
            "Workspaces hold kanban-style Boards. Use them for projects with multiple stages — like sprints, content calendars, or team plans.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="workspaces-create"]',
        title: "Create a workspace",
        content:
            "Each workspace can contain multiple boards, and you can invite collaborators per workspace.",
        placement: "bottom",
    },
    {
        target: '[data-tour="workspaces-list"]',
        title: "Open a workspace",
        content:
            "Click any card to enter the workspace. Inside, you'll add boards, swimlanes, and tasks.",
        placement: "top",
    },
];

export const walletBudgetsSteps = [
    {
        target: "body",
        placement: "center",
        title: "Budgets",
        content:
            "Set monthly or custom-period budgets for spending categories so WevieWallet can warn you before you overshoot.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="budgets-create"]',
        title: "Create a budget",
        content:
            "Pick a category, an amount, and a period. Mark it recurring to auto-renew each month.",
        placement: "bottom",
    },
    {
        target: '[data-tour="budgets-filters"]',
        title: "Filter the view",
        content:
            "Narrow by category, period, or active/inactive to find the budget you want to review.",
        placement: "bottom",
    },
    {
        target: '[data-tour="budgets-list"]',
        title: "Track spend",
        content:
            "Each budget shows progress against the period total. Click in to see the underlying transactions.",
        placement: "top",
    },
];

export const walletSavingsGoalsSteps = [
    {
        target: "body",
        placement: "center",
        title: "Savings goals",
        content:
            "Save toward something specific — a trip, an emergency fund, a new laptop. Track progress and convert to a budget when you're ready.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="goals-create"]',
        title: "Create a goal",
        content:
            "Give it a name, target amount, and target date. Optional: link an account so deposits update automatically.",
        placement: "bottom",
    },
    {
        target: '[data-tour="goals-filters"]',
        title: "Filter & sort",
        content:
            "Filter by status or account to see only the goals you care about right now.",
        placement: "bottom",
    },
    {
        target: '[data-tour="goals-list"]',
        title: "Add deposits",
        content:
            "Use the Transactions page with type 'savings' to log a deposit, or convert the goal into a budget once funded.",
        placement: "top",
    },
];

export const walletLoansSteps = [
    {
        target: "body",
        placement: "center",
        title: "Loans",
        content:
            "Track both money you owe and money owed to you. Loans capture principal, interest, and a repayment schedule.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="loans-create"]',
        title: "Add a loan",
        content:
            "Set the loan type (borrowed or lent), counterparty, amount, rate, and term. Leave fields blank if you don't have all the details.",
        placement: "bottom",
    },
    {
        target: '[data-tour="loans-filters"]',
        title: "Filter the list",
        content:
            "Filter by loan type, status, or counterparty to find a specific loan quickly.",
        placement: "bottom",
    },
    {
        target: '[data-tour="loans-list"]',
        title: "Log payments",
        content:
            "Use the Transactions page with type 'loan' to log a repayment — it'll update the loan balance automatically.",
        placement: "top",
    },
];

export const addTaskFormSteps = [
    {
        target: "body",
        placement: "center",
        title: "Add a task",
        content:
            "Capture anything you need to get done. Only the title is required — fill in the rest if it helps.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="task-title"]',
        title: "Title",
        content:
            "A short summary, e.g. \"Pay electricity bill\" or \"Send draft to manager\".",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="task-category"]',
        title: "Category",
        content:
            "Drop the task into a bucket so you can filter and color-code later. Optional.",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="task-priority"]',
        title: "Priority",
        content:
            'Use Focus for "do this today" tasks. Lower priorities surface less aggressively.',
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="task-submit"]',
        title: "Save it",
        content:
            "You can always edit dates, times, subtasks, reminders, and tags from the task itself afterward.",
        placement: "top",
    },
];

export const calendarSteps = [
    {
        target: "body",
        placement: "center",
        title: "Calendar",
        content:
            "See every task and finance event laid out by date. Tasks with start/end times show up where they fall.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="calendar-header"]',
        title: "Browse months",
        content:
            "Use the chevrons to step through months, or hit Today to jump back to the current date.",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="calendar-grid"]',
        title: "Click a day",
        content:
            "Click any day to see all tasks and transactions on that date, or to add a new task scheduled there.",
        placement: "top",
    },
];

export const addTransactionFormSteps = [
    {
        target: "body",
        placement: "center",
        title: "Log your first transaction",
        content:
            "Every entry needs a description, a type, and an amount. The other fields are optional.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="txn-description"]',
        title: "Description",
        content:
            "A short label so you'll recognize this entry later — e.g. 'Coffee', 'Paycheck', or 'Rent'.",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="txn-type"]',
        title: "Type",
        content:
            "Income, expense, savings, loan, or transfer. The form adjusts based on what you pick.",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="txn-amount"]',
        title: "Amount",
        content:
            "Always positive — Wevie figures out the sign based on the type you picked above.",
        placement: "bottom",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="txn-submit"]',
        title: "Save it",
        content:
            "Hit Save transaction and it'll show up in your list. You can edit or delete it later from the Transactions page.",
        placement: "top",
    },
];

export const walletAccountsSteps = [
    {
        target: "body",
        placement: "center",
        title: "Accounts",
        content:
            "Bank accounts, e-wallets, and credit cards live here. Every transaction is tied to one of these accounts.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="accounts-list"]',
        title: "Manage accounts",
        content:
            "Add new accounts, edit balances, or remove ones you no longer use. Open WevieWallet Management for the full editor with categories.",
        placement: "top",
    },
];
