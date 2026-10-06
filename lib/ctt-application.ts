// Parsing for the CTT application questions added after the original set,
// shared by the external (/ctt/apply) and CQG-member (/portal) apply actions.

import type { CqgProfile, CttApplication, CttCycle, CttProfile } from "@/lib/supabase/types";

// An application with its applicant and cycle attached by the database in one
// query. ctt_applications has two foreign keys to cqg_profiles (the applicant
// and decided_by), so the CQG join has to name which one it means.
export const CTT_APPLICATION_SELECT =
    "*, cqg:cqg_profiles!cqg_profile_id(*), ctt:ctt_profiles(*), cycle:ctt_cycles(label)";

export type CttApplicationRow = CttApplication & {
    cqg: CqgProfile | null;
    ctt: CttProfile | null;
    cycle: Pick<CttCycle, "label"> | null;
};

export interface CttApplicationExtras {
    travelNeeded: boolean | null;
    lodgingNeeded: boolean | null;
    internshipLocation: string | null;
}

function yesNo(value: FormDataEntryValue | null): boolean | null {
    return value === "yes" ? true : value === "no" ? false : null;
}

// Travel/lodging answers on their own, for the "update your answers" form.
export function parseTravelLodgingAnswers(formData: FormData): { travelNeeded: boolean; lodgingNeeded: boolean } | null {
    const travelNeeded = yesNo(formData.get("travel_needed"));
    const lodgingNeeded = yesNo(formData.get("lodging_needed"));
    if (travelNeeded === null || lodgingNeeded === null) return null;
    return { travelNeeded, lodgingNeeded };
}

// Returns null when required answers are missing -- callers bail quietly, as
// they already do for the other required fields (the form enforces these
// client-side too). Columbia/Barnard applicants aren't asked about travel or
// lodging (askTravelLodging = false), so those stay null for them.
export function parseCttApplicationExtras(formData: FormData, askTravelLodging: boolean): CttApplicationExtras | null {
    let travelNeeded: boolean | null = null;
    let lodgingNeeded: boolean | null = null;
    if (askTravelLodging) {
        const answers = parseTravelLodgingAnswers(formData);
        if (!answers) return null;
        travelNeeded = answers.travelNeeded;
        lodgingNeeded = answers.lodgingNeeded;
    }

    const linedUp = formData.get("internship_lined_up") === "yes";
    const location = String(formData.get("internship_location") || "").trim().slice(0, 200);
    if (linedUp && !location) return null;

    return { travelNeeded, lodgingNeeded, internshipLocation: linedUp ? location : null };
}

// What to show in the admin table / CSV for one of the two answers. External
// applicants who said "Yes" to the old combined question haven't re-answered
// yet, so their answer is pending rather than blank.
export function travelLodgingLabel(app: CttApplication, field: "travel_needed" | "lodging_needed"): string {
    if (app.applicant_type === "cqg_member") return "—";
    const value = app[field];
    if (value !== null) return value ? "Yes" : "No";
    return app.travel_housing_needed ? "Pending re-answer" : "—";
}

// True when an external applicant still needs to answer the split questions.
export function needsTravelLodgingAnswers(app: CttApplication): boolean {
    return app.applicant_type === "external" && (app.travel_needed === null || app.lodging_needed === null);
}
