// Asks non-Columbia CTT applicants who said "Yes" to the old combined travel &
// housing question to answer the two new questions (travel, lodging) from their
// dashboard. Applicants who said "No" are recorded as No/No instead of emailed.
//
//   node scripts/send-ctt-travel-lodging-emails.mjs --preview
//   node scripts/send-ctt-travel-lodging-emails.mjs --dry-run
//   node scripts/send-ctt-travel-lodging-emails.mjs --send
//
// Run only after migration 0012 is applied and the new dashboard form is deployed.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages, fetchByIds } from "./lib-paging.mjs";

const SITE_URL = "https://www.columbiaquantgroup.com";
const MODE = process.argv.includes("--send") ? "send" : process.argv.includes("--dry-run") ? "dry-run" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function buildContent(name) {
    const heading = "Two quick questions about your CTT application";
    const paragraphs = [
        `Hi ${name}, thanks for applying to the Columbia Trading Tournament. We've split our travel & housing question into two separate questions, so we need you to answer them again.`,
        `Please log in and answer both: <strong>will you need travel accommodations?</strong> and <strong>will you need lodging accommodations?</strong> Your application is otherwise unchanged — you don't need to resubmit anything. It takes about 30 seconds, and the questions are on your dashboard.`,
        `Please answer by <strong>October 23 at 11:59 PM ET</strong>. We set travel and lodging stipends based on where you're traveling from — you should expect them to be fully covered.`,
        `If you run into any trouble, just reply to this email and we'll help sort it out.`,
    ];
    const ctaHref = `${SITE_URL}/ctt/apply/dashboard`;
    return {
        subject: "CTT application: two quick questions about travel and lodging",
        html: brandedEmailHtml({ heading, bodyHtml: paragraphs.join("<br><br>"), ctaLabel: "Answer the questions", ctaHref }),
        text: brandedEmailText({ heading, bodyText: paragraphs.join("\n\n").replace(/<\/?strong>/g, ""), ctaLabel: "Answer the questions", ctaHref }),
    };
}

async function main() {
    loadEnv();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // "No" to the combined question = no travel and no lodging. Idempotent; also
    // catches anyone who applied between the migration and the deploy.
    if (MODE === "send") {
        const { error } = await supabase
            .from("ctt_applications")
            .update({ travel_needed: false, lodging_needed: false })
            .eq("applicant_type", "external")
            .eq("travel_housing_needed", false)
            .is("travel_needed", null);
        if (error) throw error;
    }

    const apps = await fetchAllPages((from, to) =>
        supabase
            .from("ctt_applications")
            .select("id,ctt_profile_id,travel_needed,lodging_needed,travel_housing_needed")
            .eq("applicant_type", "external")
            .eq("travel_housing_needed", true)
            .or("travel_needed.is.null,lodging_needed.is.null")
            .order("id")
            .range(from, to)
    );

    const audience = await fetchByIds(
        [...new Set(apps.map((a) => a.ctt_profile_id))],
        (chunk) => supabase.from("ctt_profiles").select("id,email,name").in("id", chunk)
    );
    console.log(`${audience.length} applicants to email`);

    if (MODE === "preview") {
        const c = buildContent(audience[0].name);
        console.log(`\nSubject: ${c.subject}\n--- text/plain ---\n${c.text}`);
        return;
    }

    const resend = MODE === "send" ? new Resend(process.env.RESEND_API_KEY) : null;
    let sent = 0, failed = 0;
    for (const p of audience) {
        if (MODE === "dry-run") { console.log(`[dry-run] would email ${p.email}`); sent++; continue; }
        const c = buildContent(p.name);
        const { error: sendErr } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL, to: p.email, subject: c.subject, html: c.html, text: c.text,
            ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
        });
        if (sendErr) { console.error(`FAILED for ${p.email}:`, sendErr.message); failed++; } else sent++;
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. sent=${sent} failed=${failed} mode=${MODE}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
