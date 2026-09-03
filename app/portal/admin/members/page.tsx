import { requireAdmin } from "@/lib/admin";
import TierSelect from "./TierSelect";
import ViewResumeButton from "./ViewResumeButton";
import type { CqgProfile } from "@/lib/supabase/types";

export const metadata = { title: "Members — CQG Admin" };

export default async function AdminMembersPage() {
    const { supabase } = await requireAdmin();

    const { data: members } = await supabase
        .from("cqg_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .overrideTypes<CqgProfile[], { merge: false }>();

    return (
        <div>
            <p className="text-ink-faint text-sm mb-4">{members?.length ?? 0} accounts</p>
            <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>School</th>
                            <th>Year</th>
                            <th>Major</th>
                            <th>Resume</th>
                            <th>Tier</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members?.map((m) => (
                            <tr key={m.id}>
                                <td>{m.name}</td>
                                <td>{m.email}</td>
                                <td>{m.school}{m.grad_program ? ` (${m.grad_program})` : ""}</td>
                                <td>{m.year}</td>
                                <td>{m.major}</td>
                                <td>{m.resume_path ? <ViewResumeButton profileId={m.id} /> : <span className="text-ink-faint text-xs">None</span>}</td>
                                <td><TierSelect profileId={m.id} currentTier={m.tier} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
