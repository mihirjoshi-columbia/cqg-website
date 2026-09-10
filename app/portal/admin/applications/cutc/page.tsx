import { requireAdmin } from "@/lib/admin";
import DecisionButtons from "./DecisionButtons";
import ViewResumeButton from "./ViewResumeButton";
import type { CutcApplication, CqgProfile, CutcProfile, CutcCycle } from "@/lib/supabase/types";

export const metadata = { title: "CUTC Applications — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-pink",
    rejected: "tag-outline",
};

export default async function CutcApplicationsPage() {
    const { supabase } = await requireAdmin();

    const { data: applications } = await supabase
        .from("cutc_applications")
        .select("*")
        .order("submitted_at", { ascending: false })
        .overrideTypes<CutcApplication[], { merge: false }>();

    const apps = applications ?? [];
    const cqgIds = [...new Set(apps.filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
    const cutcIds = [...new Set(apps.filter((a) => a.cutc_profile_id).map((a) => a.cutc_profile_id as string))];
    const cycleIds = [...new Set(apps.map((a) => a.cycle_id))];

    const { data: cqgProfiles } = cqgIds.length
        ? await supabase.from("cqg_profiles").select("*").in("id", cqgIds).overrideTypes<CqgProfile[], { merge: false }>()
        : { data: [] as CqgProfile[] };

    const { data: cutcProfiles } = cutcIds.length
        ? await supabase.from("cutc_profiles").select("*").in("id", cutcIds).overrideTypes<CutcProfile[], { merge: false }>()
        : { data: [] as CutcProfile[] };

    const { data: cycles } = cycleIds.length
        ? await supabase.from("cutc_cycles").select("*").in("id", cycleIds).overrideTypes<CutcCycle[], { merge: false }>()
        : { data: [] as CutcCycle[] };

    const cqgMap = new Map((cqgProfiles ?? []).map((p) => [p.id, p]));
    const cutcMap = new Map((cutcProfiles ?? []).map((p) => [p.id, p]));
    const cycleMap = new Map((cycles ?? []).map((c) => [c.id, c]));

    return (
        <div>
            <p className="text-ink-faint text-sm mb-4">{apps.length} applications</p>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Applicant</th>
                            <th>Type</th>
                            <th>College</th>
                            <th>Major</th>
                            <th>Grad Yr</th>
                            <th>Gender</th>
                            <th>Prior Intern?</th>
                            <th>Lined Up?</th>
                            <th>Cycle</th>
                            <th>Resume</th>
                            <th>Status</th>
                            <th>Decide</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app) => {
                            const cqg = app.cqg_profile_id ? cqgMap.get(app.cqg_profile_id) : undefined;
                            const cutc = app.cutc_profile_id ? cutcMap.get(app.cutc_profile_id) : undefined;
                            const applicant = cqg ?? cutc;
                            const c = cycleMap.get(app.cycle_id);
                            return (
                                <tr key={app.id}>
                                    <td>{applicant ? `${applicant.name} — ${applicant.email}` : "—"}</td>
                                    <td>
                                        <span className="tag tag-outline" style={{ fontSize: "0.68rem" }}>
                                            {app.applicant_type === "cqg_member" ? "CQG member" : "External"}
                                        </span>
                                    </td>
                                    <td>{app.college}</td>
                                    <td>{app.major}</td>
                                    <td>{app.grad_year}</td>
                                    <td>{app.gender}</td>
                                    <td>{app.prior_internship ? "Yes" : "No"}</td>
                                    <td>{app.internship_lined_up ? "Yes" : "No"}</td>
                                    <td>{c?.label ?? app.cycle_id}</td>
                                    <td>
                                        {applicant?.resume_path ? (
                                            <ViewResumeButton
                                                applicantType={app.applicant_type}
                                                cqgProfileId={app.cqg_profile_id}
                                                cutcProfileId={app.cutc_profile_id}
                                            />
                                        ) : (
                                            <span className="text-ink-faint text-xs">None</span>
                                        )}
                                    </td>
                                    <td><span className={`tag ${STATUS_TAG[app.status]}`}>{app.status}</span></td>
                                    <td>
                                        {app.status === "pending" ? (
                                            <DecisionButtons applicationId={app.id} />
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
