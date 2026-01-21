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
    safelist: [
        {
            pattern: /(bg|text|stroke|fill)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(100|200|300|400|500|600|700|800|900)/,
        },
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                wevie: {
                    teal: '#6FD9D3',
                    mint: '#7FE0B2',
                    bg: '#F7FAFA',
                    surface: '#FFFFFF',
                    border: '#DDE6E8',
                    text: {
                        primary: '#1F2F33',
                        secondary: '#5F777C',
                        muted: '#8FA3A6',
                    },
                    dark: {
                        bg: '#1F2F33',
                        surface: '#243A3F',
                        border: '#2F4A50',
                        text: {
                            primary: '#E6F2F3',
                            secondary: '#B7D1D6',
                            muted: '#9FB6BB',
                        },
                    },
                    success: '#7FE0B2',
                    warning: '#F4D06F',
                    info: '#6FD9D3',
                },
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
                        primary: '#F7FAFA',
                        secondary: '#FFFFFF',
                        card: '#FFFFFF',
                        hover: '#EEF5F6',
                    },
                    text: {
                        primary: '#1F2F33',
                        secondary: '#5F777C',
                        muted: '#8FA3A6',
                    }
                },
                // Dark theme specific colors
                dark: {
                    bg: {
                        primary: '#1F2F33',
                        secondary: '#243A3F',
                        card: '#22353A',
                        hover: '#2A4247',
                    },
                    text: {
                        primary: '#E6F2F3',
                        secondary: '#B7D1D6',
                        muted: '#9FB6BB',
                    }
                }
            },
            backgroundColor: {
                // Light theme backgrounds
                'light-primary': '#F7FAFA',
                'light-secondary': '#FFFFFF',
                'light-card': '#FFFFFF',
                'light-hover': '#EEF5F6',
                // Dark theme backgrounds
                'dark-primary': '#1F2F33',
                'dark-secondary': '#243A3F',
                'dark-card': '#22353A',
                'dark-hover': '#2A4247',
            },
            textColor: {
                // Light theme text colors
                'light-primary': '#1F2F33',
                'light-secondary': '#5F777C',
                'light-muted': '#8FA3A6',
                // Dark theme text colors
                'dark-primary': '#E6F2F3',
                'dark-secondary': '#B7D1D6',
                'dark-muted': '#9FB6BB',
            },
            borderColor: {
                // Light theme borders
                'light-border': '#DDE6E8',
                'light-border-light': '#EEF5F6',
                // Dark theme borders
                'dark-border': '#2F4A50',
                'dark-border-light': '#243A3F',
            },
            boxShadow: {
                soft: '0 4px 12px rgba(0, 0, 0, 0.06)',
            },
        },
    },

    plugins: [forms],
};
