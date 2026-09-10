import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "../dashboard/actions";
import ResumeUpload from "../dashboard/ResumeUpload";
import type { CqgProfile } from "@/lib/supabase/types";

export const metadata = { title: "Complete Your Profile — CQG Portal" };

export default async function CompleteProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/portal/login");

    const { data: profile } = await supabase
        .from("cqg_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
        .overrideTypes<CqgProfile, { merge: false }>();

    if (!profile) redirect("/portal/login");
    if (profile.resume_path) redirect("/portal/dashboard");

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">
                            One last step, {profile.name.split(" ")[0]}
                        </h1>
                        <p className="text-ink-soft text-sm mt-2">
                            Upload your resume to finish setting up your account — it&apos;s required before
                            you can access your dashboard.
                        </p>
                    </div>
                    <ResumeUpload hasResume={false} />
                    <form action={logoutAction}>
                        <button type="submit" className="btn-cqg btn-outline-navy btn-sm w-fit">
                            Log out
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
