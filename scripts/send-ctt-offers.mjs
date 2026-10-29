// Offers CTT spots to everyone on the "external final" and "columbia final" lists: sets their
// application to 'offered' with a 24-hour deadline and emails them. Mirrors offerSpot() in
// lib/ctt-offers.ts (the admin page's "Offer spot" button), including undoing the offer if the
// email fails.
//
//   node scripts/send-ctt-offers.mjs --external <external.csv> --columbia <columbia.csv> --preview
//   node scripts/send-ctt-offers.mjs --external ... --columbia ... --dry-run   (match + list, sends nothing)
//   node scripts/send-ctt-offers.mjs --external ... --columbia ... --send
//
// Run only after migration 0014 is applied and the new dashboards are deployed. Only applications
// that are still 'pending' are offered; anyone else on a list is reported and skipped.
//
// People whose account was created for them (scripts/create-ctt-accounts.mjs; details_complete = false)
// get an extra paragraph: how to log in (Forgot password?) and that they still need to finish their
// application. Run after migration 0015 too.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages } from "./lib-paging.mjs";

const SITE_URL = "https://www.columbiaquantgroup.com";
const OFFER_HOURS = 24;
const MODE = process.argv.includes("--send") ? "send" : process.argv.includes("--dry-run") ? "dry-run" : "preview";
const arg = (name) => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

// Minimal CSV reader (quoted fields, "" escapes, CRLF) -> array of rows.
function parseCsv(text) {
    const rows = []; let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') quoted = false;
            else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === ",") { row.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
        else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
}

// Every address in the file: the column headed like "email" if there is one, else any cell containing "@".
function emailsFrom(path) {
    const rows = parseCsv(readFileSync(path, "utf8").replace(/^﻿/, ""));
    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = header.findIndex((h) => /e-?mail/.test(h));
    const found = new Set();
    for (const r of rows.slice(1)) {
        const cells = col >= 0 ? [r[col] ?? ""] : r;
        for (const c of cells) { const m = c.match(/[^\s,;<>"]+@[^\s,;<>"]+\.[a-z]{2,}/i); if (m) found.add(m[0].toLowerCase()); }
    }
    return [...found];
}

function formatDeadline(iso) {
    const tz = "America/New_York", d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: tz }).format(d);
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz }).format(d);
    return `${day} at ${time} ET`;
}

function buildContent(name, deadline, ctaHref, newAccount) {
    const heading = "You're accepted!";
    let bodyHtml =
        `Hi ${name}, congratulations — you've been accepted to the Columbia Trading Tournament (CTT), December 5–6, 2026 in Low Library.<br><br>` +
        `To hold your spot, please accept within 24 hours — by <strong>${deadline}</strong>. If we don't hear from you by then, your spot will be offered to someone else.`;
    let ctaLabel = "Accept my spot";
    if (newAccount) {
        bodyHtml +=
            `<br><br>We've created a CTT account for you with this email address. To log in, go to the login page, click "Forgot password?", ` +
            `and use the link we email you to set a password. You'll then upload your resume and finish your application from your dashboard — ` +
            `it's just a few quick questions.`;
        ctaLabel = "Go to login";
        ctaHref = ctaHref.replace(/\/dashboard$/, "/login");
    }
    return {
        subject: "CTT Application Update",
        html: brandedEmailHtml({ heading, bodyHtml, ctaLabel, ctaHref }),
        text: brandedEmailText({ heading, bodyText: bodyHtml.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""), ctaLabel, ctaHref }),
    };
}

