import CttBanner from "@/components/home/CttBanner";
import Hero from "@/components/home/Hero";
import StatStrip from "@/components/home/StatStrip";
import WhatWeDo from "@/components/home/WhatWeDo";
import Sponsors from "@/components/home/Sponsors";

// Re-render periodically so CttBanner follows the CTT application cycle.
export const revalidate = 300;

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <CttBanner />
      <Hero />
      <StatStrip />
      <WhatWeDo />
      <Sponsors />
    </div>
  );
}
