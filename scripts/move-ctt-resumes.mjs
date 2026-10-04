// Companion to supabase/migrations/0010_rename_cutc_to_ctt.sql: moves CTT
// resumes from resumes/cutc/<user_id>/ to resumes/ctt/<user_id>/.
//
//   node scripts/move-ctt-resumes.mjs copy      (BEFORE the migration: copies, leaves originals)
//   node scripts/move-ctt-resumes.mjs cleanup   (AFTER the migration + deploy: deletes the old cutc/ originals)
//
// Both modes are idempotent. Add --dry-run to see what would happen.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MODE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (!["copy", "cleanup"].includes(MODE)) {
    console.error("usage: node scripts/move-ctt-resumes.mjs <copy|cleanup> [--dry-run]");
    process.exit(1);
}

function loadEnv() {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
}

async function listFolder(storage, prefix) {
    const out = [];
    let offset = 0;
    for (;;) {
        const { data, error } = await storage.list(prefix, { limit: 100, offset });
        if (error) throw error;
        out.push(...data);
        if (data.length < 100) break;
        offset += 100;
    }
    return out;
}

async function main() {
    loadEnv();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const storage = supabase.storage.from("resumes");

    // Top level of cutc/ is one folder per user id.
    const userFolders = (await listFolder(storage, "cutc")).filter((e) => !e.id);
    console.log(`${userFolders.length} user folders under resumes/cutc/`);

    let done = 0, skipped = 0, failed = 0;
    for (const folder of userFolders) {
        const files = (await listFolder(storage, `cutc/${folder.name}`)).filter((e) => e.id);
        for (const f of files) {
            const from = `cutc/${folder.name}/${f.name}`;
            const to = `ctt/${folder.name}/${f.name}`;

            if (MODE === "copy") {
                const existing = await listFolder(storage, `ctt/${folder.name}`);
                if (existing.some((e) => e.name === f.name)) { skipped++; continue; }
                if (DRY_RUN) { console.log(`[dry-run] copy ${from} -> ${to}`); done++; continue; }
                const { error } = await storage.copy(from, to);
                if (error) { console.error(`FAILED copy ${from}:`, error.message); failed++; } else done++;
            } else {
                const copied = (await listFolder(storage, `ctt/${folder.name}`)).some((e) => e.name === f.name);
                if (!copied) { console.error(`REFUSING to delete ${from}: no copy at ${to}`); failed++; continue; }
                if (DRY_RUN) { console.log(`[dry-run] delete ${from}`); done++; continue; }
                const { error } = await storage.remove([from]);
                if (error) { console.error(`FAILED delete ${from}:`, error.message); failed++; } else done++;
            }
        }
    }
    console.log(`${MODE}: done=${done} skipped=${skipped} failed=${failed}${DRY_RUN ? " (dry-run)" : ""}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
