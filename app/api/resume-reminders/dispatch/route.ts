import { NextResponse, type NextRequest } from "next/server";
import { sweepResumeReminders } from "@/lib/resume-reminders";

// Hit on a schedule (see .github/workflows/resume-reminders.yml) to nudge
// and eventually remove accounts that never uploaded a required resume.
// Same shared-secret protection as /api/blasts/dispatch.
export async function GET(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    const provided =
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        request.nextUrl.searchParams.get("secret");

    if (!secret || provided !== secret) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await sweepResumeReminders();
    return NextResponse.json(result);
}
