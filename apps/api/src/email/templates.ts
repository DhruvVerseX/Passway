export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function layout(title: string, body: string, url: string, button: string) {
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(url);
  const safeButton = escapeHtml(button);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#05070a;color:#e6edf3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#05070a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border:1px solid #1d2633;border-radius:16px;background:#0b0f14;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 8px;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;">Passway</div>
                <h1 style="margin:24px 0 12px;font-size:24px;line-height:1.25;color:#ffffff;">${safeTitle}</h1>
                ${body}
                <p style="margin:28px 0;">
                  <a href="${safeUrl}" style="display:inline-block;border-radius:10px;background:#3b82f6;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 18px;">${safeButton}</a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#8b949e;">If the button does not work, paste this URL into your browser:</p>
                <p style="margin:0 0 24px;word-break:break-all;font-size:13px;line-height:1.6;color:#9ec5ff;">${safeUrl}</p>
                <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#8b949e;">This link expires in 1 hour.</p>
                <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#8b949e;">If you did not request this email, you can ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(url: string): EmailTemplate {
  const body = '<p style="margin:0;font-size:15px;line-height:1.7;color:#c9d1d9;">Confirm your email address to finish setting up your Passway account.</p>';
  return {
    subject: "Verify your Passway email",
    html: layout("Verify your email address", body, url, "Verify email"),
    text: `Verify your Passway email: ${url}\n\nThis link expires in 1 hour. If you did not request this email, ignore it.`,
  };
}

export function verificationCodeEmail(code: string): EmailTemplate {
  const safeCode = escapeHtml(code);
  const body = `<p style="margin:0;font-size:15px;line-height:1.7;color:#c9d1d9;">Enter this code in Passway to verify your email address.</p><p style="margin:24px 0;font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#ffffff;">${safeCode}</p><p style="margin:0;font-size:13px;line-height:1.6;color:#8b949e;">This code expires in 10 minutes.</p>`;
  return {
    subject: "Your Passway verification code",
    html: layout("Verify your email address", body, "https://passway.co.in", "Open Passway"),
    text: `Your Passway verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  };
}
export function passwordResetCodeEmail(code: string): EmailTemplate {
  const safeCode = escapeHtml(code);
  const body = `<p style="margin:0;font-size:15px;line-height:1.7;color:#c9d1d9;">Enter this code in Passway to reset your password.</p><p style="margin:24px 0;font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px;color:#ffffff;">${safeCode}</p><p style="margin:0;font-size:13px;line-height:1.6;color:#8b949e;">This code expires in 10 minutes.</p>`;
  return {
    subject: "Your Passway password reset code",
    html: layout("Reset your password", body, "https://passway.co.in", "Open Passway"),
    text: `Your Passway password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
  };
}
export function resetPasswordEmail(url: string): EmailTemplate {
  const body = '<p style="margin:0;font-size:15px;line-height:1.7;color:#c9d1d9;">Use this secure link to choose a new password for your Passway account.</p>';
  return {
    subject: "Reset your Passway password",
    html: layout("Reset your password", body, url, "Reset password"),
    text: `Reset your Passway password: ${url}\n\nThis link expires in 1 hour. If you did not request this email, ignore it.`,
  };
}
