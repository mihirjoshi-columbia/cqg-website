import { requireAdmin } from "@/lib/admin";
import { CTT_APPLICATION_SELECT, travelLodgingLabel, type CttApplicationRow } from "@/lib/ctt-application";
import { fetchAllPages } from "@/lib/supabase/helpers";
import ApplicationFilters from "@/components/admin/ApplicationFilters";
import DecisionButtons from "./DecisionButtons";
import ViewResumeButton from "./ViewResumeButton";

export const metadata = { title: "CTT Applications — CQG Admin" };

const STATUS_TAG: Record<string, string> = {
    pending: "tag-sky",
    offered: "tag-lime",
    accepted: "tag-pink",
    approved: "tag-pink",
    declined: "tag-outline",
    expired: "tag-outline",
    rejected: "tag-outline",
};

const STATUS_ORDER = ["pending", "offered", "accepted", "declined", "expired", "rejected", "approved"];

export default async function CttApplicationsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
    const { status = "", type = "", q = "" } = await searchParams;
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

    const needle = q.trim().toLowerCase();
    const shown = apps.filter((app) => {
        const applicant = app.cqg ?? app.ctt;
        return (
            (!status || app.status === status) &&
            (!type || app.applicant_type === type) &&
            (!needle || `${applicant?.name ?? ""} ${applicant?.email ?? ""}`.toLowerCase().includes(needle))
        );
    });

    return (
        <div>
            <ApplicationFilters
                statuses={STATUS_ORDER.map((value) => ({ value, count: apps.filter((a) => a.status === value).length })).filter((s) => s.count > 0)}
                extra={{
                    name: "type",
                    label: "Applicant",
                    options: [
                        { value: "cqg_member", label: "CQG member (Columbia/Barnard)" },
                        { value: "external", label: "External" },
                    ],
                }}
                current={{ status, q, extra: type }}
                showing={shown.length}
                total={apps.length}
            />
            <div className="flex justify-end mb-4">
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
                        {shown.map((app) => {
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
                                    <td>
                                        <span className={`tag ${STATUS_TAG[app.status]}`}>{app.status}</span>
                                        {app.details_complete === false && (
                                            <span className="text-ink-faint text-xs block mt-1">Application incomplete</span>
                                        )}
                                    </td>
                                    <td>
                                        <DecisionButtons applicationId={app.id} status={app.status} offerExpiresAt={app.offer_expires_at} />
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
