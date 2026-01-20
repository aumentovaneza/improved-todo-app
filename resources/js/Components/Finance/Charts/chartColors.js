const tremorPalette = [
    { name: "slate", hex: "#64748B" },
    { name: "gray", hex: "#6B7280" },
    { name: "zinc", hex: "#71717A" },
    { name: "neutral", hex: "#737373" },
    { name: "stone", hex: "#78716C" },
    { name: "red", hex: "#EF4444" },
    { name: "orange", hex: "#F97316" },
    { name: "amber", hex: "#F59E0B" },
    { name: "yellow", hex: "#EAB308" },
    { name: "lime", hex: "#84CC16" },
    { name: "green", hex: "#22C55E" },
    { name: "emerald", hex: "#10B981" },
    { name: "teal", hex: "#14B8A6" },
    { name: "cyan", hex: "#06B6D4" },
    { name: "sky", hex: "#0EA5E9" },
    { name: "blue", hex: "#3B82F6" },
    { name: "indigo", hex: "#6366F1" },
    { name: "violet", hex: "#8B5CF6" },
    { name: "purple", hex: "#A855F7" },
    { name: "fuchsia", hex: "#D946EF" },
    { name: "pink", hex: "#EC4899" },
    { name: "rose", hex: "#F43F5E" },
];

const hexToRgb = (hex) => {
    if (!hex || typeof hex !== "string") return null;
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return null;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
};

export const getNearestTremorColorName = (hex, fallback = "slate") => {
    const rgb = hexToRgb(hex);
    if (!rgb) return fallback;
    let closest = tremorPalette[0];
    let minDistance = Infinity;
    tremorPalette.forEach((candidate) => {
        const candidateRgb = hexToRgb(candidate.hex);
        if (!candidateRgb) return;
        const distance =
            (rgb.r - candidateRgb.r) ** 2 +
            (rgb.g - candidateRgb.g) ** 2 +
            (rgb.b - candidateRgb.b) ** 2;
        if (distance < minDistance) {
            minDistance = distance;
            closest = candidate;
        }
    });
    return closest.name ?? fallback;
};

export const getTremorColorsFromHex = (hexColors, fallback = "slate") =>
    (hexColors || []).map((hex) => getNearestTremorColorName(hex, fallback));
