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
} from "lucide-react";

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome to TodoApp - Organize Your Life" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Navigation */}
                <nav className="relative px-6 py-4">
                    <div className="mx-auto max-w-7xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CheckSquare className="h-8 w-8 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                TodoApp
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href={route("login")}
                                        className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-blue-400"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="px-6 py-20">
                    <div className="mx-auto max-w-7xl text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Organize Your Life with
                            <span className="text-blue-600 block">
                                Smart Task Management
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
                            Stay productive and never miss a deadline. TodoApp
                            helps you manage tasks, collaborate with teams, and
                            track your progress with powerful features designed
                            for modern productivity.
                        </p>

                        {!auth.user && (
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
                                >
                                    Start Free Today
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link
                                    href={route("login")}
                                    className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors duration-200 text-lg dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
                                >
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-6 py-20 bg-white dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Everything You Need to Stay Organized
                            </h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Powerful features designed to help you manage
                                tasks efficiently and boost your productivity.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                                    <CheckSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Smart Task Management
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Create, organize, and prioritize tasks with
                                    subtasks, due dates, and custom categories.
                                    Drag and drop to reorder your priorities.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
                                    <FolderOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Custom Categories
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Organize tasks with color-coded categories.
                                    Create custom workflows that match your
                                    personal or business needs.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Due Date Tracking
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Never miss a deadline with smart due date
                                    tracking, overdue alerts, and calendar
                                    integration for better planning.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-6">
                                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Progress Analytics
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Track your productivity with detailed
                                    analytics, completion rates, and insights to
                                    optimize your workflow.
                                </p>
                            </div>

                            {/* Feature 5 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-6">
                                    <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Team Collaboration
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Share tasks and collaborate with team
                                    members. Assign tasks, track progress, and
                                    stay synchronized with your team.
                                </p>
                            </div>

                            {/* Feature 6 */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-6">
                                    <Zap className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Lightning Fast
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Built for speed with instant updates,
                                    real-time synchronization, and a responsive
                                    interface that works on all devices.
                                </p>
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
                                their productivity with TodoApp.
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
                                    TodoApp
                                </span>
                            </div>

                            <div className="text-gray-400 text-center md:text-right">
                                <p>&copy; 2024 TodoApp. All rights reserved.</p>
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
