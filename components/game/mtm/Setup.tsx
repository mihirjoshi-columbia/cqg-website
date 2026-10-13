"use client";

import { MAKER_PROFILES } from "@/lib/game/mtm/makers";
import type { MtmPreset } from "@/lib/game/mtm/presets";
import PresetPicker from "./PresetPicker";

export default function Setup({
    preset,
    onPresetChange,
    onStart,
}: {
    preset: MtmPreset;
    onPresetChange: (preset: MtmPreset) => void;
    onStart: () => void;
}) {
    return (
        <div className="mtm-setup">
            <section className="mtm-panel">
                <h2 className="mtm-h2">How it works</h2>
                <ul className="mtm-rules">
                    <li>
                        The deck is 39 cards: a normal pack with every{" "}
                        <span className="mtm-red">heart thrown out</span>.
                    </li>
                    <li>
                        A black card (♠ ♣) scores ten points per rank, so the ace is 10 and the king
                        is 130.
                    </li>
                    <li>
                        A <span className="mtm-red">diamond</span> scores the same amount negative:
                        the ace is −10, the king is −130.
                    </li>
                    <li>
                        One card goes to you, one to each of the four makers, and four more sit face
                        down.
                    </li>
                    <li>
                        What you are trading is the{" "}
                        <span className="mtm-accent">total of those nine cards</span>. Only your own
                        card is visible at the deal.
                    </li>
                    <li>
                        Every round each maker shows you a two-sided market, 1 lot up. Lift the
                        offer, hit the bid, or leave it alone — <span className="mtm-buy">buy</span>,{" "}
                        <span className="mtm-sell">sell</span> or pass, one lot at a time.
                    </li>
                    <li>
                        Once you have answered all four markets a face-down card turns over and
                        everyone re-prices. That repeats until the fourth card is up; the fifth set
                        of markets is the last one before settlement.
                    </li>
                    <li>
                        No two makers quote alike — spread, how much they copy the screen, how they
                        read your flow and how they handle a position all differ.
                    </li>
                </ul>

                <div className="mtm-roster" aria-label="Market-maker roster">
                    {MAKER_PROFILES.map((profile) => (
                        <div key={profile.id}>
                            <span>{profile.name}</span>
                            <strong>{profile.style}</strong>
                            <small>{profile.description}</small>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mtm-panel">
                <h2 className="mtm-h2">Difficulty</h2>
                <PresetPicker value={preset} onChange={onPresetChange} />
                <button
                    type="button"
                    className="mtm-btn mtm-btn--primary mtm-btn--block"
                    onClick={onStart}
                >
                    Deal &amp; start
                </button>
            </section>
        </div>
    );
}
