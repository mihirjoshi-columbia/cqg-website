// One-off import: Fall 2026 Internal Membership applicants were collected
// via a Google Form (not the app's own signup/application flow) and
// reviewed in a spreadsheet. This backfills the app's database from that
// spreadsheet's CSV export so the admin dashboard reflects reality:
//   - creates a cqg_profiles account (+ auth user, temp password) for every
//     applicant who doesn't already have a CQG account
//   - records every applicant's submission as a cqg_membership_applications
//     row against the Fall 2026 cycle (accomplishments = the 5 achievement
//     fields), whether or not they already had an account
//
// Deliberately does NOT touch resumes (handled separately -- the Drive
// links require an authenticated Google session, not a service-role fetch)
// or any field on an already-existing profile.
//
// Usage: node scripts/import-fall2026-applications.mjs [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CSV_PATH =
    "/Users/nicolepi/Downloads/CQG 26-27 Membership Application (Responses) - Form Responses 1 (1).csv";
const CYCLE_ID = "a1318e86-fc63-4f7a-89e3-d3c6fcf23342"; // Fall 2026 Internal Recruitment
const OUTPUT_PATH = new URL("./fall2026-import-output.csv", import.meta.url).pathname;

const DRY_RUN = process.argv.includes("--dry-run");

// Manually-resolved edge cases from the CUID Email column (see conversation
// with the admin for the reasoning behind each).
const EMAIL_FIXES = {
    "km4262@gmail.com": "km4262@columbia.edu", // Kai Machamer -- UNI typed with the wrong domain
    djs2306: "djs2306@columbia.edu", // David Shim -- UNI typed with no domain at all
};
const SKIP_EMAILS = new Set([
    "beresw@rpi.edu", // Liam Beresford -- RPI, not Columbia/Barnard; can't get a CQG account
]);

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2];
    }
}

// Minimal RFC4180 CSV parser -- handles quoted fields with embedded commas
// and newlines, which this export has (multi-paragraph achievement text).
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (c === "\r") {
            // skip, \n handles the row break
        } else {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

function rowsToObjects(rows) {
    const header = rows[0];
    return rows
        .slice(1)
        .filter((r) => r.some((cell) => cell.trim() !== ""))
        .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function mapGradYear(raw) {
    const s = raw.trim();
    if (!s) return "";
    if (s.includes("/")) {
        // "Fall 2029/Spring 2030" -> take the later (Spring) term
        const parts = s.split("/").map((p) => p.trim());
        return parts[parts.length - 1];
    }
    if (/^\d{4}$/.test(s)) return `Spring ${s}`;
    return s;
}

function genPassword() {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/l/I
    const bytes = randomBytes(14);
    let out = "";
    for (let i = 0; i < 14; i++) out += alphabet[bytes[i] % alphabet.length];
    return out;
}

function parseSheetTime(raw) {
    // "9/14/2026 21:10:01" -- M/D/YYYY H:MM:SS, no timezone info in the
    // export. Treated as-is (informational submitted_at only, not used for
    // any deadline logic).
    const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (!m) return new Date().toISOString();
    const [, mo, d, y, h, mi, se] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se)).toISOString();
}

