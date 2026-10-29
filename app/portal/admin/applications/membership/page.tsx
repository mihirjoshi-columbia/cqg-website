import { requireAdmin } from "@/lib/admin";
import { fetchAllPages } from "@/lib/supabase/helpers";
import { MEMBERSHIP_APPLICATION_SELECT, type MembershipApplicationRow } from "@/lib/supabase/rows";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import DecisionButtons from "./DecisionButtons";

export const metadata = { title: "Membership Applications — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-lime",
    rejected: "tag-outline",
};

export default async function MembershipApplicationsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { status = "", q = "" } = await searchParams;
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

    const needle = q.trim().toLowerCase();
    const shown = apps.filter(
        (app) =>
            (!status || app.status === status) &&
            (!needle || `${app.profile?.name ?? ""} ${app.profile?.email ?? ""}`.toLowerCase().includes(needle))
    );

    return (
        <div>
            <ApplicationFilters
                statuses={["pending", "approved", "rejected"]
                    .map((value) => ({ value, count: apps.filter((a) => a.status === value).length }))
                    .filter((s) => s.count > 0)}
                current={{ status, q, extra: "" }}
                showing={shown.length}
                total={apps.length}
            />
            <div className="flex justify-end mb-4">
                <a href="/api/admin/membership-applications/export" className="btn-cqg btn-outline-navy btn-sm">
                    Export CSV
                </a>
            </div>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Applicant</th>
                            <th>School</th>
                            <th>Accomplishments</th>
                            <th>Cycle</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Decide</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((app) => {
                            const p = app.profile;
                            const c = app.cycle;
                            return (
                                <tr key={app.id}>
                                    <td>{p ? `${p.name} — ${p.email}` : app.profile_id}</td>
                                    <td>{p?.school}{p?.grad_program ? ` (${p.grad_program})` : ""}</td>
                                    <td style={{ minWidth: 260 }}>
                                        <ul className="text-xs" style={{ paddingLeft: "1rem", listStyle: "disc" }}>
                                            {app.accomplishments.map((a, i) => (
                                                <li key={i}>{a}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td>{c?.label ?? app.cycle_id}</td>
                                    <td className="text-xs">{new Date(app.submitted_at).toLocaleDateString()}</td>
                                    <td><span className={`tag ${STATUS_TAG[app.status]}`}>{app.status}</span></td>
                                    <td>
                                        {app.status === "pending" ? (
                                            <DecisionButtons applicationId={app.id} applicantId={app.profile_id} />
                                        ) : (
                                            <span className="text-ink-faint text-xs">—</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
