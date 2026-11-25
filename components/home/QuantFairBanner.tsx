import Link from "next/link";
import { QUANT_FAIR_LOCATION, QUANT_FAIR_RSVP_HREF, QUANT_FAIR_WHEN, quantFairOver } from "@/lib/quant-fair";

// RSVP banner for the Columbia Quant Fair. The homepage revalidates every few minutes
// (see app/page.tsx), so this disappears shortly after the fair ends.
export default function QuantFairBanner() {
  if (quantFairOver()) return null;

  return (
    <Link
      href={QUANT_FAIR_RSVP_HREF}
      className="sticky top-16 z-40 block bg-pink text-navy px-4 py-2.5 text-center hover:brightness-95 transition lg:flex lg:h-10 lg:items-center lg:justify-center lg:gap-1.5 lg:py-0"
    >
      <span className="text-sm font-bold">RSVP: the inaugural Columbia Quant Fair</span>{" "}
      <span className="block sm:inline text-xs sm:text-sm font-semibold">
        {QUANT_FAIR_WHEN} &middot; {QUANT_FAIR_LOCATION} &middot; Columbia &amp; Barnard students <span aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
