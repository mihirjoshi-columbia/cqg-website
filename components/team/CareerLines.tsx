import type { Career } from "@/lib/data/careers";

/**
 * The internship (blue) and first full-time job (green) lines under a name.
 * `reserve` pads with blank lines up to that many, so a row of pills lines up.
 */
export default function CareerLines({ career, reserve = 0 }: { career: Career; reserve?: number }) {
    const lines = [
        career.internship && { text: career.internship, className: "career career-intern" },
        career.fullTime && { text: career.fullTime, className: "career career-fulltime" },
    ].filter(Boolean) as { text: string; className: string }[];
    const blanks = Math.max(0, reserve - lines.length);

    return (
        <>
            {lines.map((line) => (
                <span key={line.className} className={line.className}>
                    {line.text}
                </span>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
                <span key={i} className="career" aria-hidden="true">
                    &nbsp;
                </span>
            ))}
        </>
    );
}
