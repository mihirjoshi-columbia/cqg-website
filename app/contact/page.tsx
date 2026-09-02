import ContactInfo from "@/components/contact/ContactInfo";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <section className="bg-navy relative overflow-hidden py-14 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="chevron chevron-sky mb-4">Contact Us</div>
                    <p className="text-[#C3D2EA] text-[1.05rem] max-w-xl">
                        Have questions? Reach out &mdash; we usually respond within a couple of days.
                    </p>
                </div>
            </section>

            <ContactInfo />
        </div>
    );
}
