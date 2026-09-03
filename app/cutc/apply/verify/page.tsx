import VerifyHandler from "./VerifyHandler";

export const metadata = { title: "Verifying — CUTC" };

export default function VerifyPage() {
    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    <div>
                        <span className="eyebrow text-pink-deep mb-2 block">CUTC</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Verifying your account</h1>
                    </div>
                    <VerifyHandler />
                </div>
            </div>
        </div>
    );
}
