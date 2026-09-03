import SignupForm from "./SignupForm";

export const metadata = { title: "Sign Up — CUTC" };

export default function SignupPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-pink-deep mb-2 block">CUTC</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Create your account</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            For students outside Columbia and Barnard. Columbia/Barnard students should apply to
                            CUTC from their CQG portal account instead.
                        </p>
                    </div>
                    <SignupForm />
                </div>
            </div>
        </div>
    );
}
