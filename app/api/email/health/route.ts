import { NextResponse, type NextRequest } from "next/server";
import { emailConfigStatus, sendTestEmail, getEmailStatus, listRecentEmails } from "@/lib/email";

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

    // ?recent=N -> what actually happened to the last N real sends.
    const recent = request.nextUrl.searchParams.get("recent");
    if (recent) {
        return NextResponse.json({
            config,
            recent: await listRecentEmails(Math.min(Number(recent) || 25, 100)),
        });
    }

    const to = request.nextUrl.searchParams.get("to");

    if (!to) {
        return NextResponse.json({ config, testSend: "skipped (pass ?to=<address>)" });
    }

    const result = await sendTestEmail(to);

    // A 200 from Resend only means "accepted for delivery". Wait briefly and
    // read the delivery event back, since "accepted then filtered" and
    // "delivered" are indistinguishable at send time.
    let delivery: unknown = "not checked";
    if (result.ok && result.id) {
        const waitMs = Number(request.nextUrl.searchParams.get("wait") ?? "10000");
        await new Promise((r) => setTimeout(r, Math.min(Math.max(waitMs, 0), 25000)));
        delivery = await getEmailStatus(result.id);
    }

    return NextResponse.json({ config, testSend: result, delivery }, { status: result.ok ? 200 : 502 });
}
