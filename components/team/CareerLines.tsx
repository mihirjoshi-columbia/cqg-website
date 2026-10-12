import type { Career } from "@/lib/data/careers";

/** The internship (blue) and first full-time job (green) lines under a name. */
export default function CareerLines({ career }: { career: Career }) {
    return (
        <>
            {career.internship && <span className="career career-intern">{career.internship}</span>}
            {career.fullTime && <span className="career career-fulltime">{career.fullTime}</span>}
        </>
    );
}
