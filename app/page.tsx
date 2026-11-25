import CttBanner from "@/components/home/CttBanner";
import EventBanner from "@/components/home/EventBanner";
import Hero from "@/components/home/Hero";
import StatStrip from "@/components/home/StatStrip";
import WhatWeDo from "@/components/home/WhatWeDo";
import Sponsors from "@/components/home/Sponsors";
import { getPromotedEvents } from "@/lib/promo-events";

// Re-render periodically so CttBanner follows the CTT application cycle and promoted events
// drop off once they end. Saving an event in the admin refreshes this page right away.
export const revalidate = 300;

export default async function Home() {
  const promoted = await getPromotedEvents();

  return (
    <div className="flex flex-col min-h-screen">
      <CttBanner />
      <EventBanner events={promoted} />
      <Hero promoted={promoted} />
      <StatStrip />
      <WhatWeDo />
      <Sponsors />
    </div>
  );
}
