import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

// Advisory config: rules are mostly "warn" so the existing codebase does not
// break CI. Tighten to "error" over time as the code is cleaned up.
export default [
    {
        ignores: [
            "public/**",
            "vendor/**",
            "node_modules/**",
            "bootstrap/ssr/**",
            "storage/**",
            "resources/js/offline/**",
        ],
    },
    js.configs.recommended,
    {
        files: ["resources/js/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.es2024,
                route: "readonly", // Ziggy global
            },
        },
        plugins: {
            react,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,
            // Plain JSX project, no PropTypes / no new JSX transform import needed
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            // Advisory phase: demote every rule that currently fails on the
            // existing codebase from "error" to "warn" so `npm run lint` does
            // not fail CI. Promote back to "error" as each is cleaned up.
            "no-unused-vars": "warn",
            "no-case-declarations": "warn",
            "react/no-unescaped-entities": "warn",
            "react/no-unknown-property": "warn",
            "react-hooks/rules-of-hooks": "warn",
            "jsx-a11y/label-has-associated-control": "warn",
            "jsx-a11y/no-autofocus": "warn",
            "jsx-a11y/no-noninteractive-element-interactions": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",
            "jsx-a11y/click-events-have-key-events": "warn",
        },
    },
    prettier,
];
