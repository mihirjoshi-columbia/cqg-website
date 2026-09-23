// Notifies the 168 Fall 2026 Internal Membership applicants whose
// application I backfilled from the Google Form CSV (NOT the 75 who
// already self-submitted through the app -- they don't need this).
//
// Three variants:
//  - new account (40): mention the account was created + a separate
//    temp-password email is coming + ask them to fill in school/gender
//  - existing, missing something (2): ask them to fill in just that thing
//  - existing, complete (126): confirmation only, no ask
//
// Usage:
//   node scripts/send-application-populated-emails.mjs --preview   (prints one example of each variant, sends nothing)
//   node scripts/send-application-populated-emails.mjs --dry-run   (loops the full audience, logs what would send, sends nothing)
//   node scripts/send-application-populated-emails.mjs --send      (actually sends)

import { readFileSync } from "node:fs";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";

const AUDIENCE_PATH = "/tmp/email_audience_named.json";
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
    const { name, is_new_account, missing_school, missing_gender, missing_resume } = person;
    const loginUrl = `${SITE_URL}/portal/login`;

    const paragraphs = [];
    paragraphs.push(
        `Hi ${name}! Quick note first: the email delivery issues we had earlier this semester are finally fixed, so you should be reliably getting our emails going forward.`
    );
    paragraphs.push(
        `Your Fall 2026 Internal Membership application has been added to your CQG account — we pulled in the accomplishments you submitted. This is completely separate from our application review process — we'll be sending out first-round interview invites later today.`
    );

    if (is_new_account) {
        paragraphs.push(
            `We also created a CQG general body account for you (login: <strong>${person.email}</strong>). A separate email with your temporary password is on its way — use it to log in for the first time. Once you're in, please fill in your <strong>school</strong> and <strong>gender</strong> on your profile — those weren't asked on the application form, so they're currently blank. Everything else is already set.`
        );
    } else if (missing_school || missing_gender || missing_resume) {
        const gaps = [];
        if (missing_school) gaps.push("school");
        if (missing_gender) gaps.push("gender");
        if (missing_resume) gaps.push("resume");
        paragraphs.push(`One thing left: please log in and fill in your <strong>${gaps.join(" and ")}</strong> on your profile — it's currently blank.`);
    } else {
        paragraphs.push(`Nothing else needed on your end — your profile is already complete.`);
    }

    paragraphs.push(`If you run into any trouble logging in, just reply to this email and we'll help sort it out.`);

    const heading = "Your Internal Membership application is on file";
    const bodyHtml = paragraphs.join("<br><br>");
    const bodyText = paragraphs.join("\n\n").replace(/<\/?strong>/g, "");
    return {
        subject: "Your CQG Internal Membership application is on file",
        html: brandedEmailHtml({ heading, bodyHtml, ctaLabel: "Log in", ctaHref: loginUrl }),
        text: brandedEmailText({ heading, bodyText, ctaLabel: "Log in", ctaHref: loginUrl }),
    };
}

async function main() {
    loadEnv();
    const audience = JSON.parse(readFileSync(AUDIENCE_PATH, "utf8"));

    if (MODE === "preview") {
        const examples = [
            audience.find((a) => a.is_new_account),
            audience.find((a) => !a.is_new_account && (a.missing_school || a.missing_gender || a.missing_resume)),
            audience.find((a) => !a.is_new_account && !a.missing_school && !a.missing_gender && !a.missing_resume),
        ];
        for (const ex of examples) {
            const c = buildContent(ex);
            console.log(`\n=== ${ex.is_new_account ? "NEW ACCOUNT" : ex.missing_school || ex.missing_gender || ex.missing_resume ? "EXISTING, HAS GAP" : "EXISTING, COMPLETE"} (${ex.name} <${ex.email}>) ===`);
            console.log("Subject:", c.subject);
            console.log("--- text/plain ---");
            console.log(c.text);
        }
        return;
    }

    const resend = MODE === "send" ? new Resend(process.env.RESEND_API_KEY) : null;
    const replyTo = process.env.RESEND_REPLY_TO;
    let sent = 0, failed = 0;

    for (const person of audience) {
        const c = buildContent(person);
        if (MODE === "dry-run") {
            console.log(`[dry-run] would email ${person.email} (${person.is_new_account ? "new" : "existing"})`);
            sent++;
            continue;
        }
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: person.email,
            subject: c.subject,
            html: c.html,
            text: c.text,
            ...(replyTo ? { replyTo } : {}),
        });
        if (error) {
            console.error(`FAILED for ${person.email}:`, error.message);
            failed++;
        } else {
            sent++;
        }
        // Gentle pacing -- avoid a burst-send pattern (this bit us before with deliverability).
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. sent=${sent} failed=${failed} mode=${MODE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
