import { Resend } from "resend";

function client() {
    return new Resend(process.env.RESEND_API_KEY);
}

// No usable default: "noreply@cqg.example.org" is a placeholder domain that
// Resend will always reject, so falling back to it just produced a send that
// failed for a second, more confusing reason. Missing config is now an error.
function fromAddress(): string {
    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) {
        throw new EmailSendError("RESEND_FROM_EMAIL is not set");
    }
    return from;
}

export class EmailSendError extends Error {
    constructor(message: string, readonly detail?: unknown) {
        super(message);
        this.name = "EmailSendError";
    }
}

// Plain, inline-styled template — email clients don't load app/globals.css,
// so this can't reuse the site's Tailwind classes. Colors match the site's
// navy/lime palette by value.
export function brandedEmailHtml(opts: {
    heading: string;
    bodyHtml: string;
    ctaLabel?: string;
    ctaHref?: string;
}) {
    const { heading, bodyHtml, ctaLabel, ctaHref } = opts;
    return `
<div style="font-family:'IBM Plex Sans',Arial,sans-serif;background:#F5F7FA;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #DBE1EB;">
    <div style="background:#0B2F62;padding:20px 28px;">
      <span style="color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.02em;">Columbia Quant Group</span>
    </div>
    <div style="padding:28px;">
      <h1 style="font-size:20px;color:#10182B;margin:0 0 14px;">${heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:#4B5568;">${bodyHtml}</div>
      ${
          ctaHref
              ? `<a href="${ctaHref}" style="display:inline-block;margin-top:20px;background:#E8FA0A;color:#0B2F62;font-weight:700;font-size:14px;padding:12px 22px;text-decoration:none;">${ctaLabel ?? "Continue"}</a>
      <p style="font-size:12px;line-height:1.5;color:#8A93A6;margin:18px 0 0;">If the button doesn't work, copy and paste this link into your browser:<br><span style="color:#4B5568;word-break:break-all;">${ctaHref}</span></p>`
              : ""
      }
    </div>
  </div>
</div>`;
}

// Text/plain counterpart to brandedEmailHtml. The link is spelled out in
// full rather than hidden behind a label, so it still works wherever the
// HTML part is stripped.
function brandedEmailText(opts: {
    heading: string;
    bodyText: string;
    ctaLabel?: string;
    ctaHref?: string;
}): string {
    const { heading, bodyText, ctaLabel, ctaHref } = opts;
    const lines = ["Columbia Quant Group", "", heading, "", bodyText];
    if (ctaHref) {
        lines.push("", `${ctaLabel ?? "Continue"}: ${ctaHref}`);
    }
    lines.push("", "—", "Columbia Quant Group", "https://www.columbiaquantgroup.com");
    return lines.join("\n");
}

function resendConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
}

// The Resend SDK does NOT throw on API failures -- resend/dist/index.cjs
// fetchRequest() returns `{ data: null, error }` for every non-ok response
// AND for network failures, and its own logError() is a no-op when
// NODE_ENV === "production". So `try { await client().emails.send(...) }
// catch {}` -- which is what the auth emails used to do -- caught nothing,
// discarded the error object, and left zero trace in production logs. That
// is why verification emails silently stopped arriving with no error
// anywhere. Every send now goes through here, and every failure throws.
async function send(opts: {
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
}): Promise<void> {
    if (!resendConfigured()) {
        throw new EmailSendError("RESEND_API_KEY is not set");
    }

    const replyTo = process.env.RESEND_REPLY_TO;

    const { data, error } = await client().emails.send({
        from: fromAddress(),
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        // Every message carries a real text/plain part. An HTML-only message
        // is a long-standing spam heuristic, and these were going out
        // HTML-only -- which matters here because Resend reports them as
        // "delivered" either way: the receiving server accepts the message
        // and then decides Inbox vs Junk on its own, invisibly to us.
        text: opts.text,
        // A monitored reply address reads as more legitimate than a bare
        // noreply@ on a domain with no MX record.
        ...(replyTo ? { replyTo } : {}),
        ...(opts.headers ? { headers: opts.headers } : {}),
    });

    if (error) {
        // Log here as well as throwing: callers decide how to degrade, but
        // the operator always needs the real reason (unverified sending
        // domain, test-mode recipient restriction, bad key, rate limit).
        console.error(`[email] Resend rejected "${opts.subject}" to ${opts.to}:`, error);
        throw new EmailSendError(error.message || "Resend rejected the message", error);
    }
    if (!data?.id) {
        console.error(`[email] Resend returned no message id for ${opts.to}`);
        throw new EmailSendError("Resend returned no message id");
    }
}

// Local-dev convenience only: before the Resend account exists there is no
// way to click a verification link, so print it to the server console
// instead. Deliberately never active in production -- swallowing a missing
// API key there is how this failure mode stayed invisible.
function logLinkInDev(kind: string, to: string, actionLink: string): boolean {
    if (process.env.NODE_ENV === "production" || resendConfigured()) return false;
    console.warn(`[email] RESEND_API_KEY not set — ${kind} link for ${to}:\n${actionLink}`);
    return true;
}

export async function sendVerificationEmail(to: string, name: string, actionLink: string) {
    if (logLinkInDev("verification", to, actionLink)) return;
    const heading = "Verify your email";
    const body = `Hi ${name}, click below to verify your email address and activate your account. After verifying, you'll be asked to upload a resume to finish setting up your profile.`;
    await send({
        to,
        subject: "Verify your email — Columbia Quant Group",
        html: brandedEmailHtml({ heading, bodyHtml: body, ctaLabel: "Verify Email", ctaHref: actionLink }),
        text: brandedEmailText({ heading, bodyText: body, ctaLabel: "Verify Email", ctaHref: actionLink }),
    });
}

