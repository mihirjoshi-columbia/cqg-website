import { requireAdmin } from "@/lib/admin";
import { CTT_APPLICATION_SELECT, travelLodgingLabel, type CttApplicationRow } from "@/lib/ctt-application";
import { fetchAllPages } from "@/lib/supabase/helpers";
import DecisionButtons from "./DecisionButtons";
import ViewResumeButton from "./ViewResumeButton";

export const metadata = { title: "CTT Applications — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    approved: "tag-pink",
    rejected: "tag-outline",
};

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
                            const applicant = app.cqg ?? app.ctt;
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
                                    <td>{app.cycle?.label ?? app.cycle_id}</td>
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
