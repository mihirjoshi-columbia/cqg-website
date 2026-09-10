import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log In — CUTC" };

export default function LoginPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-pink-deep mb-2 block">CUTC</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Log in</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            Manage your profile, resume, and CUTC application status. For students outside
                            Columbia and Barnard — Columbia/Barnard students can see their CUTC status in
                            their CQG portal{" "}
                            <Link href="/portal/login" className="text-sky-deep font-semibold">
                                here
                            </Link>
                            .
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