async function main() {
    const externalPath = arg("--external"), columbiaPath = arg("--columbia");
    if (!externalPath || !columbiaPath) throw new Error("Pass --external <csv> and --columbia <csv>.");
    loadEnv();
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: cycle } = await sb.from("ctt_cycles").select("*").order("opens_at", { ascending: false }).limit(1).maybeSingle();
    if (!cycle) throw new Error("No CTT cycle exists.");
    console.log(`Cycle: ${cycle.label}`);

    const lists = { external: emailsFrom(externalPath), columbia: emailsFrom(columbiaPath) };
    console.log(`External list: ${lists.external.length} emails; Columbia list: ${lists.columbia.length} emails`);

    // application rows for the cycle, with the applicant attached
    const apps = await fetchAllPages((from, to) =>
        sb.from("ctt_applications")
            .select("id,status,applicant_type,details_complete,cqg:cqg_profiles!cqg_profile_id(name,email), ctt:ctt_profiles(name,email)")
            .eq("cycle_id", cycle.id).order("id").range(from, to)
    );
    const byEmail = new Map();
    for (const a of apps) { const p = a.cqg ?? a.ctt; if (p) byEmail.set(p.email.toLowerCase(), { ...a, name: p.name, email: p.email }); }

    const targets = [], problems = [];
    for (const [kind, emails] of Object.entries(lists)) {
        for (const email of emails) {
            const a = byEmail.get(email);
            if (!a) problems.push(`${kind}: ${email} has no application in this cycle`);
            else if (a.status !== "pending") problems.push(`${kind}: ${email} is '${a.status}', not pending`);
            else if (kind === "external" && a.applicant_type !== "external") problems.push(`${kind}: ${email} is a Columbia/Barnard applicant`);
            else if (kind === "columbia" && a.applicant_type !== "cqg_member") problems.push(`${kind}: ${email} is an external applicant`);
            else targets.push({ ...a, kind });
        }
    }
    const dupes = targets.filter((t, i) => targets.findIndex((u) => u.id === t.id) !== i);
    console.log(`\n${targets.length} to offer (${targets.filter((t) => !t.details_complete).length} with a new account)\n${targets.length} total (${targets.filter((t) => t.kind === "external").length} external, ${targets.filter((t) => t.kind === "columbia").length} Columbia/Barnard)`);
    if (dupes.length) console.log(`WARNING: ${dupes.length} appear on both lists`);
    if (problems.length) console.log(`\n${problems.length} skipped:\n  ${problems.join("\n  ")}`);

    if (MODE === "preview") {
        for (const ex of [targets.find((t) => t.details_complete), targets.find((t) => !t.details_complete)].filter(Boolean)) {
            const c = buildContent(ex.name, formatDeadline(new Date(Date.now() + OFFER_HOURS * 36e5).toISOString()), `${SITE_URL}/ctt/apply/dashboard`, !ex.details_complete);
            console.log(`\n=== EXAMPLE: ${ex.details_complete ? "existing account" : "account created for them"} (${ex.name}) ===\nSubject: ${c.subject}\n--- text/plain ---\n${c.text}`);
        }
        return;
    }
    if (MODE === "dry-run") { for (const t of targets) console.log(`[dry-run] would offer ${t.email} (${t.kind})`); return; }

    const resend = new Resend(process.env.RESEND_API_KEY);
    let sent = 0, failed = 0;
    for (const t of targets) {
        const offeredAt = new Date(), expiresAt = new Date(offeredAt.getTime() + OFFER_HOURS * 36e5);
        const { error: upErr } = await sb.from("ctt_applications").update({ status: "offered", offered_at: offeredAt.toISOString(), offer_expires_at: expiresAt.toISOString(), responded_at: null }).eq("id", t.id).eq("status", "pending");
        if (upErr) { console.error(`FAILED to save offer for ${t.email}:`, upErr.message); failed++; continue; }
        const href = `${SITE_URL}${t.applicant_type === "cqg_member" ? "/portal/dashboard" : "/ctt/apply/dashboard"}`;
        const c = buildContent(t.name, formatDeadline(expiresAt.toISOString()), href, !t.details_complete);
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL, to: t.email, subject: c.subject, html: c.html, text: c.text,
            ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
        });
        if (error) {
            console.error(`FAILED email for ${t.email}: ${error.message} (undoing the offer)`);
            await sb.from("ctt_applications").update({ status: "pending", offered_at: null, offer_expires_at: null }).eq("id", t.id);
            failed++;
        } else sent++;
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. offered+emailed=${sent} failed=${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
