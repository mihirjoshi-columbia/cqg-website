import { NextResponse, type NextRequest } from "next/server";
import { emailConfigStatus, sendTestEmail } from "@/lib/email";

// Diagnostic for "emails aren't arriving". Same shared-secret protection as
// /api/blasts/dispatch, since it can trigger a real send.
//
//   GET /api/email/health?secret=<CRON_SECRET>            -> config only
//   GET /api/email/health?secret=<CRON_SECRET>&to=me@x.y  -> config + test send
//
// Exists because Resend's SDK reports API failures as a returned `error`
// object rather than a thrown exception, and its own logging is disabled
// when NODE_ENV === "production" -- so a misconfigured sending domain or an
// unverified-recipient rejection produced no trace anywhere. This returns
// the raw rejection.
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    const provided =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        request.nextUrl.searchParams.get("secret");

    if (!secret || provided !== secret) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const config = emailConfigStatus();
    const to = request.nextUrl.searchParams.get("to");

    if (!to) {
        return NextResponse.json({ config, testSend: "skipped (pass ?to=<address>)" });
    }

    const result = await sendTestEmail(to);
    return NextResponse.json({ config, testSend: result }, { status: result.ok ? 200 : 502 });
}
