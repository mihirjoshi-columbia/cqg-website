import Link from "next/link";
import SignupForm from "./SignupForm";
import { getPromotedEvents } from "@/lib/promo-events";
import { COLOR_STYLES } from "@/lib/events";

export const metadata = { title: "Sign Up — CQG Portal" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ rsvp?: string }> }) {
    const { rsvp } = await searchParams;
    // Visitors from an event banner, hero button or Events page get a step-by-step guide,
    // as long as that event is still being promoted.
    const event = rsvp ? (await getPromotedEvents()).find((e) => e.id === rsvp) : undefined;

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-card-body">
                    {event && (
                        <div className="text-navy text-sm" style={{ background: COLOR_STYLES[event.color].gradient, padding: "14px 16px" }}>
                            <p className="font-bold">
                                RSVP for {event.title} ({event.when}
                                {event.location ? `, ${event.location}` : ""})
                            </p>
                            {event.eligibility !== "all" && (
                                <p className="mt-1">
                                    Open to {event.eligibility === "undergraduate" ? "undergraduate" : "graduate"} students only.
                                </p>
                            )}
                            <p className="mt-1">First create a CQG account, then RSVP through your portal:</p>
                            <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1">
                                <li>Create a CQG account below with your columbia.edu or barnard.edu email.</li>
                                <li>Verify your email, then log in.</li>
                                <li>Upload your resume.</li>
                                <li>RSVP from your portal dashboard.</li>
                            </ol>
                            <p className="mt-3 border-t border-navy/20 pt-2">
                                <strong>Already have a CQG account?</strong> Skip these steps:{" "}
                                <Link href="/portal/login" className="font-bold underline underline-offset-2">
                                    log in
                                </Link>{" "}
                                and RSVP from your portal dashboard.
                            </p>
                        </div>
                    )}
                    <div>
                        <span className="eyebrow text-sky-deep mb-2 block">CQG Portal</span>
                        <h1 className="font-display font-extrabold text-2xl text-navy">Create your account</h1>
                        <p className="text-ink-soft text-sm mt-2">
                            General Body is open to all Columbia and Barnard students — undergrad and grad.
                        </p>
                    </div>
                    <SignupForm rsvp={event?.id} />
                </div>
            </div>
        </div>
    );
}
