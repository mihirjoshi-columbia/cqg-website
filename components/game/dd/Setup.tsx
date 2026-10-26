"use client";

export default function Setup({
    onStart,
    busy,
    contest,
}: {
    onStart: () => void;
    busy: boolean;
    contest: boolean;
}) {
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

            {contest && (
                <p className="dd-prose dd-prose--warn">
                    This is a ranked run. Everyone is dealt the same contracts, you get one
                    attempt, and it is recorded the moment you start &mdash; walking away does not
                    give you a fresh deal.
                </p>
            )}

            <button
                type="button"
                className="mtm-btn mtm-btn--primary dd-start"
                onClick={onStart}
                disabled={busy}
            >
                {busy ? "Dealing…" : contest ? "Start my one attempt" : "Deal a practice run"}
            </button>
        </div>
    );
}
