import { requireAdmin } from "@/lib/admin";
import { CTT_APPLICATION_SELECT, travelLodgingLabel, type CttApplicationRow } from "@/lib/ctt-application";
import { fetchAllPages } from "@/lib/supabase/helpers";
import CttApplicationsTable, { type CttRow } from "./CttApplicationsTable";

export const metadata = { title: "CTT Applications — CQG Admin" };

export default async function CttApplicationsPage() {
    const { supabase } = await requireAdmin();

    // The API returns at most 1,000 rows per request, so read it in pages.
    const apps = await fetchAllPages<CttApplicationRow>((from, to) =>
        supabase
            .from("ctt_applications")
            .select(CTT_APPLICATION_SELECT)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CttApplicationRow[], { merge: false }>()
    );

    // Plain data for the table (sorting and filtering run in the browser).
    const rows: CttRow[] = apps.map((app) => {
        const applicant = app.cqg ?? app.ctt;
        return {
            id: app.id,
            applicantName: applicant?.name ?? "",
            applicantEmail: applicant?.email ?? "",
            applicantType: app.applicant_type,
            college: app.college,
            major: app.major,
            gradYear: app.grad_year,
            gender: app.gender,
            priorInternship: app.prior_internship,
            internshipLinedUp: app.internship_lined_up,
            internshipLocation: app.internship_location,
            travel: travelLodgingLabel(app, "travel_needed"),
            lodging: travelLodgingLabel(app, "lodging_needed"),
            cycle: app.cycle?.label ?? app.cycle_id,
            hasResume: Boolean(applicant?.resume_path),
            cqgProfileId: app.cqg_profile_id,
            cttProfileId: app.ctt_profile_id,
            status: app.status,
            detailsComplete: app.details_complete !== false,
            offerExpiresAt: app.offer_expires_at,
        };
    });

    return <CttApplicationsTable rows={rows} />;
}
