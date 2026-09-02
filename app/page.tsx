import Hero from "@/components/home/Hero";
import StatStrip from "@/components/home/StatStrip";
import WhatWeDo from "@/components/home/WhatWeDo";
import Sponsors from "@/components/home/Sponsors";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <StatStrip />
      <WhatWeDo />
      <Sponsors />
    </div>
  );
}
