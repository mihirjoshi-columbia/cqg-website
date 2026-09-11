"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { applyForMembershipAction } from "./actions";

const WORD_LIMIT = 30;
const SLOTS = [1, 2, 3, 4, 5];

function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

// Hard-enforces the word cap by truncating on every keystroke, rather than
// just showing a counter and letting the submission fail.
function clampToWordLimit(text: string): string {
    const words = text.split(/\s+/);
    if (words.filter(Boolean).length <= WORD_LIMIT) return text;
    const trailingSpace = /\s$/.test(text);
    const kept = text.trim().split(/\s+/).slice(0, WORD_LIMIT).join(" ");
    return trailingSpace ? kept + " " : kept;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn-cqg btn-lime btn-sm w-fit" disabled={pending || disabled}>
            {pending ? "Submitting…" : "Submit application"}
        </button>
    );
}

export default function MembershipApplicationForm() {
    const [values, setValues] = useState<Record<number, string>>({});

    const hasAtLeastOne = SLOTS.some((i) => (values[i] ?? "").trim().length > 0);

    return (
        <form action={applyForMembershipAction} className="flex flex-col gap-4">
            <p className="text-ink-soft text-sm">
                Tell us about up to 5 things you&apos;re proud of — academic competitions, research or
                publications, an internship or job, a personal project, anything counts. Keep each one short
                (30 words max). You don&apos;t need to fill in all five.
            </p>

            {SLOTS.map((i) => {
                const value = values[i] ?? "";
                return (
                    <div className="field" key={i}>
                        <label className="field-label" htmlFor={`accomplishment_${i}`}>
                            Accomplishment {i}
                        </label>
                        <textarea
                            className="field-textarea"
                            id={`accomplishment_${i}`}
                            name={`accomplishment_${i}`}
                            rows={2}
                            value={value}
                            onChange={(e) =>
                                setValues((prev) => ({ ...prev, [i]: clampToWordLimit(e.target.value) }))
                            }
                        />
                        <span className="field-hint">{wordCount(value)}/{WORD_LIMIT} words</span>
                    </div>
                );
            })}

            <SubmitButton disabled={!hasAtLeastOne} />
        </form>
    );
}
