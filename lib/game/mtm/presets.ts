import type { Config } from "./types";

// The standalone game exposed three independent checkboxes (showEstimate,
// hardMode, expertMode), which give five reachable combinations with no
// natural ordering -- so "how hard was that hand?" had no clear answer.
//
// These four named presets replace them with a single choice forming a strict
// ladder, so a result is comparable against another run at the same setting.
export type MtmPreset = "training" | "normal" | "hard" | "expert";

export const MTM_PRESET_ORDER: readonly MtmPreset[] = ["training", "normal", "hard", "expert"];

export interface MtmPresetInfo {
    label: string;
    blurb: string;
    config: Config;
}

export const MTM_PRESETS: Record<MtmPreset, MtmPresetInfo> = {
    training: {
        label: "Training",
        blurb: "Your running fair-value estimate is printed for you. Learn the shape of the game.",
        config: { showEstimate: true, hardMode: false, expertMode: false },
    },
    normal: {
        label: "Normal",
        blurb: "No estimate. You price the deck yourself, but you can see your position and P&L.",
        config: { showEstimate: false, hardMode: false, expertMode: false },
    },
    hard: {
        label: "Hard",
        blurb: "Trade blind: position, cash and P&L stay dark until settlement.",
        config: { showEstimate: false, hardMode: true, expertMode: false },
    },
    expert: {
        label: "Expert",
        blurb: "Blind, and the makers run tighter, copy the screen harder and read your flow faster.",
        // hardMode is on here too, so the four presets form a strict ladder:
        // Expert is Hard plus sharper makers, rather than a sideways variant.
        config: { showEstimate: false, hardMode: true, expertMode: true },
    },
};

export function isMtmPreset(value: unknown): value is MtmPreset {
    return typeof value === "string" && value in MTM_PRESETS;
}

export function configFor(preset: MtmPreset): Config {
    return MTM_PRESETS[preset].config;
}
