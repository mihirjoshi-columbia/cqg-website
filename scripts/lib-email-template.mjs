// Mirrors lib/email.ts's brandedEmailHtml/Text so these one-off scripts
// match the app's real emails without importing a .ts module into plain
// node. Keep in sync by hand if lib/email.ts's template changes.

export function brandedEmailHtml({ heading, bodyHtml, ctaLabel, ctaHref }) {
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

export function brandedEmailText({ heading, bodyText, ctaLabel, ctaHref }) {
    const lines = ["Columbia Quant Group", "", heading, "", bodyText];
    if (ctaHref) lines.push("", `${ctaLabel ?? "Continue"}: ${ctaHref}`);
    lines.push("", "—", "Columbia Quant Group", "https://www.columbiaquantgroup.com");
    return lines.join("\n");
}
