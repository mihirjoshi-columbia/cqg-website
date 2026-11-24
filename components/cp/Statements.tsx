import type { ReactNode } from "react";
import type { CpProblem } from "@/lib/cp/problems";

// Statements are our own wording of each source problem, recast with the exec
// board. The maths and constraints are unchanged, except that every sample is
// our own; the source link stays on the page for anyone who wants the
// original or its editorial.

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <h3 className="eyebrow">{title}</h3>
            <div className="text-ink-soft text-sm leading-relaxed flex flex-col gap-2">{children}</div>
        </div>
    );
}

function C({ children }: { children: ReactNode }) {
    return <code className="font-mono text-[0.85em] text-navy bg-paper px-1">{children}</code>;
}

const FLOAT_OUTPUT = (
    <p>
        Print the answer as a decimal number. It is accepted if its absolute or relative error is at
        most <C>10⁻⁶</C>, so <C>print(f&quot;{"{ans:.10f}"}&quot;)</C> is plenty.
    </p>
);

const STATEMENTS: Record<string, { body: ReactNode; input: ReactNode; output: ReactNode; notes?: ReactNode[] }> = {
    "best-streak": {
        body: (
            <>
                <p>
                    Nikhil kept a trading journal for <C>n</C> days. On day <C>i</C> his P&amp;L
                    was <C>aᵢ</C> dollars, which may be negative. A <em>streak</em> is a run of
                    consecutive days, worth the sum of their P&amp;L. A streak may also be empty,
                    which is worth <C>0</C>. His <em>best streak</em> is the largest value over all
                    streaks.
                </p>
                <p>
                    Before he shows the journal to Mihir, Nikhil may choose <strong>at most one</strong>{" "}
                    run of consecutive days and multiply the P&amp;L of each of those days by a
                    leverage factor <C>x</C>. Note that <C>x</C> can be zero or negative.
                </p>
                <p>What is the largest best streak Nikhil can show?</p>
            </>
        ),
        input: (
            <>
                <p>
                    The first line holds <C>n</C> and <C>x</C>. The second line holds{" "}
                    <C>a₁ a₂ … aₙ</C>.
                </p>
                <p>
                    <C>1 ≤ n ≤ 3·10⁵</C>, <C>−100 ≤ x ≤ 100</C>, <C>−10⁹ ≤ aᵢ ≤ 10⁹</C>.
                </p>
            </>
        ),
        output: <p>Print one integer: the largest best streak.</p>,
        notes: [
            <>
                Scale days 3 through 5 by <C>−2</C>, turning <C>−2 1 −6</C> into{" "}
                <C>4 −2 12</C>. The streak from day 2 onward is then worth{" "}
                <C>8 + 4 − 2 + 12 = 22</C>.
            </>,
            <>Scale days 3 through 5 to get <C>6 −6 9</C>, and the streak of those three days is worth <C>9</C>.</>,
            <>Every day lost money and scaling by <C>10</C> only makes it worse, so the empty streak wins.</>,
        ],
    },
    "dice-game": {
        body: (
            <>
                <p>
                    Aurora offers Nicole a game. Nicole may roll a fair six-sided die up to{" "}
                    <C>N</C> times. After each roll she either <strong>stops</strong>, and Aurora
                    pays her the number showing in dollars, or she <strong>rolls again</strong>. If
                    she reaches the <C>N</C>-th roll, she must take whatever it shows.
                </p>
                <p>If Nicole plays to maximise her expected payout, what is that expected payout?</p>
            </>
        ),
        input: (
            <p>
                One integer <C>N</C>, with <C>1 ≤ N ≤ 100</C>.
            </p>
        ),
        output: FLOAT_OUTPUT,
        notes: [
            <>With one roll she has no choice, so she gets the die&apos;s average of <C>3.5</C>.</>,
            <>
                With two rolls she keeps a 4, 5 or 6 and rerolls otherwise, giving{" "}
                <C>(4 + 5 + 6)/6 + (3/6)·3.5 = 4.25</C>.
            </>,
        ],
    },
    "count-down": {
        body: (
            <>
                <p>
                    Victor has an integer <C>N</C>. He may repeat either of these operations, as
                    many times as he likes and in any order:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li>
                        Pay <C>X</C> dollars and replace <C>N</C> with <C>⌊N / A⌋</C>.
                    </li>
                    <li>
                        Pay <C>Y</C> dollars and roll a fair six-sided die showing <C>b</C>, then
                        replace <C>N</C> with <C>⌊N / b⌋</C>.
                    </li>
                </ul>
                <p>
                    Victor sees each roll before he chooses his next operation. What is the minimum
                    expected total he pays to bring <C>N</C> down to <C>0</C>?
                </p>
            </>
        ),
        input: (
            <>
                <p>
                    One line with <C>N A X Y</C>.
                </p>
                <p>
                    <C>1 ≤ N ≤ 10¹⁸</C>, <C>2 ≤ A ≤ 6</C>, <C>1 ≤ X, Y ≤ 10⁹</C>.
                </p>
            </>
        ),
        output: FLOAT_OUTPUT,
        notes: [
            <>
                Halving three times takes <C>7 → 3 → 1 → 0</C> for <C>30</C>. Rolling is never
                worth it here.
            </>,
        ],
    },
    target: {
        body: (
            <>
                <p>
                    Ivy has an <C>N</C>-sided die with faces <C>1</C> through <C>N</C>. It
                    currently shows <C>S</C>, and Mihir will pay her once it shows <C>T</C>. Until
                    then she may repeat either operation:
                </p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                    <li>
                        Pay <C>A</C> dollars to turn the die so it shows one more than it does now.
                        This is only allowed while it shows less than <C>N</C>.
                    </li>
                    <li>
                        Pay <C>B</C> dollars to reroll the die. Every face is equally likely.
                    </li>
                </ul>
                <p>What is the minimum expected total Ivy pays before the die shows <C>T</C>?</p>
            </>
        ),
        input: (
            <>
                <p>
                    One line with <C>N S T A B</C>.
                </p>
                <p>
                    <C>1 ≤ S, T ≤ N ≤ 10⁹</C>, <C>1 ≤ A, B ≤ 10⁹</C>.
                </p>
            </>
        ),
        output: FLOAT_OUTPUT,
        notes: [
            <>
                Turning up from 2 costs <C>20</C>. Instead, she can reroll until she sees a 3 or 4,
                which takes 2.5 rolls on average and costs <C>10</C>. Half the time she then needs
                one turn, adding <C>5</C> on average, for <C>15</C> in total.
            </>,
            <>
                She starts above <C>T</C>, so she has to reroll. She rerolls until she sees 1–4,
                which costs <C>2·10/4 = 5</C>, then turns up 1.5 times on average, for{" "}
                <C>6.5</C>.
            </>,
        ],
    },
};

export default function Statement({ problem }: { problem: CpProblem }) {
    const statement = STATEMENTS[problem.id];
    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h2 className="font-display font-extrabold text-xl text-navy">
                    {problem.letter}. {problem.title}
                </h2>
                <p className="text-ink-faint text-xs font-mono">
                    {problem.timeLimitMs / 1000} s per test · based on{" "}
                    <a href={problem.source.url} target="_blank" rel="noreferrer" className="underline">
                        {problem.source.label}
                    </a>
                </p>
            </div>
            <Section title="Statement">{statement.body}</Section>
            <Section title="Input">{statement.input}</Section>
            <Section title="Output">{statement.output}</Section>
            {problem.samples.map((sample, i) => (
                <Section key={i} title={`Sample ${i + 1}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <pre className="cp-pre">{sample.input}</pre>
                        <pre className="cp-pre">{sample.output}</pre>
                    </div>
                    {statement.notes?.[i] && <p>{statement.notes[i]}</p>}
                </Section>
            ))}
        </div>
    );
}
