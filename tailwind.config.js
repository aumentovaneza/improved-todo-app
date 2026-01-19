import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Wevie Light Mode Primary: #4ACF91 (Green)
                primary: {
                    50: '#E6F9F2',
                    100: '#CCF3E5',
                    200: '#99E7CB',
                    300: '#66DBB1',
                    400: '#4ACF91', // Main primary color
                    500: '#3DA373',
                    600: '#2F7A56',
                    700: '#1F5239',
                    800: '#0F291D',
                    900: '#08140E',
                },
                // Wevie Light Mode Secondary: #5FDDE0 (Cyan)
                secondary: {
                    50: '#E6F9FA',
                    100: '#CCF3F5',
                    200: '#99E7EB',
                    300: '#66DBE1',
                    400: '#5FDDE0', // Main secondary color
                    500: '#4CB0B3',
                    600: '#398386',
                    700: '#265659',
                    800: '#13292C',
                    900: '#0A1516',
                },
                // Wevie Light Mode Neutral Dark: #2B2F36
                neutral: {
                    50: '#F9FAFB', // Neutral Light
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#2B2F36', // Neutral Dark
                    900: '#1F2937',
                },
                // Error colors
                error: {
                    50: '#FEF2F2',
                    100: '#FEE2E2',
                    200: '#FECACA',
                    300: '#FCA5A5',
                    400: '#F87171',
                    500: '#F56565', // Light mode error
                    600: '#DC2626',
                    700: '#B91C1C',
                    800: '#991B1B',
                    900: '#7F1D1D',
                },
                // Success colors
                success: {
                    50: '#F0FDF4',
                    100: '#DCFCE7',
                    200: '#BBF7D0',
                    300: '#86EFAC',
                    400: '#4ADE80', // Dark mode success
                    500: '#48BB78', // Light mode success
                    600: '#16A34A',
                    700: '#15803D',
                    800: '#166534',
                    900: '#14532D',
                },
                // Warning colors
                warning: {
                    50: '#FEFCE8',
                    100: '#FEF9C3',
                    200: '#FEF08A',
                    300: '#FDE047',
                    400: '#FACC15', // Dark mode warning
                    500: '#ECC94B', // Light mode warning
                    600: '#CA8A04',
                    700: '#A16207',
                    800: '#854D0E',
                    900: '#713F12',
                },
                // Light theme specific colors
                light: {
                    bg: {
                        primary: '#F9FAFB', // Neutral Light
                        secondary: '#FFFFFF',
                        card: '#FFFFFF',
                        hover: '#F3F4F6',
                    },
                    text: {
                        primary: '#2B2F36', // Neutral Dark
                        secondary: '#4B5563',
                        muted: '#6B7280',
                    }
                },
                // Dark theme specific colors
                dark: {
                    bg: {
                        primary: '#1E2024', // Neutral Light (dark mode)
                        secondary: '#25282E',
                        card: '#2A2D33',
                        hover: '#32353B',
                    },
                    text: {
                        primary: '#E2E6EB', // Neutral Dark (dark mode)
                        secondary: '#C4C9D0',
                        muted: '#9CA3AF',
                    }
                }
            },
            backgroundColor: {
                // Light theme backgrounds
                'light-primary': '#F9FAFB',
                'light-secondary': '#FFFFFF',
                'light-card': '#FFFFFF',
                'light-hover': '#F3F4F6',
                // Dark theme backgrounds
                'dark-primary': '#1E2024',
                'dark-secondary': '#25282E',
                'dark-card': '#2A2D33',
                'dark-hover': '#32353B',
            },
            textColor: {
                // Light theme text colors
                'light-primary': '#2B2F36',
                'light-secondary': '#4B5563',
                'light-muted': '#6B7280',
                // Dark theme text colors
                'dark-primary': '#E2E6EB',
                'dark-secondary': '#C4C9D0',
                'dark-muted': '#9CA3AF',
            },
            borderColor: {
                // Light theme borders
                'light-border': '#E5E7EB',
                'light-border-light': '#F3F4F6',
                // Dark theme borders
                'dark-border': '#3A3D44',
                'dark-border-light': '#2A2D33',
            }
        },
    },

    plugins: [forms],
};
