import { requireAdmin } from "@/lib/admin";
import { fetchAllPages } from "@/lib/supabase/helpers";
import { MEMBERSHIP_APPLICATION_SELECT, type MembershipApplicationRow } from "@/lib/supabase/rows";
import MembershipApplicationsTable, { type MembershipRow } from "./MembershipApplicationsTable";

export const metadata = { title: "Membership Applications — CQG Admin" };

export default async function MembershipApplicationsPage() {
    const { supabase } = await requireAdmin();

    // The API returns at most 1,000 rows per request, so read it in pages.
    const apps = await fetchAllPages<MembershipApplicationRow>((from, to) =>
        supabase
            .from("cqg_membership_applications")
            .select(MEMBERSHIP_APPLICATION_SELECT)
            .order("submitted_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<MembershipApplicationRow[], { merge: false }>()
    );

    // Plain data for the table (sorting and filtering run in the browser).
    const rows: MembershipRow[] = apps.map((app) => {
        const p = app.profile;
        return {
            id: app.id,
            profileId: app.profile_id,
            applicantName: p?.name ?? "",
            applicantEmail: p?.email ?? "",
            school: `${p?.school ?? ""}${p?.grad_program ? ` (${p.grad_program})` : ""}`,
            accomplishments: app.accomplishments,
            cycle: app.cycle?.label ?? app.cycle_id,
            submittedAt: app.submitted_at,
            status: app.status,
        };
    });

    return <MembershipApplicationsTable rows={rows} />;
}
