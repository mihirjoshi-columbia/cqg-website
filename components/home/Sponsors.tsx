const sponsors = [
  { key: "jane-street-h-white", name: "Jane Street" },
  { key: "walleye-white", name: "Walleye" },
  { key: "five-rings-full-white", name: "Five Rings" },
  { key: "hrt-h-white", name: "HRT" },
  { key: "drw-white", name: "DRW" },
  { key: "sig-h-white", name: "SIG" },
  { key: "citadel-securities-white", name: "Citadel Securities" },
];

export default function Sponsors() {
  const track = [...sponsors, ...sponsors];

  return (
    <>
      <section className="bg-navy-deep pt-8 pb-4 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="eyebrow eyebrow-plain justify-center text-[#7488A8]">
            2026&ndash;2027 Academic Year Sponsors
          </div>
        </div>
      </section>

      <section className="bg-navy-deep overflow-hidden py-6 pb-10">
        <div className="marquee-track" style={{ animationDuration: "16s" }}>
          {track.map((s, i) => (
            <div key={`${s.key}-${i}`} className="firm-chip">
              {/* eslint-disable-next-line @next/next/no-img-element -- varying aspect ratios, CSS-driven sizing in a marquee */}
              <img src={`/logos/${s.key}.png`} alt={s.name} className="max-h-[85%] w-auto max-w-[190px] object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-24 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="chevron chevron-sky mx-auto inline-flex">Ready to break in?</div>
          <p className="text-ink-soft text-[1.05rem] leading-relaxed max-w-2xl mx-auto mt-6">
            Sign up for the general body for firm info sessions, Q&amp;As, and firm-run trading challenges
            &mdash; or apply when internal recruitment opens this fall.
          </p>
          <div className="flex justify-center mt-7">
            <a href="/recruitment" className="btn-cqg btn-outline-navy">
              Join General Body
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
