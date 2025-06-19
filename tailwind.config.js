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
                // Light mode palette (Sky Blue & Soft Pastels)
                primary: {
                    50: '#F0F9FF',
                    100: '#E0F2FE',
                    200: '#BAE6FD',
                    300: '#7DD3FC',
                    400: '#38BDF8',
                    500: '#60A5FA',
                    600: '#3B82F6',
                    700: '#2563EB',
                    800: '#1D4ED8',
                    900: '#1E40AF',
                },
                secondary: {
                    50: '#FDF2F8',
                    100: '#FCE7F3',
                    200: '#FBCFE8',
                    300: '#F9A8D4',
                    400: '#F472B6',
                    500: '#EC4899',
                    600: '#DB2777',
                    700: '#BE185D',
                    800: '#9D174D',
                    900: '#831843',
                },
                accent: {
                    50: '#F5F3FF',
                    100: '#EDE9FE',
                    200: '#DDD6FE',
                    300: '#C4B5FD',
                    400: '#A78BFA',
                    500: '#8B5CF6',
                    600: '#7C3AED',
                    700: '#6D28D9',
                    800: '#5B21B6',
                    900: '#4C1D95',
                },
                // Light theme specific colors
                light: {
                    bg: {
                        primary: '#FDFDFD',
                        secondary: '#F9FAFB',
                        card: '#F9FAFB',
                        hover: '#F1F5F9',
                    },
                    text: {
                        primary: '#334155',
                        secondary: '#64748B',
                        muted: '#94A3B8',
                    }
                },
                dark: {
                    bg: {
                        primary: '#121212',
                        secondary: '#1E1E2F',
                        card: '#2D2D44',
                        hover: '#363650',
                    },
                    text: {
                        primary: '#FFFFFF',
                        secondary: '#E0E0E0',
                        muted: '#B0B0B0',
                    }
                }
            },
            backgroundColor: {
                // Light theme backgrounds
                'light-primary': '#FDFDFD',
                'light-secondary': '#F9FAFB',
                'light-card': '#F9FAFB',
                'light-hover': '#F1F5F9',
                // Dark theme backgrounds
                'dark-primary': '#121212',
                'dark-secondary': '#1E1E2F',
                'dark-card': '#2D2D44',
                'dark-hover': '#363650',
            },
            textColor: {
                // Light theme text colors
                'light-primary': '#334155',
                'light-secondary': '#64748B',
                'light-muted': '#94A3B8',
                // Dark theme text colors
                'dark-primary': '#FFFFFF',
                'dark-secondary': '#E0E0E0',
                'dark-muted': '#B0B0B0',
            },
            borderColor: {
                // Light theme borders
                'light-border': '#E2E8F0',
                'light-border-light': '#F1F5F9',
                // Dark theme borders
                'dark-border': '#404040',
                'dark-border-light': '#505050',
            }
        },
    },

    plugins: [forms],
};
