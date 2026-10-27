"use client";

import { RANKED_RUNS } from "@/lib/game/dd/types";

export default function Setup({
    onStart,
    busy,
    attemptsUsed,
    attemptsAllowed,
    completed,
    recentAverage,
    bestScore,
}: {
    onStart: () => void;
    busy: boolean;
    attemptsUsed: number;
    /** Null means unlimited, which is the normal case. */
    attemptsAllowed: number | null;
    completed: number;
    recentAverage: number | null;
    bestScore: number | null;
}) {
    const unlimited = attemptsAllowed === null;
    const left = unlimited ? null : Math.max(0, attemptsAllowed - attemptsUsed);

    return (
        <div className="mtm-panel">
            <p className="mtm-panel__label">How it works</p>
            <ol className="mtm-rules">
                <li>
                    Each contract settles on a random process &mdash; a binomial, a geometric or a
                    normal. Work out its mean and its standard deviation.
                </li>
                <li>
                    Quote a two-sided market. Uninformed flow pays you the spread but dries up
                    fast as you widen; informed flow picks you off when you are mispriced.{" "}
                    <strong>Expected P&amp;L peaks near one standard deviation wide.</strong>
                </li>
                <li>
                    Part of the process is then revealed and you re-quote. Some reveals move the
                    fair <em>and</em> cut the risk. Some move the fair and cut nothing.
                </li>
                <li>
                    Inventory is carried to settlement, so a position in a high-variance contract
                    is where the variance actually costs you.
                </li>
            </ol>

            <p className="dd-prose dd-prose--note">
                Seven contracts, and <strong>a different seven every run</strong> &mdash; same
                distributions, new parameters &mdash; so there is nothing to memorise.{" "}
                {unlimited ? (
                    <>
                        Play as often as you like. The leaderboard ranks the{" "}
                        <strong>average score of your last {RANKED_RUNS} finished runs</strong>,
                        so volume does not help and an abandoned run is simply one you did not
                        finish. A score is your P&amp;L measured against the risk the deal
                        carried, so a quiet deal and a wild one are worth the same.
                    </>
                ) : (
                    <>
                        You have {left} of {attemptsAllowed} attempts left, and one is spent the
                        moment you start it.
                    </>
                )}
            </p>

            <p className="dd-prose">
                {completed} run{completed === 1 ? "" : "s"} finished
                {recentAverage !== null && (
                    <> &middot; last {RANKED_RUNS} average score {recentAverage.toFixed(2)}</>
                )}
                {bestScore !== null && <> &middot; best {bestScore.toFixed(2)}</>}
            </p>

            <button
                type="button"
                className="mtm-btn mtm-btn--primary dd-start"
                onClick={onStart}
                disabled={busy}
            >
                {busy ? "Dealing…" : attemptsUsed === 0 ? "Deal my first run" : "Deal a new run"}
            </button>
        </div>
    );
}