async function main() {
    loadEnv();
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const csvText = readFileSync(CSV_PATH, "utf8");
    const allRows = rowsToObjects(parseCsv(csvText));
    console.log(`Parsed ${allRows.length} rows from CSV.`);

    const { data: existingProfiles, error: profErr } = await supabase
        .from("cqg_profiles")
        .select("id,email");
    if (profErr) throw profErr;
    const profileByEmail = new Map(existingProfiles.map((p) => [p.email.toLowerCase(), p]));

    const { data: existingApps, error: appErr } = await supabase
        .from("cqg_membership_applications")
        .select("profile_id")
        .eq("cycle_id", CYCLE_ID);
    if (appErr) throw appErr;
    const appliedProfileIds = new Set(existingApps.map((a) => a.profile_id));

    const results = { created: [], reusedExisting: [], skipped: [], applicationsInserted: 0, applicationsSkipped: 0 };
    const newAccountsOutput = [];

    for (const row of allRows) {
        const rawEmail = row["CUID Email (@columbia.edu or @barnard.edu)"].trim().toLowerCase();
        if (SKIP_EMAILS.has(rawEmail)) {
            results.skipped.push({ name: row.Name, email: rawEmail, reason: "not columbia/barnard" });
            continue;
        }
        const email = (EMAIL_FIXES[rawEmail] || rawEmail).toLowerCase();

        let profile = profileByEmail.get(email);
        let profileId;

        if (profile) {
            profileId = profile.id;
            results.reusedExisting.push({ name: row.Name, email });
        } else {
            const tempPassword = genPassword();
            if (DRY_RUN) {
                console.log(`[dry-run] would create auth user + profile for ${email} (${row.Name})`);
                profileId = `dry-run-${email}`;
            } else {
                const { data: created, error: createErr } = await supabase.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                });
                if (createErr) {
                    console.error(`FAILED to create auth user for ${email}:`, createErr.message);
                    results.skipped.push({ name: row.Name, email, reason: `auth create failed: ${createErr.message}` });
                    continue;
                }
                profileId = created.user.id;

                const { error: insertErr } = await supabase.from("cqg_profiles").insert({
                    id: profileId,
                    email,
                    name: row.Name,
                    school: null,
                    grad_program: null,
                    year: mapGradYear(row["Intended Graduation Date"]),
                    major: row["Intended Major(s)"],
                    gender: null,
                    resume_path: null,
                    tier: "general_body",
                });
                if (insertErr) {
                    console.error(`FAILED to insert profile for ${email}:`, insertErr.message);
                    await supabase.auth.admin.deleteUser(profileId);
                    results.skipped.push({ name: row.Name, email, reason: `profile insert failed: ${insertErr.message}` });
                    continue;
                }
            }
            profileByEmail.set(email, { id: profileId, email });
            results.created.push({ name: row.Name, email });
            newAccountsOutput.push({ name: row.Name, email, password: tempPassword });
        }

        // Membership application record (all rows, new or existing profile)
        if (appliedProfileIds.has(profileId)) {
            results.applicationsSkipped++;
            continue;
        }
        const accomplishments = ["Achievement #1", "Achievement #2", "Achievement #3", "Achievement #4", "Achievement #5"]
            .map((k) => row[k].trim())
            .filter((v) => v.length > 0);

        if (DRY_RUN) {
            console.log(`[dry-run] would insert membership application for ${email} (${accomplishments.length} accomplishments)`);
            results.applicationsInserted++;
        } else {
            const { error: appInsertErr } = await supabase.from("cqg_membership_applications").insert({
                profile_id: profileId,
                cycle_id: CYCLE_ID,
                status: "pending",
                accomplishments,
                submitted_at: parseSheetTime(row.Time),
            });
            if (appInsertErr) {
                console.error(`FAILED to insert membership application for ${email}:`, appInsertErr.message);
            } else {
                results.applicationsInserted++;
                appliedProfileIds.add(profileId);
            }
        }
    }

    console.log("\n=== Summary ===");
    console.log("New accounts created:", results.created.length);
    console.log("Existing accounts reused (application only):", results.reusedExisting.length);
    console.log("Skipped:", results.skipped.length, results.skipped);
    console.log("Membership applications inserted:", results.applicationsInserted);
    console.log("Membership applications already present (skipped):", results.applicationsSkipped);

    if (!DRY_RUN && newAccountsOutput.length > 0) {
        const csvLines = ["name,email,temp_password"];
        for (const r of newAccountsOutput) {
            csvLines.push(`"${r.name.replace(/"/g, '""')}",${r.email},${r.password}`);
        }
        writeFileSync(OUTPUT_PATH, csvLines.join("\n"), "utf8");
        console.log(`\nWrote ${newAccountsOutput.length} temp passwords to ${OUTPUT_PATH}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
