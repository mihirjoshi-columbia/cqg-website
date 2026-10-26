import { HOMEWORK_CONTRACTS } from "./library";
import type { Contract } from "./contracts";
import type { DdConfig } from "./types";

// There is exactly one mode: the graded homework run.
//
// It deliberately has no practice sandbox. The run is the assignment, and the
// deal is fixed so everyone faces the same seven contracts. A student gets a
// few attempts and is ranked on the best, but each attempt is spent when it
// is DEALT, so no one can re-roll until they like the deal. How many attempts
// is a property of the contest row, not of this preset.
//
// A difficulty ladder would make results incomparable, which is the problem
// lib/game/mtm/presets.ts describes.

export type DdPreset = "homework";

export const DD_PRESET_ORDER: readonly DdPreset[] = ["homework"];

export interface DdPresetInfo {
    label: string;
    blurb: string;
    config: DdConfig;
}

export const DD_PRESETS: Record<DdPreset, DdPresetInfo> = {
    homework: {
        label: "Week 3 homework",
        blurb: "Everyone is dealt the same seven contracts, so the ranking is skill, not luck. Best attempt counts.",
        config: {
            informedShare: 0.25,
            informedNoise: 0.6,
            widthTolerance: 1.3,
            flowPerStage: 12,
            positionLimit: 8,
            secondsPerQuote: 90,
        },
    },
};

export function isDdPreset(value: unknown): value is DdPreset {
    return value === "homework";
}

/** There is one contract set, so this takes no preset. */
export function contractsFor(): Contract[] {
    return HOMEWORK_CONTRACTS;
}

export function configFor(preset: DdPreset): DdConfig {
    return DD_PRESETS[preset].config;
}
