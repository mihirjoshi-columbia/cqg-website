import SignupForm from "./SignupForm";
import { QUANT_FAIR_LOCATION, QUANT_FAIR_RSVP_PARAM, QUANT_FAIR_WHEN, quantFairOver } from "@/lib/quant-fair";

export const metadata = { title: "Sign Up — CQG Portal" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ rsvp?: string }> }) {
    const { rsvp } = await searchParams;
    // Visitors from the Quant Fair banner or hero button get a step-by-step guide.
    const fromQuantFair = rsvp === QUANT_FAIR_RSVP_PARAM && !quantFairOver();

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    {fromQuantFair && (
                        <div className="text-navy text-sm" style={{ background: "var(--pink-gradient)", padding: "14px 16px" }}>
                            <p className="font-bold">
                                RSVP for the Columbia Quant Fair ({QUANT_FAIR_WHEN}, {QUANT_FAIR_LOCATION})
                            </p>
                            <p className="mt-1">First create a CQG account, then RSVP through your portal:</p>
                            <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1">
                                <li>Create a CQG account below with your columbia.edu or barnard.edu email.</li>
                                <li>Verify your email, then log in.</li>
                                <li>Upload your resume.</li>
                                <li>RSVP from your portal dashboard.</li>
                            </ol>
                        </div>
                    )}
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Create your account</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            General Body is open to all Columbia and Barnard students — undergrad and grad.
                        </p>
                    </div>
                    <SignupForm rsvp={fromQuantFair ? QUANT_FAIR_RSVP_PARAM : undefined} />
                </div>
            </div>
        </div>
    );
}
