export const metadata = { title: "Privacy Policy — Columbia Quant Group" };

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <span className="tag tag-sky mb-2 block w-fit">Legal</span>
                    <div className="chevron chevron-sky mb-4">Privacy Policy</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        What we collect through the CQG and CUTC portals, who can see it, and how to have it
                        deleted.
                    </p>
                </div>
            </section>

            <section className="py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "760px" }}>
                    <div className="prose-cqg flex flex-col gap-8 text-ink-soft text-[0.98rem] leading-relaxed">
                        <div className="form-banner form-banner-error">
                            This policy was drafted to describe how the system actually works, not reviewed by a
                            lawyer. If CQG needs this to satisfy a specific compliance requirement, have counsel
                            review it before relying on it.
                        </div>

                        <div>
                            <h2 className="font-display font-bold text-xl text-navy mb-2">What we collect</h2>
                            <p>
                                Creating a CQG account (columbia.edu / barnard.edu students) or a CUTC account
                                (other .edu students) collects your name, school email, school/program, class year,
                                and major or field of study. You may optionally upload a resume (PDF, up to 5MB).
                                Applying for Internal Membership, CUTC, or a firm event creates an application
                                record tied to your account. If you attend an event we track, admins record whether
                                you attended.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display font-bold text-xl text-navy mb-2">Who can see it</h2>
                            <p>
                                CQG administrators have full access to account information and resumes for review
                                and event/application management purposes — with one exception: nobody, including
                                administrators, can ever see your password. Passwords are stored by our
                                authentication provider in a form even we can&apos;t read, and are never exposed to
                                any part of the site or its admin tools.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display font-bold text-xl text-navy mb-2">How long we keep it</h2>
                            <p>
                                Your information is retained for as long as your account is active. You can request
                                deletion of your account and associated data at any time from your account
                                settings, or by emailing us; administrators can also delete accounts on request.
                                Deleting an account removes your profile, resume, and application history.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display font-bold text-xl text-navy mb-2">Email</h2>
                            <p>
                                We use your email to verify your account, notify you about application decisions,
                                and send occasional updates relevant to programs you&apos;re part of (e.g. General
                                Body announcements, event logistics). We don&apos;t sell or share your email with
                                outside parties.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display font-bold text-xl text-navy mb-2">Questions</h2>
                            <p>
                                Reach out any time at{" "}
                                <a href="mailto:columbia.quant.group@gmail.com" className="text-sky-deep font-semibold">
                                    columbia.quant.group@gmail.com
                                </a>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
