import { createServiceRoleClient } from "@/lib/supabase/server";
import CttBannerCountdown from "./CttBannerCountdown";
import type { CttCycle } from "@/lib/supabase/types";

const nowIso = () => new Date().toISOString();

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  return `${day}${["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : day % 10]}`;
}

// "October 23rd, 11:59 PM ET"
function formatDue(closesAt: Date): string {
  const tz = "America/New_York";
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: tz }).format(closesAt);
  const day = Number(new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: tz }).format(closesAt));
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(closesAt);
  return `${month} ${ordinal(day)}, ${time} ET`;
}

// Shown only while a CTT application cycle is open, and follows that cycle's
// real closing time, so extending the cycle in the admin extends the banner
// too. The homepage revalidates every few minutes (see app/page.tsx), and the
// countdown hides itself the moment it reaches zero for anyone on the page.
export default async function CttBanner() {
  let cycle: CttCycle | null = null;
  try {
    const now = nowIso();
    const { data } = await createServiceRoleClient()
      .from("ctt_cycles")
      .select("*")
      .lte("opens_at", now)
      .gte("closes_at", now)
      .order("opens_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .overrideTypes<CttCycle, { merge: false }>();
    cycle = data;
  } catch (err) {
    console.error("[home] CTT banner cycle lookup failed:", err);
  }
  if (!cycle) return null;

  const closesAt = new Date(cycle.closes_at);
  return <CttBannerCountdown closesAtIso={closesAt.toISOString()} dueText={formatDue(closesAt)} />;
}
