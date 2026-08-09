import { useState } from "react";
import { User } from "lucide-react";

/**
 * Renders a user's customizable avatar.
 *
 * `avatar` shape (from the shared `auth.avatar` prop / store item preview):
 *   { base_url: string | null, initials: string }
 *
 * The component is built as an absolutely-positioned layer stack so future
 * phases can composite background → base → frame → hat over the same square.
 * Phase 1 renders only the base image, with a token-coloured initials / lucide
 * `User` fallback when no base asset is available yet.
 */
const SIZES = {
    sm: { box: "h-8 w-8", text: "text-xs", icon: "h-4 w-4" },
    md: { box: "h-12 w-12", text: "text-base", icon: "h-6 w-6" },
    lg: { box: "h-20 w-20 sm:h-24 sm:w-24", text: "text-2xl", icon: "h-12 w-12" },
};

export default function Avatar({ avatar, size = "md", className = "" }) {
    const dims = SIZES[size] ?? SIZES.md;
    const baseUrl = avatar?.base_url ?? null;
    const initials = avatar?.initials ?? "";

    // Fall back to initials when the art file is missing (404) — base_url can be
    // a valid URL that points at not-yet-committed art. Track the URL that failed
    // so equipping a different avatar retries instead of staying hidden.
    const [failedUrl, setFailedUrl] = useState(null);
    const showImage = baseUrl && failedUrl !== baseUrl;

    return (
        <div
            className={`relative flex-shrink-0 overflow-hidden rounded-full ${dims.box} ${className}`}
        >
            {showImage ? (
                /* Base layer — future accessory layers stack on top of this. */
                <img
                    key={baseUrl}
                    src={baseUrl}
                    alt=""
                    draggable={false}
                    onError={() => setFailedUrl(baseUrl)}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200">
                    {initials ? (
                        <span className={`font-semibold uppercase ${dims.text}`}>
                            {initials}
                        </span>
                    ) : (
                        <User className={dims.icon} aria-hidden="true" />
                    )}
                </div>
            )}
        </div>
    );
}
