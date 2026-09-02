import { LinkedInIcon, InstagramIcon, MailIcon } from "@/components/icons/SocialIcons";

export default function ContactInfo() {
    return (
        <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="contact-card">
                    <div className="eyebrow text-sky mb-5">Get in touch</div>
                    <div className="contact-row">
                        <div className="ic"><MailIcon /></div>
                        <a href="mailto:columbia.quant.group@gmail.com">
                            columbia [dot] quant [dot] group [at] gmail [dot] com
                        </a>
                    </div>
                    <div className="contact-row">
                        <div className="ic"><MailIcon /></div>
                        <a href="mailto:aurora.wang@columbia.edu">
                            aurora [dot] wang [at] columbia [dot] edu (President)
                        </a>
                    </div>
                    <div className="contact-row">
                        <div className="ic"><LinkedInIcon /></div>
                        <a href="https://www.linkedin.com/company/columbia-quant-group/" target="_blank" rel="noopener noreferrer">
                            /columbia-quant-group
                        </a>
                    </div>
                    <div className="contact-row">
                        <div className="ic"><InstagramIcon /></div>
                        <a href="https://www.instagram.com/columbia.quant.group" target="_blank" rel="noopener noreferrer">
                            @columbia.quant.group
                        </a>
                    </div>
                </div>

                <div className="angle-card">
                    <div className="angle-card-body">
                        <h3 className="font-display font-bold text-[1.2rem] text-navy">
                            Sponsoring or partnering with CQG?
                        </h3>
                        <p className="text-ink-soft leading-relaxed mt-3.5">
                            We work with firms year-round on firm-hosted events, resume books, and the
                            Columbia University Trading Competition. Reach out for our current sponsorship
                            package.
                        </p>
                        <a
                            href="mailto:columbia.quant.group@gmail.com?subject=Sponsorship%20Inquiry"
                            className="btn-cqg btn-lime btn-sm mt-6 inline-flex"
                        >
                            Request Sponsorship Deck
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
