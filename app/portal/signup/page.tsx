import SignupForm from "./SignupForm";

export const metadata = { title: "Sign Up — CQG Portal" };

export default function SignupPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Create your account</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            General Body is open to all Columbia and Barnard students — undergrad and grad.
                        </p>
                    </div>
                    <SignupForm />
                </div>
            </div>
        </div>
    );
}
