import { Head, Link } from "@inertiajs/react";
import {
    CheckSquare,
    Calendar,
    Target,
    Users,
    BarChart3,
    Zap,
    Shield,
    Smartphone,
    ArrowRight,
    CheckCircle,
    Clock,
    FolderOpen,
    Brain,
    Timer,
    TrendingUp,
    Award,
    Camera,
    Lightbulb,
    Settings,
    Heart,
    Focus,
    Layers,
    Eye,
    Battery,
    Smile,
    RotateCcw,
    Star,
    MapPin,
    Rocket,
} from "lucide-react";

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome to FocusFlow - A Smart, ADHD-Friendly To-Do App" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Navigation */}
                <nav className="relative px-4 sm:px-6 py-4">
                    <div className="mx-auto max-w-7xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CheckSquare className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                FocusFlow
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                                >
                                    <span className="hidden sm:inline">
                                        Go to{" "}
                                    </span>
                                    Dashboard
                                    <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                    <Link
                                        href={route("login")}
                                        className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400 text-sm sm:text-base"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
                                    >
                                        Get Started
                                        <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20">
                    <div className="mx-auto max-w-7xl text-center">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Organize Your Life with
                            <span className="text-blue-600 block">
                                Smart Task Management
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
                            Stay productive and never miss a deadline. FocusFlow
                            helps you manage tasks, collaborate with teams, and
                            track your progress with powerful features designed
                            for modern productivity.
                        </p>

                        {!auth.user && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-base sm:text-lg w-full sm:w-auto justify-center"
                                >
                                    Start Free Today
                                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                </Link>
                                <Link
                                    href={route("login")}
                                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors duration-200 text-base sm:text-lg dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400 w-full sm:w-auto justify-center"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-12 sm:mb-16">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Everything You Need to Stay Organized
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
                                Powerful features designed to help you manage
                                tasks efficiently and boost your productivity.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Smart Task Management
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Create, organize, and prioritize tasks with
                                    subtasks, due dates, and custom categories.
                                    Drag and drop to reorder your priorities.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Custom Categories
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Organize tasks with color-coded categories.
                                    Create custom workflows that match your
                                    personal or business needs.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Due Date Tracking
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Never miss a deadline with smart due date
                                    tracking, overdue alerts, and calendar
                                    integration for better planning.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Progress Analytics
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Track your productivity with detailed
                                    analytics, completion rates, and insights to
                                    optimize your workflow.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Team Collaboration
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Share tasks and collaborate with team
                                    members. Assign tasks, track progress, and
                                    stay synchronized with your team.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Lightning Fast
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Built for speed with instant updates,
                                    real-time synchronization, and a responsive
                                    interface that works on all devices.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Future Features Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-12 sm:mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium mb-4">
                                <Rocket className="h-4 w-4 mr-2" />
                                Coming Soon
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Revolutionary Productivity Features
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
                                We're building the future of task management
                                with AI-powered insights, ADHD-focused features,
                                and gamification to transform how you work.
                            </p>
                        </div>

                        {/* AI & Productivity Enhancements */}
                        <div className="mb-16">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                🔥 AI-Powered Productivity Enhancements
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {/* AI Productivity Coach */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        AI Productivity Coach
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        GPT-powered suggestions, smart
                                        summaries, and personalized nudges to
                                        optimize your workflow and boost
                                        productivity.
                                    </p>
                                </div>

                                {/* Pomodoro Integration */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Pomodoro Integration
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Built-in timer per task with session
                                        logging, break reminders, and
                                        productivity tracking for focused work
                                        sessions.
                                    </p>
                                </div>

                                {/* Advanced Analytics */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Advanced Analytics
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Weekly stats, productivity graphs, trend
                                        analysis, and insights to understand
                                        your work patterns and optimize
                                        performance.
                                    </p>
                                </div>

                                {/* Gamification */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Gamification System
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Earn XP, unlock badges, build progress
                                        streaks, and compete with friends to
                                        make productivity fun and engaging.
                                    </p>
                                </div>

                                {/* OCR Task Creation */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Snapshot-to-Task (OCR)
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Extract tasks from photos or handwritten
                                        notes using advanced OCR technology.
                                        Turn any list into actionable tasks
                                        instantly.
                                    </p>
                                </div>

                                {/* Smart Daily Planner */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Smart Daily Planner
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        AI-recommended daily schedule based on
                                        priorities, deadlines, and your
                                        productivity patterns for optimal time
                                        management.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ADHD-Focused Features */}
                        <div className="mb-16">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                🧠 ADHD-Focused Functionality
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                {/* Gentle Reminders */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mb-4">
                                        <Heart className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Gentle Reminders
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Non-intrusive, customizable task nudges
                                        that respect your workflow and mental
                                        state.
                                    </p>
                                </div>

                                {/* One Focus Mode */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                                        <Focus className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        One Focus Mode
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Full-screen single-task view to
                                        eliminate distractions and maintain
                                        focus.
                                    </p>
                                </div>

                                {/* Microtask Breakdown */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                                        <Layers className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Microtask Breakdown
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Split large tasks into smaller,
                                        actionable steps for easier completion.
                                    </p>
                                </div>

                                {/* Visual Time Estimator */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                                        <Eye className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Visual Time Estimator
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Time remaining and countdown clocks with
                                        visual progress indicators.
                                    </p>
                                </div>

                                {/* Low-Effort Wins */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                                        <Battery className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Low-Effort Wins
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Easy tasks view to boost motivation when
                                        energy is low.
                                    </p>
                                </div>

                                {/* Positive Reinforcement */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center mb-4">
                                        <Smile className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Positive Reinforcement
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Motivational messages and visual
                                        feedback to celebrate progress.
                                    </p>
                                </div>

                                {/* Energy-Based Batching */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-4">
                                        <Zap className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Energy-Based Batching
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Group tasks by mental load or energy
                                        needed for optimal scheduling.
                                    </p>
                                </div>

                                {/* Restart My Day */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl transition-all duration-200 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                                        <RotateCcw className="h-5 w-5 text-white" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        "Restart My Day" Button
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Reset the current day with grace and
                                        start fresh without judgment.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modular Features */}
                        <div className="text-center">
                            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium mb-6">
                                <Settings className="h-4 w-4 mr-2" />
                                Fully Customizable Experience
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Toggle Features On/Off
                            </h3>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Every feature is modular. Enable only what you
                                need - whether it's Pomodoro timers, analytics,
                                gamification, or ADHD-focused tools. Your
                                productivity, your way.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Roadmap Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-12 sm:mb-16">
                            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-medium mb-4">
                                <MapPin className="h-4 w-4 mr-2" />
                                Development Roadmap
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Our Journey to Productivity Excellence
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
                                Track our progress as we build the most
                                comprehensive and user-friendly task management
                                platform ever created.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-4 sm:left-1/2 transform sm:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

                            {/* Roadmap Items */}
                            <div className="space-y-8 sm:space-y-12">
                                {/* Phase 1 - Current */}
                                <div className="relative flex items-center">
                                    <div className="absolute left-0 sm:left-1/2 transform sm:-translate-x-1/2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-12 sm:ml-0 sm:w-1/2 sm:pr-8">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                                                    ✅ COMPLETED
                                                </span>
                                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                    Phase 1 - Q4 2024
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Core Foundation
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Task Management System
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Category Organization
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Due Date Tracking
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Dark Mode & Responsive
                                                    Design
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Basic Analytics Dashboard
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 2 - In Progress */}
                                <div className="relative flex items-center sm:flex-row-reverse">
                                    <div className="absolute left-0 sm:left-1/2 transform sm:-translate-x-1/2 w-8 h-8 bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-12 sm:ml-0 sm:w-1/2 sm:pl-8">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                                                    🚧 IN PROGRESS
                                                </span>
                                                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                    Phase 2 - Q1 2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                AI & Productivity Boost
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    AI Productivity Coach
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Pomodoro Timer Integration
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Advanced Analytics &
                                                    Insights
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Smart Daily Planner
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Snapshot-to-Task (OCR)
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 3 - Planned */}
                                <div className="relative flex items-center">
                                    <div className="absolute left-0 sm:left-1/2 transform sm:-translate-x-1/2 w-8 h-8 bg-purple-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                                        <Brain className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-12 sm:ml-0 sm:w-1/2 sm:pr-8">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                                                    📋 PLANNED
                                                </span>
                                                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                                    Phase 3 - Q2 2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                ADHD-Focused Features
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Heart className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Gentle Reminder System
                                                </li>
                                                <li className="flex items-center">
                                                    <Focus className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    One Focus Mode
                                                </li>
                                                <li className="flex items-center">
                                                    <Layers className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Microtask Breakdown
                                                </li>
                                                <li className="flex items-center">
                                                    <Battery className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Energy-Based Task Batching
                                                </li>
                                                <li className="flex items-center">
                                                    <RotateCcw className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    "Restart My Day" Feature
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 4 - Future */}
                                <div className="relative flex items-center sm:flex-row-reverse">
                                    <div className="absolute left-0 sm:left-1/2 transform sm:-translate-x-1/2 w-8 h-8 bg-pink-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                                        <Award className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-12 sm:ml-0 sm:w-1/2 sm:pl-8">
                                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                                                    🎯 FUTURE
                                                </span>
                                                <span className="text-sm text-pink-600 dark:text-pink-400 font-medium">
                                                    Phase 4 - Q3 2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Gamification & Social
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Award className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    XP & Badge System
                                                </li>
                                                <li className="flex items-center">
                                                    <Star className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Progress Streaks &
                                                    Challenges
                                                </li>
                                                <li className="flex items-center">
                                                    <Users className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Team Collaboration 2.0
                                                </li>
                                                <li className="flex items-center">
                                                    <Smartphone className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Mobile App Launch
                                                </li>
                                                <li className="flex items-center">
                                                    <Settings className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Full Feature Modularity
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Call to Action */}
                        <div className="mt-16 text-center">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                                <h3 className="text-2xl font-bold mb-4">
                                    Be Part of the Journey
                                </h3>
                                <p className="text-lg mb-6 text-blue-100">
                                    Join our early adopters and help shape the
                                    future of productivity. Your feedback drives
                                    our development priorities.
                                </p>
                                {!auth.user && (
                                    <Link
                                        href={route("register")}
                                        className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200 text-lg"
                                    >
                                        Start Your Journey
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 py-20 bg-blue-600">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">
                                Trusted by Productive People
                            </h2>
                            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                                Join thousands of users who have transformed
                                their productivity with FocusFlow.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    10,000+
                                </div>
                                <div className="text-blue-100">
                                    Tasks Completed Daily
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    99.9%
                                </div>
                                <div className="text-blue-100">
                                    Uptime Reliability
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    5,000+
                                </div>
                                <div className="text-blue-100">Happy Users</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                {!auth.user && (
                    <section className="px-6 py-20">
                        <div className="mx-auto max-w-4xl text-center">
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Ready to Get Organized?
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
                                Start managing your tasks more efficiently
                                today. No credit card required.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link
                                    href={route("login")}
                                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    Already have an account? Sign in
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="bg-gray-900 text-white px-6 py-12">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center space-x-2 mb-4 md:mb-0">
                                <CheckSquare className="h-8 w-8 text-blue-400" />
                                <span className="text-2xl font-bold">
                                    FocusFlow
                                </span>
                            </div>

                            <div className="text-gray-400 text-center md:text-right">
                                <p>
                                    &copy; 2024 FocusFlow. All rights reserved.
                                </p>
                                <p className="text-sm mt-1">
                                    Built with Laravel & React
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
