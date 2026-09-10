import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log In — CQG Portal" };

export default function LoginPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Log in</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            Manage your profile and resume, apply for Internal Membership, and RSVP to events.
                            For Columbia and Barnard students.
                        </p>
                    </div>
                    <Suspense fallback={null}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
