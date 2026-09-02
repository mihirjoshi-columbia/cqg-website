import CrownGame from "./CrownGame";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-navy py-14 sm:py-20 lg:py-28"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 55% at 82% 18%, rgba(111,203,255,0.22), transparent 60%), radial-gradient(ellipse 50% 60% at 10% 90%, rgba(232,250,10,0.10), transparent 60%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
        <div>
          <h1 className="text-white font-black leading-[1.03] tracking-tight text-[clamp(2.5rem,5.4vw,4.1rem)]">
            Columbia&apos;s pipeline into{" "}
            <em
              className="not-italic bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--lime-gradient)" }}
            >
              quantitative finance
            </em>
          </h1>
          <p className="text-[#C3D2EA] text-lg leading-relaxed mt-6 max-w-xl">
            Columbia&apos;s only student group built around trading, quantitative research, and technical
            finance &mdash; from a selective internal cohort to a 970+ member community preparing for the
            industry.
          </p>
          <div className="flex flex-wrap gap-3.5 mt-9">
            <a href="/recruitment" className="btn-cqg btn-lime">
              Apply for Internal Membership
            </a>
            <a href="/recruitment" className="btn-cqg btn-outline">
              Join our General Body
            </a>
            <a href="/placements" className="btn-cqg btn-outline">
              See Our Placements
            </a>
            <a href="/contact" className="btn-cqg btn-outline">
              Partner with Us
            </a>
          </div>
        </div>
        <div>
          <CrownGame />
        </div>
      </div>
    </section>
  );
}
