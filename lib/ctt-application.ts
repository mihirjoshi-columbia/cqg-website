// Parsing for the CTT application questions added after the original set,
// shared by the external (/ctt/apply) and CQG-member (/portal) apply actions.

export interface CttApplicationExtras {
    travelHousingNeeded: boolean;
    internshipLocation: string | null;
}

// Returns null when required answers are missing -- callers bail quietly, as
// they already do for the other required fields (the form enforces these
// client-side too).
export function parseCttApplicationExtras(formData: FormData): CttApplicationExtras | null {
    const travel = formData.get("travel_housing_needed");
    if (travel !== "yes" && travel !== "no") return null;

    const linedUp = formData.get("internship_lined_up") === "yes";
    const location = String(formData.get("internship_location") || "").trim().slice(0, 200);
    if (linedUp && !location) return null;

    return {
        travelHousingNeeded: travel === "yes",
        internshipLocation: linedUp ? location : null,
    };
}
