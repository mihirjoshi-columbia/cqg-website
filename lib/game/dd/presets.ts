import type { DdConfig } from "./types";

// There is exactly one mode.
//
// What a preset no longer decides is the DEAL. Every run is dealt its own
// randomly generated set of seven contracts (lib/game/dd/deal.ts), so there is
// no fixed contract list to select and no curated seed set to carry. A preset
// is now only the flow model and the clock.
//
// A difficulty ladder would still make results incomparable, which is the
// problem lib/game/mtm/presets.ts describes, so there is still only one rung.

export type DdPreset = "homework";

export const DD_PRESET_ORDER: readonly DdPreset[] = ["homework"];

export interface DdPresetInfo {
    label: string;
    blurb: string;
    config: DdConfig;
}

export const DD_PRESETS: Record<DdPreset, DdPresetInfo> = {
    homework: {
        label: "Distribution practice",
        blurb: "Seven contracts, freshly generated every run. Play as many times as you like.",
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

export function configFor(preset: DdPreset): DdConfig {
    return DD_PRESETS[preset].config;
}
