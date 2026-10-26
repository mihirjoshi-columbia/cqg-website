import { CONTRACT_SETS, type ContractSetName } from "./library";
import type { Contract } from "./contracts";
import type { DdConfig } from "./types";

// Difficulty is a single ladder rather than independent switches, for the
// reason lib/game/mtm/presets.ts gives: independent toggles make "how hard was
// that run?" unanswerable, and a leaderboard needs results to be comparable.

export type DdPreset = "practice" | "contest" | "midpoint";

export const DD_PRESET_ORDER: readonly DdPreset[] = ["practice", "contest", "midpoint"];

export interface DdPresetInfo {
    label: string;
    blurb: string;
    contractSet: ContractSetName;
    config: DdConfig;
    /** Practice shows the fair and SD after each contract; contests do not. */
    coaching: boolean;
}

export const DD_PRESETS: Record<DdPreset, DdPresetInfo> = {
    practice: {
        label: "Practice",
        blurb: "Unlimited runs. After each contract you are shown the true fair, the true SD and what the reveal should have done to them.",
        contractSet: "week3",
        coaching: true,
        config: {
            informedShare: 0.15,
            informedNoise: 0.9,
            widthTolerance: 1.3,
            flowPerStage: 12,
            positionLimit: 8,
            secondsPerQuote: 120,
        },
    },
    contest: {
        label: "Week 3 contest",
        blurb: "One attempt. Everyone is dealt the same seven contracts, so the ranking is skill, not luck.",
        contractSet: "week3",
        coaching: false,
        config: {
            informedShare: 0.25,
            informedNoise: 0.6,
            widthTolerance: 1.3,
            flowPerStage: 12,
            positionLimit: 8,
            secondsPerQuote: 90,
        },
    },
    midpoint: {
        label: "Midpoint evaluation",
        blurb: "One attempt, a tighter clock, sharper counterparties and two composite contracts.",
        contractSet: "midpoint",
        coaching: false,
        config: {
            informedShare: 0.3,
            informedNoise: 0.5,
            widthTolerance: 1.2,
            flowPerStage: 12,
            positionLimit: 6,
            secondsPerQuote: 45,
        },
    },
};

export function isDdPreset(value: unknown): value is DdPreset {
    return typeof value === "string" && value in DD_PRESETS;
}

export function contractsFor(preset: DdPreset): Contract[] {
    return CONTRACT_SETS[DD_PRESETS[preset].contractSet];
}

export function configFor(preset: DdPreset): DdConfig {
    return DD_PRESETS[preset].config;
}
