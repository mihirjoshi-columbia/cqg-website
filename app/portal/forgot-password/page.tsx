import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "Reset Password — CQG Portal" };

export default function ForgotPasswordPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Reset your password</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            Enter your Columbia/Barnard email and we&apos;ll send you a reset link.
                        </p>
                    </div>
                    <ForgotPasswordForm />
                </div>
            </div>
        </div>
    );
}
