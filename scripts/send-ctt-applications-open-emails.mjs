// Announces that CTT applications are open to everyone who already has a CTT
// account. Two variants: verified accounts (log in and apply) and accounts
// that never verified their email (verify first, then apply). Audience is
// read live from the database.
//
//   node scripts/send-ctt-applications-open-emails.mjs --preview   (one example of each, sends nothing)
//   node scripts/send-ctt-applications-open-emails.mjs --dry-run   (loops everyone, sends nothing)
//   node scripts/send-ctt-applications-open-emails.mjs --send
//
// Only send once the cycle is created AND the new form is deployed.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages } from "./lib-paging.mjs";

const SITE_URL = "https://www.columbiaquantgroup.com";
const MODE = process.argv.includes("--send") ? "send" : process.argv.includes("--dry-run") ? "dry-run" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function buildContent(person) {
    const heading = "CTT applications are open";
    const paragraphs = [
        `Hi ${person.name}, applications for the Columbia Trading Tournament (CTT) are now open. CTT is December 5–6, 2026 in New York — we set travel and lodging stipends based on where you're traveling from, and you should expect them to be fully covered. Applications close <strong>October 23 at 11:59 PM ET</strong>.`,
    ];
    let ctaHref;
    if (person.verified) {
        paragraphs.push(`You already have a CTT account, so just log in and complete the application from your dashboard — it only takes a few minutes.`);
        ctaHref = `${SITE_URL}/ctt/apply/dashboard`;
    } else {
        paragraphs.push(`You created a CTT account but never verified your email, so you can't log in yet. Try logging in on the login page and you'll see a "Resend verification email" button — click it, open the link we send you, and then you can complete the application from your dashboard.`);
        ctaHref = `${SITE_URL}/ctt/apply/login`;
    }
    paragraphs.push(`If you run into any trouble, just reply to this email and we'll help sort it out.`);

    return {
        subject: "CTT applications are open",
        html: brandedEmailHtml({ heading, bodyHtml: paragraphs.join("<br><br>"), ctaLabel: person.verified ? "Apply now" : "Go to login", ctaHref }),
        text: brandedEmailText({
            heading,
            bodyText: paragraphs.join("\n\n").replace(/<\/?strong>/g, ""),
            ctaLabel: person.verified ? "Apply now" : "Go to login",
            ctaHref,
        }),
    };
}

async function loadAudience(supabase) {
    const profiles = await fetchAllPages((from, to) =>
        supabase.from("ctt_profiles").select("id,email,name").order("id").range(from, to)
    );
    const users = [];
    for (let page = 1; ; page++) {
        const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        users.push(...data.users);
        if (data.users.length < 200) break;
    }
    const byId = new Map(users.map((u) => [u.id, u]));
    return profiles.map((p) => ({ ...p, verified: Boolean(byId.get(p.id)?.email_confirmed_at) }));
}

async function main() {
    loadEnv();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const audience = await loadAudience(supabase);
    console.log(`${audience.length} CTT accounts (${audience.filter((a) => a.verified).length} verified, ${audience.filter((a) => !a.verified).length} unverified)`);

    if (MODE === "preview") {
        for (const ex of [audience.find((a) => a.verified), audience.find((a) => !a.verified)]) {
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
