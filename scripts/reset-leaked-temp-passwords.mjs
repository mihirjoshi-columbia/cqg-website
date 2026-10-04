// scripts/fall2026-import-output.csv (plaintext temp passwords for 40 accounts)
// was committed to the public repo. This replaces every one of those
// accounts' passwords with a fresh random one and emails it to the owner.
// New passwords are never written to disk or printed.
//
// Usage: node scripts/reset-leaked-temp-passwords.mjs [--dry-run]

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const CSV_PATH = new URL("./fall2026-import-output.csv", import.meta.url).pathname;
const LOGIN_URL = "https://www.columbiaquantgroup.com/portal/login";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function genPassword() {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const bytes = randomBytes(16);
    let out = "";
    for (let i = 0; i < 16; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

function buildContent(name, email, password) {
    const heading = "Your temporary password has been replaced";
    const intro = `Hi ${name}, as a security precaution we've replaced the temporary password we sent you earlier for your CQG account. The old one no longer works.`;
    const creds = `Log in with:<br><br>Email: <strong>${email}</strong><br>New temporary password: <strong>${password}</strong>`;
    const outro = `If you had already set your own password, this replaces it too — you can choose a new one any time with "Forgot password" on the login page. If you run into any trouble logging in, just reply to this email and we'll help sort it out.`;
    return {
        subject: "Your CQG account: new temporary password",
        html: brandedEmailHtml({ heading, bodyHtml: [intro, creds, outro].join("<br><br>"), ctaLabel: "Log in", ctaHref: LOGIN_URL }),
        text: brandedEmailText({
            heading,
            bodyText: [intro, `Log in with:\n\nEmail: ${email}\nNew temporary password: ${password}`, outro.replace(/<[^>]+>/g, "")].join("\n\n"),
            ctaLabel: "Log in",
            ctaHref: LOGIN_URL,
        }),
    };
}

async function main() {
    loadEnv();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emails = readFileSync(CSV_PATH, "utf8").trim().split("\n").slice(1).map((l) => l.split(",")[1].trim().toLowerCase());
    console.log(`${emails.length} accounts in scope`);

    const { data: profiles, error: pErr } = await supabase.from("cqg_profiles").select("id,email,name").in("email", emails);
    if (pErr) throw pErr;
    const byEmail = new Map(profiles.map((p) => [p.email.toLowerCase(), p]));

    let rotated = 0, emailed = 0;
    const emailFailed = [], missing = [];
    for (const email of emails) {
        const p = byEmail.get(email);
        if (!p) { missing.push(email); continue; }
        if (DRY_RUN) { console.log(`[dry-run] would rotate + email ${email}`); rotated++; emailed++; continue; }

        const password = genPassword();
        const { error: upErr } = await supabase.auth.admin.updateUserById(p.id, { password });
        if (upErr) { console.error(`FAILED to rotate ${email}: ${upErr.message}`); missing.push(email); continue; }
        rotated++;

        const c = buildContent(p.name, email, password);
        let ok = false;
        for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
            const { error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL, to: email, subject: c.subject, html: c.html, text: c.text,
                ...(process.env.RESEND_REPLY_TO ? { replyTo: process.env.RESEND_REPLY_TO } : {}),
            });
            if (!error) ok = true; else await new Promise((r) => setTimeout(r, 1500));
        }
        if (ok) emailed++; else emailFailed.push(email);
        await new Promise((r) => setTimeout(r, 400));
    }

    console.log(`\nrotated=${rotated} emailed=${emailed}`);
    if (emailFailed.length) console.log("ROTATED BUT EMAIL FAILED (owner is locked out, needs a manual reset):", emailFailed);
    if (missing.length) console.log("not rotated:", missing);
}

main().catch((e) => { console.error(e); process.exit(1); });
