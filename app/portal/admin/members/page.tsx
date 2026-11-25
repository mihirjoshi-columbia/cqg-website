import { requireAdmin } from "@/lib/admin";
import { fetchAllPages } from "@/lib/supabase/helpers";
import MembersTable, { type MemberRow } from "./MembersTable";
import type { CqgProfile } from "@/lib/supabase/types";

export const metadata = { title: "Members — CQG Admin" };

export default async function AdminMembersPage() {
    const { supabase } = await requireAdmin();

    const members = await fetchAllPages<CqgProfile>((from, to) =>
        supabase
            .from("cqg_profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .order("id")
            .range(from, to)
            .overrideTypes<CqgProfile[], { merge: false }>()
    );

    // Plain data for the table (sorting and filtering run in the browser).
    const rows: MemberRow[] = members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        school: `${m.school ?? ""}${m.grad_program ? ` (${m.grad_program})` : ""}`,
        year: m.year,
        major: m.major,
        hasResume: Boolean(m.resume_path),
        tier: m.tier,
    }));

    return <MembersTable rows={rows} />;
}
