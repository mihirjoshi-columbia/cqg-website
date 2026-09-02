const stats = [
  { num: "970+", label: "Engaged general body students" },
  { num: "~20", label: "Selective internal members" },
  { num: "10+", label: "Firm partners & sponsors" },
  { num: "F26", label: "Inaugural Trading Competition" },
];

export default function StatStrip() {
  return (
    <section className="bg-navy-deep border-y border-navy-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12 grid grid-cols-2 sm:grid-cols-4 gap-y-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center px-4">
            <div className="stat-num text-[clamp(1.9rem,4vw,2.6rem)]">{s.num}</div>
            <div className="text-[#9FB1CE] text-sm mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
