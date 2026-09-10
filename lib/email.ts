import { Resend } from "resend";

function client() {
    return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
    return process.env.RESEND_FROM_EMAIL || "Columbia Quant Group <noreply@cqg.example.org>";
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
              ? `<a href="${ctaHref}" style="display:inline-block;margin-top:20px;background:#E8FA0A;color:#0B2F62;font-weight:700;font-size:14px;padding:12px 22px;text-decoration:none;">${ctaLabel ?? "Continue"}</a>`
              : ""
      }
    </div>
  </div>
</div>`;
}

// Resend isn't configured yet in every environment (e.g. local dev before
// the Resend account exists). Rather than let a missing API key take down
// signup/password-reset entirely, log the link server-side and move on —
// callers should treat email sending as best-effort, not something to await
// failure on.
function resendConfigured() {
    return Boolean(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(to: string, name: string, actionLink: string) {
    if (!resendConfigured()) {
        console.warn(`[email] RESEND_API_KEY not set — verification link for ${to}:\n${actionLink}`);
        return;
    }
    try {
        await client().emails.send({
            from: fromAddress(),
            to,
            subject: "Verify your email — Columbia Quant Group",
            html: brandedEmailHtml({
                heading: "Verify your email",
                bodyHtml: `Hi ${name}, click below to verify your email address and activate your account. After verifying, you'll need to complete your profile, including uploading a resume, to finish setting up your account — incomplete accounts are subject to deletion.`,
                ctaLabel: "Verify Email",
                ctaHref: actionLink,
            }),
        });
    } catch (err) {
        console.error(`[email] failed to send verification email to ${to}:`, err);
    }
}

// Unlike the auth emails above, blast sends must propagate failures — the
// dispatch loop in lib/blasts.ts needs the real error to record against the
// recipient row, not a swallowed one.
export async function sendBlastEmail(to: string, subject: string, bodyHtml: string) {
    if (!resendConfigured()) {
        throw new Error("RESEND_API_KEY not set");
    }
    const { error } = await client().emails.send({
        from: fromAddress(),
        to,
        subject,
        html: brandedEmailHtml({ heading: subject, bodyHtml }),
    });
    if (error) {
        throw new Error(error.message);
    }
}

// Both of these, unlike the auth emails above, must propagate send failures
// — the resume-reminder sweep in lib/resume-reminders.ts only advances an
// account toward deletion once it knows the warning actually reached the
// applicant, not just that it tried to.
export async function sendResumeReminderEmail(to: string, name: string, uploadUrl: string) {
    if (!resendConfigured()) {
        throw new Error("RESEND_API_KEY not set");
    }
    const { error } = await client().emails.send({
        from: fromAddress(),
        to,
        subject: "Action required: complete your profile — Columbia Quant Group",
        html: brandedEmailHtml({
            heading: "One step left to finish your account",
            bodyHtml: `Hi ${name}, you verified your email but haven't finished setting up your account yet. To finish creating your account, you must complete your entire profile, including uploading a resume. If you don't complete this within 24 hours, your account will be deleted and you'll need to re-register.`,
            ctaLabel: "Complete Your Profile",
            ctaHref: uploadUrl,
        }),
    });
    if (error) {
        throw new Error(error.message);
    }
}

export async function sendAccountDeletedEmail(to: string, name: string, signupUrl: string) {
    if (!resendConfigured()) {
        throw new Error("RESEND_API_KEY not set");
    }
    const { error } = await client().emails.send({
        from: fromAddress(),
        to,
        subject: "Your account was removed — Columbia Quant Group",
        html: brandedEmailHtml({
            heading: "Your account was removed",
            bodyHtml: `Hi ${name}, your account was deleted because a resume was never uploaded within the required window. If you'd still like to join, you're welcome to register again.`,
            ctaLabel: "Register Again",
            ctaHref: signupUrl,
        }),
    });
    if (error) {
        throw new Error(error.message);
    }
}

export async function sendPasswordResetEmail(to: string, actionLink: string) {
    if (!resendConfigured()) {
        console.warn(`[email] RESEND_API_KEY not set — password reset link for ${to}:\n${actionLink}`);
        return;
    }
    try {
        await client().emails.send({
            from: fromAddress(),
            to,
            subject: "Reset your password — Columbia Quant Group",
            html: brandedEmailHtml({
                heading: "Reset your password",
                bodyHtml: `We received a request to reset your password. If this wasn't you, you can ignore this email.`,
                ctaLabel: "Reset Password",
                ctaHref: actionLink,
            }),
        });
    } catch (err) {
        console.error(`[email] failed to send password reset email to ${to}:`, err);
    }
}
