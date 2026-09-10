import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "./actions";
import ProfileForm from "./ProfileForm";
import ResumeUpload from "./ResumeUpload";
import ApplicationCard from "./ApplicationCard";
import DangerZone from "./DangerZone";
import type { CutcProfile } from "@/lib/supabase/types";

export const metadata = { title: "Dashboard — CUTC" };

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/cutc/apply/login");
    }

    const { data: profile } = await supabase
        .from("cutc_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CutcProfile, { merge: false }>();

    if (!profile) {
        redirect("/cutc/apply/login");
    }

    if (!profile.resume_path) {
        redirect("/cutc/apply/complete-profile");
    }

    return (
        <div className="portal-shell">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <span className="eyebrow text-pink-deep mb-2 block">CUTC</span>
                    <h1 className="font-display font-extrabold text-2xl text-navy">
                        Welcome, {profile.name.split(" ")[0]}
                    </h1>
                </div>
                <form action={logoutAction}>
                    <button type="submit" className="btn-cqg btn-outline-navy btn-sm">Log out</button>
                </form>
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
                    <h2 className="eyebrow mb-3 block">CUTC application</h2>
                    <ApplicationCard profile={profile} />
                </section>

                <section>
                    <h2 className="eyebrow mb-3 block">Account</h2>
                    <DangerZone />
                </section>
            </div>
        </div>
    );
}
