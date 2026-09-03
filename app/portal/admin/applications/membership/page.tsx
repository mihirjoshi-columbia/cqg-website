import { requireAdmin } from "@/lib/admin";
import DecisionButtons from "./DecisionButtons";
import type { CqgMembershipApplication, CqgProfile, CqgMembershipCycle } from "@/lib/supabase/types";

export const metadata = { title: "Membership Applications — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-lime",
    rejected: "tag-outline",
};

export default async function MembershipApplicationsPage() {
    const { supabase } = await requireAdmin();

    const { data: applications } = await supabase
        .from("cqg_membership_applications")
        .select("*")
        .order("submitted_at", { ascending: false })
        .overrideTypes<CqgMembershipApplication[], { merge: false }>();

    const apps = applications ?? [];
    const profileIds = [...new Set(apps.map((a) => a.profile_id))];
    const cycleIds = [...new Set(apps.map((a) => a.cycle_id))];

    const { data: profiles } = profileIds.length
        ? await supabase
              .from("cqg_profiles")
              .select("*")
              .in("id", profileIds)
              .overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };

    const { data: cycles } = cycleIds.length
        ? await supabase
              .from("cqg_membership_cycles")
              .select("*")
              .in("id", cycleIds)
              .overrideTypes<CqgMembershipCycle[], { merge: false }>()
        : { data: [] as CqgMembershipCycle[] };

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const cycleMap = new Map((cycles ?? []).map((c) => [c.id, c]));

    return (
        <div>
            <p className="text-ink-faint text-sm mb-4">{apps.length} applications</p>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Applicant</th>
                            <th>School</th>
                            <th>Cycle</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Decide</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app) => {
                            const p = profileMap.get(app.profile_id);
                            const c = cycleMap.get(app.cycle_id);
                            return (
                                <tr key={app.id}>
                                    <td>{p ? `${p.name} — ${p.email}` : app.profile_id}</td>
                                    <td>{p?.school}{p?.grad_program ? ` (${p.grad_program})` : ""}</td>
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
