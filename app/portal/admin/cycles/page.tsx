import { requireAdmin } from "@/lib/admin";
import CycleForm from "./CycleForm";
import { createMembershipCycleAction, createCutcCycleAction } from "./actions";
import type { CqgMembershipCycle, CutcCycle } from "@/lib/supabase/types";

export const metadata = { title: "Cycles — CQG Admin" };

function isOpen(opensAt: string, closesAt: string) {
    const now = Date.now();
    return now >= new Date(opensAt).getTime() && now <= new Date(closesAt).getTime();
}

export default async function CyclesPage() {
    const { supabase } = await requireAdmin();

    const { data: membershipCycles } = await supabase
        .from("cqg_membership_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .overrideTypes<CqgMembershipCycle[], { merge: false }>();

    const { data: cutcCycles } = await supabase
        .from("cutc_cycles")
        .select("*")
        .order("opens_at", { ascending: false })
        .overrideTypes<CutcCycle[], { merge: false }>();

    return (
        <div className="flex flex-col gap-10">
            <section>
                <h2 className="eyebrow mb-3 block">Internal Membership cycles</h2>
                <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(280px, 380px)" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Label</th><th>Opens</th><th>Closes</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {(membershipCycles ?? []).map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.label}</td>
                                        <td className="text-xs">{new Date(c.opens_at).toLocaleString()}</td>
                                        <td className="text-xs">{new Date(c.closes_at).toLocaleString()}</td>
                                        <td>
                                            <span className={`tag ${isOpen(c.opens_at, c.closes_at) ? "tag-lime" : "tag-outline"}`}>
                                                {isOpen(c.opens_at, c.closes_at) ? "Open" : "Closed"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!membershipCycles?.length && (
                                    <tr><td colSpan={4} className="text-ink-faint text-sm">No cycles yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="event-card">
                        <div className="event-card-body">
                            <CycleForm action={createMembershipCycleAction} accent="btn-lime" />
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="eyebrow mb-3 block">CUTC cycles</h2>
                <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(280px, 380px)" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Label</th><th>Opens</th><th>Closes</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {(cutcCycles ?? []).map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.label}</td>
                                        <td className="text-xs">{new Date(c.opens_at).toLocaleString()}</td>
                                        <td className="text-xs">{new Date(c.closes_at).toLocaleString()}</td>
                                        <td>
                                            <span className={`tag ${isOpen(c.opens_at, c.closes_at) ? "tag-pink" : "tag-outline"}`}>
                                                {isOpen(c.opens_at, c.closes_at) ? "Open" : "Closed"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!cutcCycles?.length && (
                                    <tr><td colSpan={4} className="text-ink-faint text-sm">No cycles yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="event-card">
                        <div className="event-card-body">
                            <CycleForm action={createCutcCycleAction} accent="btn-pink" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
