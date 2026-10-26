"use client";

export default function Setup({
    onStart,
    busy,
    attemptsUsed,
    attemptsAllowed,
    bestScore,
}: {
    onStart: () => void;
    busy: boolean;
    attemptsUsed: number;
    attemptsAllowed: number;
    bestScore: number | null;
}) {
    const left = Math.max(0, attemptsAllowed - attemptsUsed);
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

            <p className="dd-prose dd-prose--warn">
                This is graded. Everyone is dealt the same seven contracts, you get{" "}
                <strong>
                    {attemptsAllowed} attempt{attemptsAllowed === 1 ? "" : "s"}
                </strong>
                , and your <strong>best</strong> one counts. An attempt is spent the moment you
                start it &mdash; walking away or closing the tab does not give you a fresh deal,
                so finish what you start.
            </p>

            <p className="dd-prose">
                {left} of {attemptsAllowed} remaining
                {bestScore !== null && <> &middot; best so far {bestScore.toFixed(2)}</>}
            </p>

            <button
                type="button"
                className="mtm-btn mtm-btn--primary dd-start"
                onClick={onStart}
                disabled={busy}
            >
                {busy
                    ? "Dealing…"
                    : attemptsUsed === 0
                      ? "Start my first attempt"
                      : `Start attempt ${attemptsUsed + 1} of ${attemptsAllowed}`}
            </button>
        </div>
    );
}
