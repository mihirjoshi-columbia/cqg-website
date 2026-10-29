// Last-call email to CQG (Columbia/Barnard) General Body accounts that aren't grad students and
// have no CTT application in the open cycle: applications close at 11:59 PM ET tonight. Two
// variants: verified accounts (log in and apply) and accounts that never verified their email
// (use "Forgot password?", which also verifies the address). The audience is read live, so
// anyone who applies in the meantime is skipped. Internal Members, Senior Advisors and admins
// can't apply and are excluded; so are grad students (a blank school is included).
//
//   node scripts/send-cqg-ctt-deadline-emails.mjs --preview   (one example of each, sends nothing)
//   node scripts/send-cqg-ctt-deadline-emails.mjs --dry-run   (lists everyone, sends nothing)
//   node scripts/send-cqg-ctt-deadline-emails.mjs --send
//
// Refuses to run unless the cycle is open and closes within the next 24 hours.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages } from "./lib-paging.mjs";

const SITE_URL = "https://www.columbiaquantgroup.com";
const SUBJECT = "Apply to CTT by 11:59 PM ET Tonight!";
const MODE = process.argv.includes("--send") ? "send" : process.argv.includes("--dry-run") ? "dry-run" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function buildContent(person) {
    const heading = "CTT applications close tonight";
    const paragraphs = [
        `Hi ${person.name}, applications for CTT, the trading competition we host December 5–6, 2026 in Low Library, close tonight at <strong>11:59 PM ET</strong>, and you haven't applied yet.`,
    ];
    let ctaHref;
    if (person.verified) {
        paragraphs.push(`Log in to your CQG portal and complete the application from your dashboard!`);
        ctaHref = `${SITE_URL}/portal/dashboard`;
    } else {
        paragraphs.push(`You haven't verified your email yet, so you can't log in. Go to the CQG login page, click "Forgot password?", and open the link we email you — setting a new password also verifies your account. Then log in and complete the application from your dashboard!`);
        ctaHref = `${SITE_URL}/portal/login`;
    }
    paragraphs.push(`If you run into any trouble, just reply to this email and we'll help sort it out.`);

    const ctaLabel = person.verified ? "Apply now" : "Go to login";
    return {
        subject: SUBJECT,
        html: brandedEmailHtml({ heading, bodyHtml: paragraphs.join("<br><br>"), ctaLabel, ctaHref }),
        text: brandedEmailText({ heading, bodyText: paragraphs.join("\n\n").replace(/<\/?strong>/g, ""), ctaLabel, ctaHref }),
    };
}

async function loadAudience(supabase) {
    const now = new Date();
    const { data: cycle } = await supabase
        .from("ctt_cycles")
        .select("*")
        .lte("opens_at", now.toISOString())
        .gte("closes_at", now.toISOString())
        .order("opens_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!cycle) throw new Error("No CTT cycle is open right now; not sending.");
    const hoursLeft = (new Date(cycle.closes_at) - now) / 36e5;
    if (hoursLeft > 24) throw new Error(`The cycle closes in ${hoursLeft.toFixed(1)} hours, not tonight; not sending.`);
    console.log(`Cycle "${cycle.label}" closes ${cycle.closes_at} (${hoursLeft.toFixed(1)}h from now)`);

    const profiles = await fetchAllPages((from, to) =>
        supabase.from("cqg_profiles").select("id,email,name,school,tier").eq("tier", "general_body").order("id").range(from, to)
    );
    const apps = await fetchAllPages((from, to) =>
        supabase.from("ctt_applications").select("id,cqg_profile_id").eq("cycle_id", cycle.id).order("id").range(from, to)
    );
    const applied = new Set(apps.map((a) => a.cqg_profile_id).filter(Boolean));

    const users = [];
    for (let page = 1; ; page++) {
        const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        users.push(...data.users);
        if (data.users.length < 200) break;
    }
    const byId = new Map(users.map((u) => [u.id, u]));
    return profiles
        .filter((p) => p.school !== "GRAD" && !applied.has(p.id))
        .map((p) => ({ ...p, verified: Boolean(byId.get(p.id)?.email_confirmed_at) }));
}

async function main() {
    loadEnv();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const audience = await loadAudience(supabase);
    console.log(`${audience.length} General Body undergrad accounts with no CTT application (${audience.filter((a) => a.verified).length} verified, ${audience.filter((a) => !a.verified).length} unverified)`);

    if (MODE === "preview") {
        for (const ex of [audience.find((a) => a.verified), audience.find((a) => !a.verified)].filter(Boolean)) {
            const c = buildContent(ex);
            console.log(`\n=== ${ex.verified ? "VERIFIED" : "UNVERIFIED"} (${ex.name}) ===\nSubject: ${c.subject}\n--- text/plain ---\n${c.text}`);
        }
        return;
    }

    const resend = MODE === "send" ? new Resend(process.env.RESEND_API_KEY) : null;
    let sent = 0, failed = 0;
    for (const person of audience) {
        if (MODE === "dry-run") { console.log(`[dry-run] would email ${person.email} (${person.verified ? "verified" : "unverified"})`); sent++; continue; }
        const c = buildContent(person);
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL, to: person.email, subject: c.subject, html: c.html, text: c.text,
            ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
        });
        if (error) { console.error(`FAILED for ${person.email}:`, error.message); failed++; } else sent++;
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. sent=${sent} failed=${failed} mode=${MODE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
