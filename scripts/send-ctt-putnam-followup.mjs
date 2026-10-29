// Follow-up to the people who got the CTT offer email before it carried the Putnam note:
// the Putnam exam is on December 5th, so anyone taking it can't attend. Audience: applications
// with an offer made since --since (an ISO time, default: the start of today in UTC) that are
// still 'offered' or already 'accepted'. Accepted people can't decline from the dashboard, so
// they're told to reply instead.
//
//   node scripts/send-ctt-putnam-followup.mjs --preview
//   node scripts/send-ctt-putnam-followup.mjs --send

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
    const heading = "A note about the Putnam";
    const deadline = formatDeadline(person.offer_expires_at);
    const first = `Hi ${person.name}, a quick addition to the email we just sent you about your spot at CTT: the Putnam exam is on December 5th, so if you're taking the exam, you unfortunately can't attend our competition.`;
    const second = person.status === "accepted"
        ? `You've already accepted your spot. If you're taking the Putnam, please reply to this email and let us know so we can offer your spot to someone else.`
        : `If you're taking the Putnam, please decline your spot from your dashboard so we can offer it to someone else. Otherwise nothing changes — your deadline to accept is still <strong>${deadline}</strong>.`;
    const bodyHtml = `${first}<br><br>${second}`;
    const ctaHref = `${SITE_URL}/ctt/apply/dashboard`;
    return {
        subject: "CTT Application Update: Putnam exam on December 5th",
        html: brandedEmailHtml({ heading, bodyHtml, ctaLabel: "Go to my dashboard", ctaHref }),
        text: brandedEmailText({ heading, bodyText: bodyHtml.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""), ctaLabel: "Go to my dashboard", ctaHref }),
    };
}

async function main() {
    loadEnv();
    const since = process.argv.includes("--since") ? process.argv[process.argv.indexOf("--since") + 1] : new Date().toISOString().slice(0, 10) + "T00:00:00Z";
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const apps = await fetchAllPages((from, to) =>
        sb.from("ctt_applications")
            .select("id,status,offered_at,offer_expires_at,cqg:cqg_profiles!cqg_profile_id(name,email), ctt:ctt_profiles(name,email)")
            .in("status", ["offered", "accepted"]).gte("offered_at", since).order("id").range(from, to)
    );
    const audience = apps.map((a) => ({ ...(a.cqg ?? a.ctt), status: a.status, offer_expires_at: a.offer_expires_at })).filter((p) => p.email);
    console.log(`${audience.length} people with an offer since ${since} (${audience.filter((a) => a.status === "offered").length} offered, ${audience.filter((a) => a.status === "accepted").length} accepted)`);

    if (MODE === "preview") {
        for (const ex of [audience.find((a) => a.status === "offered"), audience.find((a) => a.status === "accepted")].filter(Boolean)) {
            const c = buildContent(ex);
            console.log(`\n=== ${ex.status.toUpperCase()} (${ex.name}) ===\nSubject: ${c.subject}\n--- text/plain ---\n${c.text}`);
        }
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0, failed = 0;
    for (const person of audience) {
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
