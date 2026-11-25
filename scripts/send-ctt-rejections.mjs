// CTT rejection emails, sent through Resend to an explicit list of application ids.
//
//   node scripts/send-ctt-rejections.mjs --ids <ids.json> --preview
//   node scripts/send-ctt-rejections.mjs --ids <ids.json> --test you@example.com
//   node scripts/send-ctt-rejections.mjs --ids <ids.json> --log <log.json> --send
//
// <ids.json> is a JSON array of ctt_applications ids (keep it out of the repo: it is an audience list).
//
// Safety:
//   - Only applications still 'pending' are emailed; anything else is skipped.
//   - After a successful send the application is set to 'rejected' (guarded on status = 'pending').
//   - --log records every id once its email was accepted, and a re-run skips them, so a failed
//     database update can never cause a second email.
//   - --test sends ONE example to the given address and touches nothing else.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { brandedEmailHtml, brandedEmailText } from "./lib-email-template.mjs";
import { fetchAllPages } from "./lib-paging.mjs";

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const MODE = args.includes("--send") ? "send" : arg("--test") ? "test" : "preview";
const IDS_PATH = arg("--ids");
const LOG_PATH = arg("--log");
const DELAY_MS = 600; // stays under Resend's 2 requests/second default

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

const firstName = (full) => (full || "").trim().split(/\s+/)[0] || "there";

function buildContent(name) {
    const heading = "Your CTT application";
    const bodyHtml =
        `Hi ${firstName(name)},<br><br>` +
        `Thank you for applying to the Columbia Trading Tournament (CTT). We received a very large number of strong applications this year ` +
        `and have a limited number of seats, so we're unable to offer you a spot this time.<br><br>` +
        `We truly appreciate the time you put into your application, and we hope you'll apply again the next time applications open. ` +
        `Best of luck with the rest of your semester.<br><br>` +
        `Columbia Quant Group`;
    const bodyText = bodyHtml.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "");
    return {
        subject: "CTT Application Update",
        html: brandedEmailHtml({ heading, bodyHtml }),
        text: brandedEmailText({ heading, bodyText }),
    };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendWithRetry(resend, msg) {
    for (let attempt = 1; attempt <= 4; attempt++) {
        const { data, error } = await resend.emails.send(msg);
        if (!error && data?.id) return data.id;
        const limited = error && (error.statusCode === 429 || /rate/i.test(error.message || ""));
        if (limited && attempt < 4) { await sleep(1500 * attempt); continue; }
        throw new Error(error?.message || "Resend returned no message id");
    }
}

async function main() {
    if (!IDS_PATH) throw new Error("--ids <file> is required");
    loadEnv();
    const ids = JSON.parse(readFileSync(IDS_PATH, "utf8"));
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const apps = await fetchAllPages((from, to) =>
        sb.from("ctt_applications")
            .select("id,status,cqg:cqg_profiles!cqg_profile_id(name,email), ctt:ctt_profiles(name,email)")
            .order("id").range(from, to)
    );
    const wanted = new Set(ids);
    const done = new Set(LOG_PATH && existsSync(LOG_PATH) ? JSON.parse(readFileSync(LOG_PATH, "utf8")).sent : []);
    const audience = apps
        .filter((a) => wanted.has(a.id))
        .map((a) => ({ id: a.id, status: a.status, ...(a.cqg ?? a.ctt ?? {}) }));

    const notPending = audience.filter((p) => p.status !== "pending");
    const noEmail = audience.filter((p) => !p.email);
    const already = audience.filter((p) => done.has(p.id));
    const todo = audience.filter((p) => p.status === "pending" && p.email && !done.has(p.id));
    console.log(`ids given: ${ids.length}, found: ${audience.length}, to email: ${todo.length}, not pending (skipped): ${notPending.length}, no email: ${noEmail.length}, already sent per log: ${already.length}`);

    if (MODE === "preview") {
        const c = buildContent(todo[0]?.name);
        console.log(`\n=== EXAMPLE (${todo[0]?.name}) ===\nSubject: ${c.subject}\nFrom: ${process.env.RESEND_FROM_EMAIL}\n--- text/plain ---\n${c.text}`);
        return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL;
    const replyTo = process.env.RESEND_REPLY_TO;

    if (MODE === "test") {
        const c = buildContent(todo[0]?.name || "Alex Example");
        const id = await sendWithRetry(resend, { from, to: arg("--test"), subject: `[TEST] ${c.subject}`, html: c.html, text: c.text, ...(replyTo ? { replyTo } : {}) });
        console.log(`test sent to ${arg("--test")} (${id}). Nothing else was changed.`);
        return;
    }

    if (!LOG_PATH) throw new Error("--log <file> is required with --send");
    const sent = [...done];
    const failed = [];
    const save = () => writeFileSync(LOG_PATH, JSON.stringify({ sent, failed }, null, 1));
    let n = 0;
    for (const p of todo) {
        const c = buildContent(p.name);
        try {
            await sendWithRetry(resend, { from, to: p.email, subject: c.subject, html: c.html, text: c.text, ...(replyTo ? { replyTo } : {}) });
        } catch (err) {
            failed.push({ id: p.id, error: String(err.message || err) });
            save();
            continue;
        }
        sent.push(p.id); // recorded as soon as the email is accepted
        const { error } = await sb.from("ctt_applications").update({ status: "rejected", decided_at: new Date().toISOString() }).eq("id", p.id).eq("status", "pending");
        if (error) failed.push({ id: p.id, error: `emailed, but status update failed: ${error.message}` });
        save();
        if (++n % 25 === 0) console.log(`  ${n}/${todo.length} sent`);
        await sleep(DELAY_MS);
    }
    console.log(`done. emailed: ${n}, failed: ${failed.length}. log: ${LOG_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
