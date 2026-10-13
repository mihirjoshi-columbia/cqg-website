"use client";

import { MTM_PRESETS, MTM_PRESET_ORDER, type MtmPreset } from "@/lib/game/mtm/presets";

/**
 * Replaces the standalone game's three independent checkboxes with a single
 * choice from four presets forming a strict difficulty ladder.
 */
export default function PresetPicker({
    value,
    onChange,
    disabled,
}: {
    value: MtmPreset;
    onChange: (preset: MtmPreset) => void;
    disabled?: boolean;
}) {
    return (
        <div className="mtm-presets" role="radiogroup" aria-label="Difficulty">
            {MTM_PRESET_ORDER.map((preset) => {
                const info = MTM_PRESETS[preset];
                const active = preset === value;
                return (
                    <button
                        key={preset}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        className={`mtm-preset${active ? " mtm-preset--active" : ""}`}
                        onClick={() => onChange(preset)}
                    >
                        <span className="mtm-preset__label">{info.label}</span>
                        <span className="mtm-preset__blurb">{info.blurb}</span>
                    </button>
                );
            })}
        </div>
    );
}
