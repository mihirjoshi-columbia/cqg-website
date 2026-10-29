// Creates CTT accounts, with a pre-filled but incomplete application, for people who were selected
// but never applied. Each gets: a verified auth user (random password they never see; they set
// their own through "Forgot password?"), a ctt_profiles row, and a pending ctt_applications row
// for the latest cycle with details_complete = false and the sheet's college / major / graduation
// year filled in. The offer email (scripts/send-ctt-offers.mjs) tells them how to log in.
//
//   node scripts/create-ctt-accounts.mjs <people.csv> --preview|--create
//
// CSV columns: Name, Email, College, Expected grad, Major. Run after migrations 0014 and 0015.
// Safe to re-run: anyone who already has a CTT profile is skipped.

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const csvPath = process.argv[2];
const MODE = process.argv.includes("--create") ? "create" : "preview";

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

function parseCsv(text) {
    const rows = []; let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c; }
        else if (c === '"') quoted = true;
        else if (c === ",") { row.push(cell); cell = ""; }
        else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
        else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
}

async function main() {
    if (!csvPath) throw new Error("Usage: node scripts/create-ctt-accounts.mjs <people.csv> --preview|--create");
    loadEnv();
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: cycle } = await sb.from("ctt_cycles").select("*").order("opens_at", { ascending: false }).limit(1).maybeSingle();
    if (!cycle) throw new Error("No CTT cycle exists.");

    const [header, ...rows] = parseCsv(readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
    const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
    const idx = { name: col("name"), email: col("email"), college: col("college"), grad: col("expected grad"), major: col("major") };
    const people = rows.map((r) => ({ name: r[idx.name].trim(), email: r[idx.email].trim().toLowerCase(), college: r[idx.college]?.trim() ?? "", gradYear: r[idx.grad]?.trim() ?? "", major: r[idx.major]?.trim() ?? "" }));
    console.log(`Cycle: ${cycle.label}. ${people.length} people in the file.`);

    for (const p of people) {
        const { data: existing } = await sb.from("ctt_profiles").select("id").eq("email", p.email).maybeSingle();
        if (existing) {
            // They made their own account but never submitted an application: give them the pre-filled, incomplete one.
            const { data: app } = await sb.from("ctt_applications").select("id").eq("ctt_profile_id", existing.id).eq("cycle_id", cycle.id).maybeSingle();
            if (app) { console.log(`SKIP ${p.name} <${p.email}>: already has a CTT account and an application`); continue; }
            console.log(`${MODE === "create" ? "ADD APPLICATION for" : "would add an application for"} ${p.name} <${p.email}> (account already exists) | ${p.college} | ${p.major} | ${p.gradYear}`);
            if (MODE === "create") {
                const { error } = await sb.from("ctt_applications").insert({
                    cycle_id: cycle.id, applicant_type: "external", cqg_profile_id: null, ctt_profile_id: existing.id,
                    college: p.college, major: p.major, grad_year: p.gradYear, country: "United States", gender: "",
                    prior_internship: false, internship_lined_up: false, details_complete: false,
                });
                if (error) console.error(`  FAILED application: ${error.message}`);
            }
            continue;
        }
        const { data: cqg } = await sb.from("cqg_profiles").select("id").eq("email", p.email).maybeSingle();
        if (cqg) { console.log(`SKIP ${p.name} <${p.email}>: that address is a Columbia/Barnard CQG account`); continue; }
        console.log(`${MODE === "create" ? "CREATE" : "would create"} ${p.name} <${p.email}> | ${p.college} | ${p.major} | ${p.gradYear}`);
        if (MODE !== "create") continue;

        const { data: created, error: userErr } = await sb.auth.admin.createUser({ email: p.email, password: randomBytes(24).toString("base64url"), email_confirm: true });
        if (userErr || !created?.user) { console.error(`  FAILED auth user: ${userErr?.message}`); continue; }
        const id = created.user.id;
        const { error: profErr } = await sb.from("ctt_profiles").insert({ id, email: p.email, name: p.name, attestation: false });
        if (profErr) { console.error(`  FAILED profile: ${profErr.message}`); await sb.auth.admin.deleteUser(id); continue; }
        const { error: appErr } = await sb.from("ctt_applications").insert({
            cycle_id: cycle.id, applicant_type: "external", cqg_profile_id: null, ctt_profile_id: id,
            college: p.college, major: p.major, grad_year: p.gradYear, country: "United States", gender: "",
            prior_internship: false, internship_lined_up: false, details_complete: false,
        });
        if (appErr) { console.error(`  FAILED application: ${appErr.message}`); await sb.from("ctt_profiles").delete().eq("id", id); await sb.auth.admin.deleteUser(id); }
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
