import ApplicationLogo from "@/Components/ApplicationLogo";
import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
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
    X,
    Mail,
    Lock,
    EyeOff,
    User,
} from "lucide-react";

// Login Modal Component
function LoginModal({
    isOpen,
    onClose,
    status,
    canResetPassword,
    openRegisterModal,
}) {
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
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
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
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
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
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
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
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-[#2ED7A1] dark:focus:border-[#2ED7A1] transition-colors"
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
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
                                    onChange={(e) =>
                                        setData("invite_code", e.target.value)
                                    }
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
                                You need a valid invite code to register during
                                the testing phase.
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
            <Head title="Welcome to Wevie - A Smart, ADHD-Friendly To-Do App" />
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
                                    <span className="hidden sm:inline">
                                        Go to{" "}
                                    </span>
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
                            Organize Your Life with
                            <span className="text-primary-400 block dark:text-[#2ED7A1]">
                                Smart Task Management
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
                            Stay productive and never miss a deadline. Wevie
                            helps you manage tasks, collaborate with teams, and
                            track your progress with powerful features designed
                            for modern productivity.
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
                                    <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400 dark:text-[#2ED7A1]" />
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
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 hover:shadow-xl transition-all duration-200 border border-primary-200 dark:border-primary-800 hover:border-primary-400 dark:hover:border-primary-600">
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
                                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                                            <div className="flex items-center mb-3">
                                                <span className="bg-primary-400 text-white px-3 py-1 rounded-full text-sm font-medium mr-3 dark:bg-[#2ED7A1]">
                                                    🚧 IN PROGRESS
                                                </span>
                                                <span className="text-sm text-primary-400 dark:text-[#2ED7A1] font-medium">
                                                    Phase 2 - Q1 2025
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                                AI & Productivity Boost
                                            </h3>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0 dark:text-[#2ED7A1]" />
                                                    AI Productivity Coach
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0 dark:text-[#2ED7A1]" />
                                                    Pomodoro Timer Integration
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0 dark:text-[#2ED7A1]" />
                                                    Advanced Analytics &
                                                    Insights
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0 dark:text-[#2ED7A1]" />
                                                    Smart Daily Planner
                                                </li>
                                                <li className="flex items-center">
                                                    <Timer className="h-4 w-4 text-primary-400 mr-2 flex-shrink-0 dark:text-[#2ED7A1]" />
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
                                <p className="text-lg mb-6 text-white/90">
                                    Join our early adopters and help shape the
                                    future of productivity. Your feedback drives
                                    our development priorities.
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
                                Trusted by Productive People
                            </h2>
                            <p className="text-xl text-white/90 max-w-2xl mx-auto">
                                Join thousands of users who have transformed
                                their productivity with Wevie.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    10,000+
                                </div>
                                <div className="text-white/90">
                                    Tasks Completed Daily
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    99.9%
                                </div>
                                <div className="text-white/90">
                                    Uptime Reliability
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-white mb-2">
                                    5,000+
                                </div>
                                <div className="text-white/90">Happy Users</div>
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
                                <p>
                                    &copy; 2024 Wevie. All rights reserved.
                                </p>
                                <p className="text-sm mt-1">
                                    Built with Laravel & React
                                </p>
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
