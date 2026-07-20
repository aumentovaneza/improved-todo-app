/**
 * Steps may set `mobileTarget` and/or `mobilePlacement` to override the
 * desktop selector / placement when the viewport is below the lg breakpoint.
 * The OnboardingTour component picks the right one at mount time.
 */
export const onboardingSteps = [
    {
        target: "body",
        placement: "center",
        emoji: "👋",
        title: "Welcome to Wevie",
        content:
            "In 60 seconds we'll show you how Wevie keeps your day and your money in one calm place. Tap Next to begin — or skip anytime.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="logo-dashboard"]',
        mobileTarget: '[data-tour="mobile-nav-dashboard"]',
        emoji: "🏠",
        title: "Your day, at a glance",
        content:
            "The Dashboard greets you with what's due today, what's overdue, and what's coming up — so you always know your next move. On mobile, it's the Home tab.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="nav-tasks"]',
        mobileTarget: '[data-tour="mobile-nav-tasks"]',
        emoji: "✅",
        title: "Never drop a task again",
        content:
            "Capture everything — with subtasks, tags, reminders, and recurring schedules. Wevie resurfaces each task at the right time so nothing slips.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="nav-categories"]',
        emoji: "🎨",
        title: "Bring order with color",
        content:
            "Group tasks into Work, Personal, or Health and give each a color. One glance and you know what kind of day you're looking at.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-workspaces"]',
        emoji: "🗂️",
        title: "Plan bigger, together",
        content:
            "Workspaces hold kanban-style boards for projects and sprints. Drag tasks between stages and invite collaborators to plan as a team.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-calendar"]',
        emoji: "📅",
        title: "See your whole week",
        content:
            "Your tasks and finance events, laid out by day, week, and month. Spot a packed day before it packs you.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-analytics"]',
        emoji: "📈",
        title: "Watch your progress add up",
        content:
            "Completion rates, weekly patterns, and trends turn your effort into momentum you can actually see.",
        placement: "right",
        mobilePlacement: "center",
        mobileTarget: "body",
    },
    {
        target: '[data-tour="nav-weviewallet"]',
        mobileTarget: '[data-tour="mobile-nav-weviewallet"]',
        emoji: "💸",
        title: "Money that stays in check",
        content:
            "WevieWallet tracks accounts, budgets, savings goals, and loans right beside your tasks — so you know what's coming before it hits.",
        placement: "right",
        mobilePlacement: "top",
    },
    {
        target: '[data-tour="user-menu"]',
        mobileTarget: '[data-tour="mobile-user-menu"]',
        emoji: "🔁",
        title: "Replay this tour anytime",
        content:
            'Lost the thread? Open this menu and hit "Replay tour" to walk through it again whenever you like.',
        placement: "top",
        mobilePlacement: "top",
    },
    {
        target: "body",
        placement: "center",
        emoji: "🎉",
        title: "You're all set!",
        content:
            "That's Wevie. Add your first task, log a transaction, and watch your Getting Started checklist fill up. Have fun!",
    },
];

export const walletDashboardSteps = [
    {
        target: "body",
        placement: "center",
        emoji: "💰",
        title: "Welcome to WevieWallet",
        content:
            "This dashboard is your money at a glance — a quick tour of what's on this page. It takes 30 seconds.",
        disableBeacon: true,
    },
    {
        target: '[data-tour="wallet-selector"]',
        mobileTarget: "body",
        mobilePlacement: "center",
        emoji: "🔀",
        title: "Switch wallets",
        content:
            "Collaborating on a shared wallet? Flip between your own and shared wallets here — the whole dashboard updates instantly, no page reload.",
        placement: "bottom",
    },
    {
        target: '[data-tour="wallet-range"]',
        mobileTarget: "body",
        mobilePlacement: "center",
        emoji: "🗓️",
        title: "Pick your time range",
        content:
            "This month, last month, the last 3 months, or year to date — your summary and charts update to match whatever window you choose.",
        placement: "bottom",
    },
    {
        target: '[data-tour="wallet-summary"]',
        mobileTarget: "body",
        mobilePlacement: "center",
        emoji: "📊",
        title: "Your numbers, up top",
        content:
            "Net worth, income, spending, savings, and more — all in one row. Tap any card with an arrow to drill into the details.",
        placement: "bottom",
    },
    {
        target: '[data-tour="wallet-charts"]',
        mobileTarget: "body",
        mobilePlacement: "center",
        emoji: "📈",
        title: "See where it goes",
        content:
            "Income vs. expense and a by-category breakdown make trends jump out. Hover any bar or slice for the exact amount.",
        placement: "top",
    },
    {
        target: '[data-tour="wallet-actions"]',
        mobileTarget: "body",
        mobilePlacement: "center",
        emoji: "⚡",
        title: "Add things right here",
        content:
            "Log a transaction or set up a budget, savings goal, or loan without leaving the dashboard — updates appear instantly. Find the full Transactions, Budgets, Loans, and Accounts pages in the WevieWallet menu in the sidebar. Enjoy!",
        placement: "bottom",
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
