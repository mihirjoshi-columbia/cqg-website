// Reminder to everyone with an open CTT offer (status 'offered', deadline still in the future):
// they haven't answered yet and their offer expires at their own deadline.
//
//   node scripts/send-ctt-offer-reminders.mjs --preview
//   node scripts/send-ctt-offer-reminders.mjs --send

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages } from "./lib-paging.mjs";

const SITE_URL = "https://www.columbiaquantgroup.com";
const MODE = process.argv.includes("--send") ? "send" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function formatDeadline(iso) {
    const tz = "America/New_York", d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d);
    return `${day} at ${time} ET`;
}

function buildContent(person) {
    const heading = "Your CTT spot is about to expire";
    const bodyHtml =
        `Hi ${person.name}, you've been accepted to the Columbia Trading Tournament (CTT), December 5–6, 2026 in Low Library, but we haven't heard back from you yet.<br><br>` +
        `Your offer expires at <strong>${formatDeadline(person.offer_expires_at)}</strong>. To hold your spot, accept from your dashboard before then — after that, it will be offered to someone else.<br><br>` +
        `As a reminder, the Putnam exam is on December 5th, so if you're taking the exam, you unfortunately can't attend our competition.`;
    const ctaHref = `${SITE_URL}${person.applicant_type === "cqg_member" ? "/portal/dashboard" : "/ctt/apply/dashboard"}`;
    return {
        subject: "Reminder: accept your CTT spot before it expires",
        html: brandedEmailHtml({ heading, bodyHtml, ctaLabel: "Accept my spot", ctaHref }),
        text: brandedEmailText({ heading, bodyText: bodyHtml.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""), ctaLabel: "Accept my spot", ctaHref }),
    };
}

async function main() {
    loadEnv();
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const apps = await fetchAllPages((from, to) =>
        sb.from("ctt_applications")
            .select("id,status,applicant_type,offer_expires_at,cqg:cqg_profiles!cqg_profile_id(name,email), ctt:ctt_profiles(name,email)")
            .eq("status", "offered").gt("offer_expires_at", new Date().toISOString()).order("id").range(from, to)
    );
    const audience = apps.map((a) => ({ ...(a.cqg ?? a.ctt), applicant_type: a.applicant_type, offer_expires_at: a.offer_expires_at })).filter((p) => p.email);
    const mins = audience.map((a) => (new Date(a.offer_expires_at) - Date.now()) / 60000);
    console.log(`${audience.length} people with an open offer (${Math.min(...mins).toFixed(0)}–${Math.max(...mins).toFixed(0)} minutes left)`);

    if (MODE === "preview") {
        const c = buildContent(audience[0]);
        console.log(`\n=== EXAMPLE (${audience[0].name}) ===\nSubject: ${c.subject}\n--- text/plain ---\n${c.text}`);
        return;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0, failed = 0;
    for (const person of audience) {
        // Re-check right before sending: skip anyone who answered or whose time ran out while we were sending.
        if (new Date(person.offer_expires_at) <= new Date()) continue;
        const c = buildContent(person);
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL, to: person.email, subject: c.subject, html: c.html, text: c.text,
            ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
        });
        if (error) { console.error(`FAILED for ${person.email}:`, error.message); failed++; } else sent++;
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. sent=${sent} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
