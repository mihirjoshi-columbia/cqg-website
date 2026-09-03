import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Set New Password — CUTC" };

export default async function ResetPasswordPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/cutc/apply/forgot-password");
    }

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-pink-deep mb-2 block">CUTC</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Set a new password</h1>
                    </div>
                    <ResetPasswordForm />
                </div>
            </div>
        </div>
    );
}
