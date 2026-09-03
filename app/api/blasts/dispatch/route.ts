import { NextResponse, type NextRequest } from "next/server";
import { dispatchDueBlasts } from "@/lib/blasts";

// Hit on a schedule by an external cron (Vercel Cron via vercel.json in this
// repo, or any other scheduler pointed at this URL) to process scheduled
// email blasts. Protected by a shared secret so nobody else can trigger it.
// Named CRON_SECRET specifically because Vercel Cron auto-injects
// `Authorization: Bearer $CRON_SECRET` on every cron-triggered request when
// a project env var with that exact name is set — no need to (and no way
// to, without leaking it) put the secret value into the committed
// vercel.json. Other schedulers can pass it as `?secret=...` instead.
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    const provided =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        request.nextUrl.searchParams.get("secret");

    if (!secret || provided !== secret) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await dispatchDueBlasts();
    return NextResponse.json(result);
}
