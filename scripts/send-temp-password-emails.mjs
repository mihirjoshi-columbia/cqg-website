// Sends the 40 newly-created accounts their login email + temp password.
// Deliberately a separate email from send-application-populated-emails.mjs
// (per the admin's instruction) so the password isn't sitting in the same
// message as everything else.
//
// Usage:
//   node scripts/send-temp-password-emails.mjs --preview   (prints one example, sends nothing)
//   node scripts/send-temp-password-emails.mjs --dry-run   (loops the full list, logs what would send, sends nothing)
//   node scripts/send-temp-password-emails.mjs --send      (actually sends)

import { readFileSync } from "node:fs";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";

const OUTPUT_CSV_PATH = new URL("./fall2026-import-output.csv", import.meta.url).pathname;
const SITE_URL = "https://www.columbiaquantgroup.com";
const MODE = process.argv.includes("--send") ? "send" : process.argv.includes("--dry-run") ? "dry-run" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function parseOutputCsv(text) {
    // simple format written by import-fall2026-applications.mjs: name,email,temp_password
    // name field may be quoted
    const lines = text.trim().split("\n").slice(1);
    return lines.map((line) => {
        const m = line.match(/^"((?:[^"]|"")*)",([^,]+),(.+)$/);
        if (m) return { name: m[1].replace(/""/g, '"'), email: m[2], password: m[3] };
        const parts = line.split(",");
        return { name: parts[0], email: parts[1], password: parts[2] };
    });
}

function buildContent(person) {
    const loginUrl = `${SITE_URL}/portal/login`;
    const body =
        `Hi ${person.name}, your CQG general body account is ready. Log in with:` +
        `<br><br>Email: <strong>${person.email}</strong>` +
        `<br>Temporary password: <strong>${person.password}</strong>` +
        `<br><br>You can change your password any time from the login page's "Forgot password" link. ` +
        `If you run into any trouble logging in, just reply to this email and we'll help sort it out.`;

    const heading = "Your CQG account is ready";
    return {
        subject: "Your CQG account is ready — temporary password inside",
        html: brandedEmailHtml({ heading, bodyHtml: body, ctaLabel: "Log in", ctaHref: loginUrl }),
        text: brandedEmailText({
            heading,
            bodyText: `Hi ${person.name}, your CQG general body account is ready. Log in with:\n\nEmail: ${person.email}\nTemporary password: ${person.password}\n\nYou can change your password any time from the login page's "Forgot password" link. If you run into any trouble logging in, just reply to this email and we'll help sort it out.`,
            ctaLabel: "Log in",
            ctaHref: loginUrl,
        }),
    };
}

async function main() {
    loadEnv();
    const people = parseOutputCsv(readFileSync(OUTPUT_CSV_PATH, "utf8"));
    console.log(`${people.length} new accounts to email.`);

    if (MODE === "preview") {
        const c = buildContent(people[0]);
        console.log("Subject:", c.subject);
        console.log("--- text/plain ---");
        console.log(c.text);
        return;
    }

    const resend = MODE === "send" ? new Resend(process.env.RESEND_API_KEY) : null;
    const replyTo = process.env.RESEND_REPLY_TO;
    let sent = 0, failed = 0;

    for (const person of people) {
        const c = buildContent(person);
        if (MODE === "dry-run") {
            console.log(`[dry-run] would email ${person.email}`);
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
        await new Promise((r) => setTimeout(r, 400));
    }
    console.log(`\nDone. sent=${sent} failed=${failed} mode=${MODE}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
