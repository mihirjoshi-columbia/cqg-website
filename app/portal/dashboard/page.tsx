import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "./actions";
import ProfileForm from "./ProfileForm";
import ResumeUpload from "./ResumeUpload";
import MembershipCard from "./MembershipCard";
import CutcCard from "./CutcCard";
import DangerZone from "./DangerZone";
import type { CqgProfile } from "@/lib/supabase/types";

export const metadata = { title: "Dashboard — CQG Portal" };

const TIER_LABEL: Record<string, string> = {
    general_body: "General Body",
    member: "Internal Member",
    admin: "Admin",
};

const TIER_TAG_CLASS: Record<string, string> = {
    general_body: "tag-outline",
    member: "tag-lime",
    admin: "tag-pink",
};

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/portal/login");
    }

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    if (!profile) {
        redirect("/portal/login");
    }

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">
                        Welcome, {profile.name.split(" ")[0]}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`tag ${TIER_TAG_CLASS[profile.tier]}`}>{TIER_LABEL[profile.tier]}</span>
                    <a href="/portal/events" className="btn-cqg btn-outline-navy btn-sm">
                        Events
                    </a>
                    {profile.tier === "admin" && (
                        <a href="/portal/admin" className="btn-cqg btn-outline-navy btn-sm">
                            Admin dashboard
                        </a>
                    )}
                    <form action={logoutAction}>
                        <button type="submit" className="btn-cqg btn-outline-navy btn-sm">Log out</button>
                    </form>
                </div>
            </div>

            <div className="flex flex-col gap-10" style={{ maxWidth: 560 }}>
                <section>
                    <h2 className="eyebrow mb-3 block">Your profile</h2>
                    <div className="event-card">
                        <div className="event-card-body">
                            <p className="text-ink-faint text-xs -mt-1">{profile.email}</p>
                            <ProfileForm profile={profile} />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">Resume</h2>
                    <div className="event-card">
                        <div className="event-card-body">
                            <ResumeUpload hasResume={Boolean(profile.resume_path)} />
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">Internal Membership</h2>
                    <MembershipCard profile={profile} />
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">CUTC</h2>
                    <CutcCard profile={profile} />
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">Account</h2>
                    <DangerZone />
                </section>
            </div>
        </div>
    );
}