export async function sendPasswordResetEmail(to: string, actionLink: string) {
    if (logLinkInDev("password reset", to, actionLink)) return;
    const heading = "Reset your password";
    const body = "We received a request to reset your password. If this wasn't you, you can ignore this email.";
    await send({
        to,
        subject: "Reset your password — Columbia Quant Group",
        html: brandedEmailHtml({ heading, bodyHtml: body, ctaLabel: "Reset Password", ctaHref: actionLink }),
        text: brandedEmailText({ heading, bodyText: body, ctaLabel: "Reset Password", ctaHref: actionLink }),
    });
}

// The blast dispatch loop in lib/blasts.ts records the thrown message against
// the recipient row, so a failure here is visible in the admin UI.
//
// Unlike the transactional mail above, blasts are bulk and carry
// List-Unsubscribe: mailbox providers expect it on bulk mail and penalise its
// absence. It is deliberately NOT set on verification/reset mail, which a
// user must not be able to opt out of.
export async function sendBlastEmail(to: string, subject: string, bodyHtml: string) {
    const unsubscribe = process.env.RESEND_UNSUBSCRIBE_MAILTO;
    await send({
        to,
        subject,
        html: brandedEmailHtml({ heading: subject, bodyHtml }),
        text: brandedEmailText({ heading: subject, bodyText: stripHtml(bodyHtml) }),
        ...(unsubscribe
            ? {
                  headers: {
                      "List-Unsubscribe": `<mailto:${unsubscribe}?subject=unsubscribe>`,
                      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                  },
              }
            : {}),
    });
}

// The sweep in lib/resume-reminders.ts only marks an account as reminded once
// this resolves, so a failed send is retried on the next run.
export async function sendResumeReminderEmail(to: string, name: string, uploadUrl: string) {
    const heading = "One step left to finish your account";
    const body = `Hi ${name}, you verified your email but haven't finished setting up your account yet. Upload your resume to complete your profile — your dashboard stays locked until you do.`;
    await send({
        to,
        subject: "Action required: complete your profile — Columbia Quant Group",
        html: brandedEmailHtml({ heading, bodyHtml: body, ctaLabel: "Complete Your Profile", ctaHref: uploadUrl }),
        text: brandedEmailText({ heading, bodyText: body, ctaLabel: "Complete Your Profile", ctaHref: uploadUrl }),
    });
}

// Admin-authored blast bodies are HTML; the text part needs a readable
// equivalent rather than raw markup.
function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// Config snapshot for the /api/email/health diagnostic. Never returns the
// API key itself, only whether it is present and what it looks like.
export function emailConfigStatus() {
    const key = process.env.RESEND_API_KEY;
    return {
        resendApiKeySet: Boolean(key),
        resendApiKeyPrefix: key ? `${key.slice(0, 6)}…` : null,
        fromAddress: process.env.RESEND_FROM_EMAIL ?? null,
        replyTo: process.env.RESEND_REPLY_TO ?? null,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
        nodeEnv: process.env.NODE_ENV ?? null,
    };
}

// Recent sends with their delivery outcome. The per-message last_event is
// what separates "never sent" from "sent, accepted, and then filtered by the
// recipient" -- the two look identical from inside this app.
export async function listRecentEmails(limit = 50): Promise<unknown> {
    if (!resendConfigured()) return { error: "RESEND_API_KEY is not set" };
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (client().emails as any).list({ limit });
        if (error) return { error };
        const rows = (data?.data ?? data ?? []) as Record<string, unknown>[];
        return rows.map((d) => ({
            to: d.to,
            subject: d.subject,
            created_at: d.created_at,
            last_event: d.last_event,
        }));
    } catch (err) {
        return { error: String(err) };
    }
}

// Sends a real message and returns Resend's verdict instead of throwing, so
// the diagnostic route can report the exact rejection.
export async function sendTestEmail(to: string): Promise<{ ok: boolean; id?: string; error?: unknown }> {
    if (!resendConfigured()) return { ok: false, error: { message: "RESEND_API_KEY is not set" } };
    try {
        const { data, error } = await client().emails.send({
            from: fromAddress(),
            to,
            subject: "Test — Columbia Quant Group",
            html: brandedEmailHtml({
                heading: "Test email",
                bodyHtml: "If you are reading this, Resend is configured correctly.",
            }),
            text: brandedEmailText({
                heading: "Test email",
                bodyText: "If you are reading this, Resend is configured correctly.",
            }),
        });
        if (error) return { ok: false, error };
        return { ok: true, id: data?.id };
    } catch (err) {
        return { ok: false, error: { message: String(err) } };
    }
}

// API acceptance is not delivery. Resend returns 200 with a message id and
// only later records what actually happened to the message -- "delivered",
// "bounced", "complained", "delivery_delayed". That distinction is the whole
// question when mail is accepted but never arrives, so the diagnostic reads
// the event back rather than treating a 200 as success.
export async function getEmailStatus(id: string): Promise<unknown> {
    if (!resendConfigured()) return { error: "RESEND_API_KEY is not set" };
    try {
        const { data, error } = await client().emails.get(id);
        if (error) return { error };
        const d = data as unknown as Record<string, unknown> | null;
        return {
            id: d?.id,
            to: d?.to,
            from: d?.from,
            subject: d?.subject,
            created_at: d?.created_at,
            last_event: d?.last_event,
        };
    } catch (err) {
        return { error: String(err) };
    }
}
