import { useState } from "react";
import Wheel from "@uiw/react-color-wheel";
import ShadeSlider from "@uiw/react-color-shade-slider";
import { Ban } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tiny local hex <-> HSVA conversion                                  */
/*                                                                     */
/* The @uiw wheel/shade-slider work in HSVA space, but TipTap stores   */
/* colors as hex strings. The conversion helpers only ship from the    */
/* umbrella `@uiw/color-convert` package, so — to avoid pulling in an   */
/* extra (transitive) dependency — we keep a small, verified pair of    */
/* converters here. HSVA is `{ h: 0-360, s: 0-100, v: 0-100, a: 0-1 }`. */
/* ------------------------------------------------------------------ */

// Full brightness by default so the wheel produces a visible color immediately.
// (Starting at v:0 = black meant dragging the wheel — which only sets hue/
// saturation and keeps v — stayed black until the brightness slider was moved.)
const DEFAULT_HSVA = { h: 0, s: 0, v: 100, a: 1 };

// Accepts #RGB, #RRGGBB or #RRGGBBAA (with or without the leading #).
function isValidHex(hex) {
    return /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex.trim());
}

function hexToHsva(hex) {
    let value = hex.trim().replace(/^#/, "");
    if (value.length === 3) {
        value = value
            .split("")
            .map((c) => c + c)
            .join("");
    }
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = (max / 255) * 100;
    return { h, s, v, a };
}

function hsvaToHex({ h, s, v }) {
    const sat = s / 100;
    const val = v / 100;
    const c = val * sat;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;
    if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0];
    else if (hh < 2) [r, g, b] = [x, c, 0];
    else if (hh < 3) [r, g, b] = [0, c, x];
    else if (hh < 4) [r, g, b] = [0, x, c];
    else if (hh < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = val - c;
    const toHex = (n) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/* ------------------------------------------------------------------ */
/* ColorWheelPicker                                                    */
/*                                                                     */
/* Presentational, self-contained color picker: a hue/saturation wheel */
/* + a brightness slider + a hex field + quick-pick presets + a        */
/* remove/default action. It keeps its OWN HSVA state (seeded from      */
/* `value` on mount) so dragging the wheel never re-seeds from the      */
/* editor mid-gesture — the popover unmounts on close, so each open     */
/* re-seeds from the current selection. `onChange` fires the resolved   */
/* hex on every wheel/slider/hex/preset interaction.                    */
/* ------------------------------------------------------------------ */

export default function ColorWheelPicker({
    value = null,
    onChange,
    presets = [],
    onRemove,
    removeLabel = "Remove color",
}) {
    const [hsva, setHsva] = useState(() => (value ? hexToHsva(value) : DEFAULT_HSVA));
    const [hexText, setHexText] = useState(() => (value ? value.toUpperCase() : ""));

    const currentHex = hsvaToHex(hsva);

    const applyHsva = (nextHsva) => {
        setHsva(nextHsva);
        const hex = hsvaToHex(nextHsva);
        setHexText(hex);
        onChange?.(hex);
    };

    const handleHexInput = (raw) => {
        setHexText(raw);
        if (isValidHex(raw)) {
            const normalized = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
            const nextHsva = hexToHsva(normalized);
            setHsva(nextHsva);
            onChange?.(hsvaToHex(nextHsva));
        }
    };

    return (
        <div className="w-64 max-w-[calc(100vw-2rem)] space-y-3">
            {/* The wheel/slider aren't focusable, so pressing them moves focus to
                <body>; Headless UI reads that focus-out and closes the popover
                mid-drag. Suppressing the mousedown default keeps focus in place —
                the widgets drive themselves via pointer events, so this is safe. */}
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
                className="flex justify-center"
                onMouseDown={(e) => e.preventDefault()}
            >
                <Wheel
                    color={hsva}
                    width={200}
                    height={200}
                    onChange={(color) => applyHsva({ ...hsva, ...color.hsva })}
                />
            </div>

            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div onMouseDown={(e) => e.preventDefault()}>
                <ShadeSlider
                    hsva={hsva}
                    radius={6}
                    style={{ width: "100%" }}
                    onChange={(newShade) => applyHsva({ ...hsva, ...newShade })}
                />
            </div>

            <div className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-lg border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: currentHex }}
                />
                <div className="flex-1">
                    <label htmlFor="journal-color-hex" className="sr-only">
                        Hex color
                    </label>
                    <input
                        id="journal-color-hex"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={hexText}
                        onChange={(e) => handleHexInput(e.target.value)}
                        placeholder="#RRGGBB"
                        className="w-full rounded-lg border border-light-border bg-light-primary px-3 py-1.5 text-sm uppercase tracking-wide text-light-primary placeholder:text-light-muted focus:border-wevie-teal focus:outline-none focus:ring-1 focus:ring-wevie-teal dark:border-dark-border dark:bg-dark-primary dark:text-dark-primary dark:placeholder:text-dark-muted"
                    />
                </div>
            </div>

            {presets.length > 0 && (
                <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Quick color presets"
                >
                    {presets.map(({ name, color }) => {
                        const selected = currentHex === color.toUpperCase();
                        return (
                            <button
                                key={color}
                                type="button"
                                aria-label={name}
                                aria-pressed={selected}
                                onClick={() => applyHsva(hexToHsva(color))}
                                style={{ backgroundColor: color }}
                                className={`h-7 w-7 rounded-md border border-black/10 transition focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 dark:border-white/10 ${
                                    selected
                                        ? "ring-2 ring-wevie-teal ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card"
                                        : ""
                                }`}
                            />
                        );
                    })}
                </div>
            )}

            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-light-border/70 px-2 py-1.5 text-xs font-medium text-light-secondary transition-colors hover:bg-light-hover hover:text-light-primary focus:outline-none focus:ring-2 focus:ring-wevie-teal/40 dark:border-dark-border/70 dark:text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-dark-primary"
                >
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                    {removeLabel}
                </button>
            )}
        </div>
    );
}
