import ApplicationLogo from "@/Components/ApplicationLogo";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    CheckSquare,
    Calendar,
    Users,
    BarChart3,
    Zap,
    Smartphone,
    ArrowRight,
    CheckCircle,
    Clock,
    Brain,
    Timer,
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
    X,
    Mail,
    Lock,
    EyeOff,
    User,
    Wallet,
    Kanban,
    BookOpen,
    Repeat,
    Tag,
    Sparkles,
    LayoutDashboard,
    WifiOff,
} from "lucide-react";

// Login Modal Component
function LoginModal({ isOpen, onClose, status, canResetPassword, openRegisterModal }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
            onSuccess: () => onClose(),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl transition-all">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <CheckSquare className="h-10 w-10 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Welcome Back
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Sign in to your Wevie account
                        </p>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                {status}
                            </p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your email"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData("remember", e.target.checked)}
                                    className="h-4 w-4 text-primary-400 focus:ring-primary-400 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label
                                    htmlFor="remember"
                                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Remember me
                                </label>
                            </div>

                            {canResetPassword && (
                                <Link
                                    href={route("password.request")}
                                    className="text-sm text-primary-400 hover:text-primary-500 dark:text-[#2ED7A1] dark:hover:text-primary-300 font-medium"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                        >
                            {processing ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Don't have an account?{" "}
                            <button
                                onClick={() => {
                                    onClose();
                                    openRegisterModal();
                                }}
                                className="font-medium text-primary-400 hover:text-primary-500 dark:text-[#2ED7A1] dark:hover:text-primary-300"
                            >
                                Sign up for free
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Register Modal Component
function RegisterModal({ isOpen, onClose, openLoginModal }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        invite_code: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
            onSuccess: () => onClose(),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-2xl transition-all">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <CheckSquare className="h-10 w-10 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Join Wevie
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Create your account to get started
                        </p>
                    </div>

                    {/* Register Form */}
                    <form onSubmit={submit} className="space-y-6">
                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="register-email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your email"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="register-password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label
                                htmlFor="password_confirmation"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData("password_confirmation", e.target.value)
                                    }
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </div>

                        {/* Invite Code Field */}
                        <div>
                            <label
                                htmlFor="invite_code"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Invite Code
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Users className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="invite_code"
                                    type="text"
                                    name="invite_code"
                                    value={data.invite_code}
                                    onChange={(e) => setData("invite_code", e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your invite code"
                                    required
                                />
                            </div>
                            {errors.invite_code && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                    {errors.invite_code}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                You need a valid invite code to register during the testing phase.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                        >
                            {processing ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Already have an account?{" "}
                            <button
                                onClick={() => {
                                    onClose();
                                    openLoginModal();
                                }}
                                className="font-medium text-primary-400 hover:text-primary-500 dark:text-[#2ED7A1] dark:hover:text-primary-300"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Welcome({ auth, status, canResetPassword }) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);
    const openRegisterModal = () => setIsRegisterModalOpen(true);
    const closeRegisterModal = () => setIsRegisterModalOpen(false);

    return (
        <>
            <Head title="Welcome to Wevie - Tasks, Boards, Finance & More in One App" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Navigation */}
                <nav className="relative px-4 sm:px-6 py-4">
                    <div className="mx-auto max-w-7xl flex items-center justify-between">
                        <div className="flex items-center">
                            <ApplicationLogo className="h-8 w-auto sm:h-10" />
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-primary-400 text-white font-semibold rounded-lg hover:bg-primary-500 transition-colors duration-200 text-sm sm:text-base dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                                >
                                    <span className="hidden sm:inline">Go to </span>
                                    Dashboard
                                    <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                </Link>
                            ) : (
                                <div className="flex items-center space-x-2 sm:space-x-4">
                                    <button
                                        onClick={openLoginModal}
                                        className="text-gray-700 hover:text-primary-400 font-medium transition-colors duration-200 dark:text-gray-300 dark:hover:text-[#2ED7A1] text-sm sm:text-base"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={openRegisterModal}
                                        className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 bg-primary-400 text-white font-semibold rounded-lg hover:bg-primary-500 transition-colors duration-200 text-sm sm:text-base dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                                    >
                                        Get Started
                                        <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20">
                    <div className="mx-auto max-w-7xl text-center">
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                            Your Whole Life,
                            <span className="text-primary-400 block dark:text-[#2ED7A1]">
                                Organized in One Place
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
                            Wevie brings tasks, Kanban boards, calendar, focus timers, personal
                            finance, and journaling together in one app — with AI assistance to help
                            you plan your day and manage your money. Productivity and peace of mind,
                            all in one place.
                        </p>

                        {!auth.user && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                                <button
                                    onClick={openRegisterModal}
                                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-primary-400 text-white font-semibold rounded-lg hover:bg-primary-500 transition-colors duration-200 text-base sm:text-lg w-full sm:w-auto justify-center dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                                >
                                    Start Free Today
                                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                    onClick={openLoginModal}
                                    className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-primary-400 hover:text-primary-400 transition-colors duration-200 text-base sm:text-lg dark:border-gray-600 dark:text-gray-300 dark:hover:border-[#2ED7A1] dark:hover:text-[#2ED7A1] w-full sm:w-auto justify-center"
                                >
                                    Sign In
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="px-4 sm:px-6 py-12 sm:py-20 bg-white dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-12 sm:mb-16">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                                Everything You Need, All in One App
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
                                From daily to-dos to your monthly budget — Wevie replaces a handful
                                of separate apps with one connected workspace.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {/* Tasks */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 dark:text-[#2ED7A1]" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Smart Task Management
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Tasks with subtasks, priorities, statuses, and start/end times.
                                    Drag to reorder, tick off in a click — and your notes stay
                                    encrypted at rest.
                                </p>
                            </div>

                            {/* Recurring & Reminders */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Recurring Tasks & Reminders
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Set daily, weekly, monthly, or yearly recurrence and schedule
                                    reminders so nothing slips — from rent day to the weekly
                                    stand-up.
                                </p>
                            </div>

                            {/* Categories & Tags */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Categories & Tags
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Organize work your way with color-coded categories and reusable
                                    tags, then filter to focus on exactly what matters right now.
                                </p>
                            </div>

                            {/* Boards */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Kanban className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Kanban Boards & Workspaces
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Plan visually with boards, columns, and swimlanes. Drag tasks
                                    across stages and invite collaborators to shared team boards.
                                </p>
                            </div>

                            {/* Calendar */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 dark:bg-sky-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600 dark:text-sky-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Calendar + Google Sync
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    See tasks and finances together in month, week, or day views,
                                    and connect Google Calendar to bring your events into one place.
                                </p>
                            </div>

                            {/* WevieWallet — flagship */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    WevieWallet — Personal Finance
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Track accounts, income and expenses, budgets, savings goals, and
                                    loans. Share wallets, generate reports, and export to Excel.
                                </p>
                            </div>

                            {/* Journal */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600 dark:text-rose-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Journal & Mood Tracking
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Keep dated journal entries, tag them, and log how you feel from
                                    17 moods — then export your reflections whenever you like.
                                </p>
                            </div>

                            {/* Analytics */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Productivity Analytics
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Understand how you work with completion trends, category and
                                    status breakdowns, and your most productive day of the week.
                                </p>
                            </div>

                            {/* Pomodoro & Focus */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Pomodoro & Focus Mode
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Start a focus timer from anywhere in the app, or drop into a
                                    distraction-free Focus Mode to get deep work done.
                                </p>
                            </div>

                            {/* Dashboard */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Customizable Dashboard
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Build your own home screen from drag-and-drop, resizable widgets
                                    — tasks, budgets, calendar, Pomodoro and more — saved to your
                                    layout.
                                </p>
                            </div>

                            {/* PWA / Offline */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                    <WifiOff className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 dark:text-slate-300" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    Works Offline (PWA)
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Install Wevie like a native app and keep going even without a
                                    connection — it's a progressive web app with offline support.
                                </p>
                            </div>

                            {/* AI Assistant (Pro) */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-200 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center justify-between mb-4 sm:mb-6">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                        PRO
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                    AI Assistant
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Get an AI daily briefing, spending-insights coaching for your
                                    finances, and type tasks in plain English to have them filled in
                                    for you.
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
                                What We're Building Next
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
                                We're just getting started. Here's what's on the way — ADHD-focused
                                tools, gamification, and a native mobile app to make Wevie even
                                better.
                            </p>
                        </div>

                        {/* Next Up */}
                        <div className="mb-16">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                🚀 On the Roadmap
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {/* Gamification */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Gamification System
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Earn XP, unlock badges, build progress streaks, and take on
                                        challenges to make productivity fun and engaging.
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
                                        Snap a photo of a handwritten list or a whiteboard and turn
                                        it into actionable tasks — building on today's plain-text AI
                                        capture.
                                    </p>
                                </div>

                                {/* Native Mobile App */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-primary-200 dark:border-primary-800 hover:border-primary-400 dark:hover:border-primary-600">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                                        <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                        Native Mobile App
                                    </h4>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                        Wevie already installs as an offline PWA today — dedicated
                                        iOS and Android apps with push notifications are next.
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
                                        Non-intrusive, customizable task nudges that respect your
                                        workflow and mental state.
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
                                        Full-screen single-task view to eliminate distractions and
                                        maintain focus.
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
                                        Split large tasks into smaller, actionable steps for easier
                                        completion.
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
                                        Time remaining and countdown clocks with visual progress
                                        indicators.
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
                                        Easy tasks view to boost motivation when energy is low.
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
                                        Motivational messages and visual feedback to celebrate
                                        progress.
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
                                        Group tasks by mental load or energy needed for optimal
                                        scheduling.
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
                                        Reset the current day with grace and start fresh without
                                        judgment.
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
                                Make It Yours
                            </h3>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                                Build a dashboard from drag-and-drop widgets, switch between light
                                and dark mode, and set your timezone and preferences. Your
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
                                How Far We've Come — and Where We're Headed
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
                                Wevie has grown from a simple to-do list into a full productivity
                                and finance suite. Here's what we've shipped so far and what's
                                coming next.
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
                                                    Shipped · 2024–2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Core Foundation
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Tasks, subtasks & priorities
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Categories, tags & reminders
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Recurring tasks & due dates
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Analytics dashboard & calendar
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Dark mode & responsive design
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 2 - Shipped */}
                                <div className="relative flex items-center sm:flex-row-reverse">
                                    <div className="absolute left-0 sm:left-1/2 transform sm:-translate-x-1/2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="ml-12 sm:ml-0 sm:w-1/2 sm:pl-8">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">
                                                    ✅ COMPLETED
                                                </span>
                                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                    Shipped · 2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Boards, Focus & Finance
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Kanban boards & workspaces
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Pomodoro & Focus Mode
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    WevieWallet finance module
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Journal & Google Calendar sync
                                                </li>
                                                <li className="flex items-center">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Widget dashboard & offline PWA
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 3 - Shipped */}
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
                                                    Shipped · 2026
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                AI Assistant (Pro)
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Sparkles className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    AI daily summary & briefing
                                                </li>
                                                <li className="flex items-center">
                                                    <Sparkles className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    AI spending-insights coach
                                                </li>
                                                <li className="flex items-center">
                                                    <Sparkles className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Natural-language task capture
                                                </li>
                                                <li className="flex items-center">
                                                    <Sparkles className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    Provider-agnostic & Pro-gated
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 4 - Now / Next */}
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
                                                    Now → Next
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Smarter Planning
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Lightbulb className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Smart daily planner
                                                </li>
                                                <li className="flex items-center">
                                                    <Camera className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Snapshot-to-task (OCR)
                                                </li>
                                                <li className="flex items-center">
                                                    <Sparkles className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                                                    Deeper AI assistance
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 5 - Planned */}
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
                                                    Later
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                ADHD-Focused Suite
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Heart className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Gentle reminder system
                                                </li>
                                                <li className="flex items-center">
                                                    <Focus className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    One-focus mode
                                                </li>
                                                <li className="flex items-center">
                                                    <Layers className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Microtask breakdown
                                                </li>
                                                <li className="flex items-center">
                                                    <Battery className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    Energy-based batching
                                                </li>
                                                <li className="flex items-center">
                                                    <RotateCcw className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                                                    "Restart my day" button
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 6 - Future */}
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
                                                    Later
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                Gamification & Mobile
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Award className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    XP & badge system
                                                </li>
                                                <li className="flex items-center">
                                                    <Star className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Progress streaks & challenges
                                                </li>
                                                <li className="flex items-center">
                                                    <Smartphone className="h-4 w-4 text-pink-500 mr-2 flex-shrink-0" />
                                                    Native iOS & Android apps
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
                                <h3 className="text-2xl font-bold mb-4">Be Part of the Journey</h3>
                                <p className="text-lg mb-6 text-white/90">
                                    Join our early adopters and help shape the future of
                                    productivity. Your feedback drives our development priorities.
                                </p>
                                {!auth.user && (
                                    <button
                                        onClick={openRegisterModal}
                                        className="inline-flex items-center px-8 py-4 bg-white text-primary-400 font-semibold rounded-lg hover:bg-primary-50 transition-colors duration-200 text-lg dark:text-[#2ED7A1] dark:hover:bg-primary-900/20"
                                    >
                                        Start Your Journey
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 py-20 bg-primary-400 dark:bg-[#2ED7A1]">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">
                                One App, Built to Do It All
                            </h2>
                            <p className="text-xl text-white/90 max-w-2xl mx-auto">
                                Everything you need to plan your days and manage your money — no
                                more juggling half a dozen apps.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">7+</div>
                                <div className="text-white/90">Integrated Modules</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">3</div>
                                <div className="text-white/90">AI-Powered Assistants</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">100%</div>
                                <div className="text-white/90">Offline-Ready PWA</div>
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
                                Start managing your tasks more efficiently today. No credit card
                                required.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <button
                                    onClick={openRegisterModal}
                                    className="inline-flex items-center px-8 py-4 bg-primary-400 text-white font-semibold rounded-lg hover:bg-primary-500 transition-colors duration-200 text-lg dark:bg-[#2ED7A1] dark:hover:bg-primary-400"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                                <button
                                    onClick={openLoginModal}
                                    className="text-primary-400 hover:text-primary-500 font-medium transition-colors duration-200 dark:text-[#2ED7A1] dark:hover:text-primary-300"
                                >
                                    Already have an account? Sign in
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="bg-gray-900 text-white px-6 py-12">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center mb-4 md:mb-0">
                                <ApplicationLogo className="h-10 w-auto" />
                            </div>

                            <div className="text-gray-400 text-center md:text-right">
                                <p>&copy; 2026 Wevie. All rights reserved.</p>
                                <p className="text-sm mt-1">Built with Laravel & React</p>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Login Modal */}
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={closeLoginModal}
                    status={status}
                    canResetPassword={canResetPassword}
                    openRegisterModal={openRegisterModal}
                />

                {/* Register Modal */}
                <RegisterModal
                    isOpen={isRegisterModalOpen}
                    onClose={closeRegisterModal}
                    openLoginModal={openLoginModal}
                />
            </div>
        </>
    );
}
