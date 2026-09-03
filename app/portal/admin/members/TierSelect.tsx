"use client";

import { useActionState } from "react";
import { updateMemberTierAction, type TierUpdateState } from "./actions";
import type { CqgTier } from "@/lib/supabase/types";

const initialState: TierUpdateState = {};

const TIER_OPTIONS: { value: CqgTier; label: string }[] = [
    { value: "general_body", label: "General Body" },
    { value: "member", label: "Internal Member" },
    { value: "admin", label: "Admin" },
];

export default function TierSelect({ profileId, currentTier }: { profileId: string; currentTier: CqgTier }) {
    const [state, formAction, pending] = useActionState(updateMemberTierAction, initialState);

    return (
        <form action={formAction} className="flex items-center gap-2 flex-wrap">
            <input type="hidden" name="profileId" value={profileId} />
            <select
                name="tier"
                defaultValue={currentTier}
                className="field-select"
                style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", width: "auto" }}
            >
                {TIER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <button type="submit" className="btn-cqg btn-sky btn-sm" disabled={pending}>
                {pending ? "…" : "Save"}
            </button>
            {state.error && <span className="text-xs text-[#C23B4A]">{state.error}</span>}
        </form>
    );
}
