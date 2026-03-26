import { Resend } from "resend";

// Lazy-init: avoid module-level instantiation that throws when RESEND_API_KEY is missing at build time
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? "StorecheckAI <onboarding@resend.dev>";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070f;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;">
        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;width:44px;height:44px;text-align:center;vertical-align:middle;">
              <span style="color:white;font-size:20px;font-weight:bold;">✦</span>
            </td>
            <td style="padding-left:10px;color:white;font-size:18px;font-weight:700;letter-spacing:-0.3px;">StorecheckAI</td>
          </tr></table>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px 36px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;color:#4b5563;font-size:11px;">© ${new Date().getFullYear()} StorecheckAI. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email verification ────────────────────────────────────────────────────────
export async function sendVerificationEmail(toEmail: string, toName: string, verifyUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const html = emailShell(`
    <p style="margin:0 0 6px;color:#e5e7eb;font-size:16px;font-weight:600;">Welcome, ${toName}! 🎉</p>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">
      Verify your email to claim your <strong style="color:#a5b4fc;">1 free store check</strong> — no card required.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:14px 32px;text-align:center;">
        <a href="${verifyUrl}" style="color:white;text-decoration:none;font-size:14px;font-weight:600;">Verify email &amp; claim free check →</a>
      </td></tr>
    </table>
    <p style="margin:0 0 20px;color:#6b7280;font-size:11px;text-align:center;word-break:break-all;">${verifyUrl}</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 16px;">
    <p style="margin:0;color:#6b7280;font-size:11px;line-height:1.6;">This link expires in 24 hours. If you didn't create this account, ignore this email.</p>
  `);

  await getResend().emails.send({
    from:    FROM_EMAIL,
    to:      toEmail,
    subject: "Verify your StorecheckAI email 🛡️",
    html,
  });
}

// ── Welcome email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const dashboardUrl = `${APP_URL}/dashboard`;
  const html = emailShell(`
    <p style="margin:0 0 6px;color:#e5e7eb;font-size:16px;font-weight:600;">Welcome, ${toName}! 🎉</p>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">
      Your StorecheckAI account is ready. You have <strong style="color:#a5b4fc;">1 free check</strong> waiting — use it to scan any store before you buy.
    </p>
    <p style="margin:0 0 28px;color:#9ca3af;font-size:14px;line-height:1.6;">
      Paste any store URL and get a full trust report in under 30 seconds: trust score, red flags, return policy analysis, and AI verdict.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:14px 32px;text-align:center;">
        <a href="${dashboardUrl}" style="color:white;text-decoration:none;font-size:14px;font-weight:600;">Check your first store →</a>
      </td></tr>
    </table>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;">
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">Questions? Just reply to this email — we read every message.</p>
  `);

  await getResend().emails.send({
    from:    FROM_EMAIL,
    to:      toEmail,
    subject: "Your StorecheckAI account is ready 🛡️",
    html,
  });
}

