// Uploads the resumes matched (by scripts/resume matching pass) to Supabase
// Storage and sets resume_path, for people who didn't already have a
// resume on file. Reads /tmp/resumes_extract/matched_FINAL.json (built by
// hand during the matching pass -- see conversation) and the extracted PDF
// files alongside it.
//
// Usage: node scripts/upload-matched-resumes.mjs [--dry-run]

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MATCHED_PATH = "/tmp/resumes_extract/matched_FINAL.json";
const EXTRACT_DIR = "/tmp/resumes_extract";
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2];
    }
}

async function main() {
    loadEnv();
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const matched = JSON.parse(readFileSync(MATCHED_PATH, "utf8"));
    console.log(`${matched.length} matched resumes to upload.`);

    // Re-check current resume_path state right before writing, in case
    // anything changed since the matching pass was built.
    const { data: profiles, error: profErr } = await supabase
        .from("cqg_profiles")
        .select("id,resume_path");
    if (profErr) throw profErr;
    const resumeByProfileId = new Map(profiles.map((p) => [p.id, p.resume_path]));

    let uploaded = 0, skippedAlreadySet = 0, failed = 0;
    for (const r of matched) {
        if (resumeByProfileId.get(r.profile_id)) {
            console.log(`skip (already has resume): ${r.name} <${r.email}>`);
            skippedAlreadySet++;
            continue;
        }
        const fileBytes = readFileSync(`${EXTRACT_DIR}/${r.file}`);
        const path = `cqg/${r.profile_id}/resume.pdf`;

        if (DRY_RUN) {
            console.log(`[dry-run] would upload ${r.file} (${fileBytes.length}B) -> ${path} for ${r.name} <${r.email}>`);
            uploaded++;
            continue;
        }

        const { error: uploadErr } = await supabase.storage
            .from("resumes")
            .upload(path, fileBytes, { upsert: true, contentType: "application/pdf" });
        if (uploadErr) {
            console.error(`FAILED upload for ${r.email}:`, uploadErr.message);
            failed++;
            continue;
        }
        const { error: updateErr } = await supabase
            .from("cqg_profiles")
            .update({ resume_path: path })
            .eq("id", r.profile_id);
        if (updateErr) {
            console.error(`FAILED resume_path update for ${r.email}:`, updateErr.message);
            failed++;
            continue;
        }
        uploaded++;
    }

    console.log("\n=== Summary ===");
    console.log("Uploaded:", uploaded);
    console.log("Skipped (already had a resume):", skippedAlreadySet);
    console.log("Failed:", failed);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
