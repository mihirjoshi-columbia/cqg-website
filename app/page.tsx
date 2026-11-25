import CttBanner from "@/components/home/CttBanner";
import QuantFairBanner from "@/components/home/QuantFairBanner";
import Hero from "@/components/home/Hero";
import StatStrip from "@/components/home/StatStrip";
import WhatWeDo from "@/components/home/WhatWeDo";
import Sponsors from "@/components/home/Sponsors";

// Re-render periodically so CttBanner follows the CTT application cycle and QuantFairBanner
// disappears after the fair.
export const revalidate = 300;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <CttBanner />
      <QuantFairBanner />
      <Hero />
      <StatStrip />
      <WhatWeDo />
      <Sponsors />
    </div>
  );
}