// ── Check-complete email ───────────────────────────────────────────────────────
export async function sendCheckCompleteEmail(
  toEmail: string,
  toName: string,
  storeName: string,
  trustScore: number,
  verdict: string,
  reportId: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const reportUrl = `${APP_URL}/report/${reportId}`;

  const verdictColor: Record<string, string> = {
    BUY:     "#34d399",
    CAUTION: "#fbbf24",
    SKIP:    "#f87171",
  };
  const verdictLabel: Record<string, string> = {
    BUY:     "✅ Safe to Buy",
    CAUTION: "⚠️ Use Caution",
    SKIP:    "🚫 Avoid This Store",
  };
  const color = verdictColor[verdict] ?? "#9ca3af";
  const label = verdictLabel[verdict] ?? verdict;

  const scoreBar = `
    <div style="background:rgba(255,255,255,0.05);border-radius:8px;height:8px;margin:8px 0 20px;overflow:hidden;">
      <div style="background:${color};height:8px;width:${trustScore}%;border-radius:8px;"></div>
    </div>`;

  const html = emailShell(`
    <p style="margin:0 0 6px;color:#e5e7eb;font-size:16px;font-weight:600;">Hi ${toName}, your report is ready</p>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;line-height:1.6;">
      We've finished analyzing <strong style="color:#e5e7eb;">${storeName}</strong>. Here's the summary:
    </p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Trust Score</p>
      <p style="margin:0;color:${color};font-size:32px;font-weight:800;line-height:1;">${trustScore}<span style="font-size:16px;color:#6b7280;">/100</span></p>
      ${scoreBar}
      <p style="margin:0;color:${color};font-size:14px;font-weight:600;">${label}</p>
    </div>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:14px 32px;text-align:center;">
        <a href="${reportUrl}" style="color:white;text-decoration:none;font-size:14px;font-weight:600;">View full report →</a>
      </td></tr>
    </table>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;">
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
      You can also share this report link with friends or family before they buy from this store.
    </p>
  `);

  await getResend().emails.send({
    from:    FROM_EMAIL,
    to:      toEmail,
    subject: `Your StorecheckAI report: ${storeName} — ${label}`,
    html,
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  token: string,
  locale = "en",
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const subjects: Record<string, string> = {
    en: "Reset your StorecheckAI password",
    fr: "Réinitialisez votre mot de passe StorecheckAI",
    de: "Setzen Sie Ihr StorecheckAI-Passwort zurück",
    es: "Restablece tu contraseña de StorecheckAI",
    pt: "Redefina sua senha do StorecheckAI",
    it: "Reimposta la tua password di StorecheckAI",
  };

  const greetings: Record<string, string> = {
    en: `Hi ${toName},`,
    fr: `Bonjour ${toName},`,
    de: `Hallo ${toName},`,
    es: `Hola ${toName},`,
    pt: `Olá ${toName},`,
    it: `Ciao ${toName},`,
  };

  const bodyLines: Record<string, [string, string, string, string]> = {
    en: [
      "We received a request to reset your password.",
      "Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.",
      "Reset my password",
      "If you didn't request this, you can safely ignore this email.",
    ],
    fr: [
      "Nous avons reçu une demande de réinitialisation de votre mot de passe.",
      "Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans <strong>1 heure</strong>.",
      "Réinitialiser mon mot de passe",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.",
    ],
    de: [
      "Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts erhalten.",
      "Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen. Dieser Link läuft in <strong>1 Stunde</strong> ab.",
      "Mein Passwort zurücksetzen",
      "Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.",
    ],
    es: [
      "Recibimos una solicitud para restablecer tu contraseña.",
      "Haz clic en el botón de abajo para elegir una nueva contraseña. Este enlace caduca en <strong>1 hora</strong>.",
      "Restablecer mi contraseña",
      "Si no solicitaste esto, puedes ignorar este correo electrónico.",
    ],
    pt: [
      "Recebemos uma solicitação para redefinir sua senha.",
      "Clique no botão abaixo para escolher uma nova senha. Este link expira em <strong>1 hora</strong>.",
      "Redefinir minha senha",
      "Se você não solicitou isso, pode ignorar este e-mail com segurança.",
    ],
    it: [
      "Abbiamo ricevuto una richiesta di reimpostazione della tua password.",
      "Clicca sul pulsante qui sotto per scegliere una nuova password. Questo link scade tra <strong>1 ora</strong>.",
      "Reimposta la mia password",
      "Se non hai richiesto questo, puoi ignorare questa email.",
    ],
  };

  const lang = bodyLines[locale] ? locale : "en";
  const [line1, line2, btnLabel, line3] = bodyLines[lang];
  const greeting = greetings[lang];
  const subject  = subjects[lang];

  const html = emailShell(`
    <p style="margin:0 0 6px;color:#e5e7eb;font-size:16px;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 16px;color:#9ca3af;font-size:14px;line-height:1.6;">${line1}</p>
    <p style="margin:0 0 28px;color:#9ca3af;font-size:14px;line-height:1.6;">${line2}</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:14px 32px;text-align:center;">
        <a href="${resetUrl}" style="color:white;text-decoration:none;font-size:14px;font-weight:600;">${btnLabel}</a>
      </td></tr>
    </table>
    <p style="margin:0 0 20px;color:#6b7280;font-size:11px;text-align:center;word-break:break-all;">${resetUrl}</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 20px;">
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">${line3}</p>
  `);

  await getResend().emails.send({
    from:    FROM_EMAIL,
    to:      toEmail,
    subject,
    html,
  });
}
