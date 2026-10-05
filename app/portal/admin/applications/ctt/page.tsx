import { requireAdmin } from "@/lib/admin";
import { travelLodgingLabel } from "@/lib/ctt-application";
import DecisionButtons from "./DecisionButtons";
import ViewResumeButton from "./ViewResumeButton";
import type { CttApplication, CqgProfile, CttProfile, CttCycle } from "@/lib/supabase/types";

export const metadata = { title: "CTT Applications — CQG Admin" };

const ID_BATCH_SIZE = 150;

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-pink",
    rejected: "tag-outline",
};

export default async function CttApplicationsPage() {
    const { supabase } = await requireAdmin();

    const { data: applications } = await supabase
        .from("ctt_applications")
        .select("*")
        .order("submitted_at", { ascending: false })
        .overrideTypes<CttApplication[], { merge: false }>();

    const apps = applications ?? [];
    const cqgIds = [...new Set(apps.filter((a) => a.cqg_profile_id).map((a) => a.cqg_profile_id as string))];
    const cttIds = [...new Set(apps.filter((a) => a.ctt_profile_id).map((a) => a.ctt_profile_id as string))];
    const cycleIds = [...new Set(apps.map((a) => a.cycle_id))];

    // .in() goes into the request URL, so one query for every applicant
    // overruns the gateway's URI limit once a cycle has a few hundred
    // applications -- the request fails and every name/resume renders blank.
    // Fetch in batches that stay well under it, and surface a failure instead
    // of silently showing empty cells.
    async function profilesByIds<T>(table: "cqg_profiles" | "ctt_profiles" | "ctt_cycles", ids: string[]): Promise<T[]> {
        const out: T[] = [];
        for (let i = 0; i < ids.length; i += ID_BATCH_SIZE) {
            const { data, error } = await supabase
                .from(table)
                .select("*")
                .in("id", ids.slice(i, i + ID_BATCH_SIZE));
            if (error) throw error;
            out.push(...((data ?? []) as unknown as T[]));
        }
        return out;
    }

    const cqgProfiles = await profilesByIds<CqgProfile>("cqg_profiles", cqgIds);
    const cttProfiles = await profilesByIds<CttProfile>("ctt_profiles", cttIds);
    const cycles = await profilesByIds<CttCycle>("ctt_cycles", cycleIds);

    const cqgMap = new Map(cqgProfiles.map((p) => [p.id, p]));
    const cttMap = new Map(cttProfiles.map((p) => [p.id, p]));
    const cycleMap = new Map(cycles.map((c) => [c.id, c]));

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-ink-faint text-sm">{apps.length} applications</p>
                <a href="/api/admin/ctt-applications/export" className="btn-cqg btn-outline-navy btn-sm">
                    Export CSV
                </a>
            </div>
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
                            <th>Where</th>
                            <th>Travel?</th>
                            <th>Lodging?</th>
                            <th>Cycle</th>
                            <th>Resume</th>
                            <th>Status</th>
                            <th>Decide</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map((app) => {
                            const cqg = app.cqg_profile_id ? cqgMap.get(app.cqg_profile_id) : undefined;
                            const ctt = app.ctt_profile_id ? cttMap.get(app.ctt_profile_id) : undefined;
                            const applicant = cqg ?? ctt;
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
                                    <td>{app.internship_location ?? "—"}</td>
                                    <td>{travelLodgingLabel(app, "travel_needed")}</td>
                                    <td>{travelLodgingLabel(app, "lodging_needed")}</td>
                                    <td>{c?.label ?? app.cycle_id}</td>
                                    <td>
                                        {applicant?.resume_path ? (
                                            <ViewResumeButton
                                                applicantType={app.applicant_type}
                                                cqgProfileId={app.cqg_profile_id}
                                                cttProfileId={app.ctt_profile_id}
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
