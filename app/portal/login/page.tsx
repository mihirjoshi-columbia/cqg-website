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
                    </div>
                    <Suspense fallback={null}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
