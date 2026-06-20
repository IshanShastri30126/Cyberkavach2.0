import nodemailer from "nodemailer";
import { config } from "../config";

// ─── Transporter Setup ────────────────────────────────────────
let transporterReady = false;

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Verify connection on startup
if (config.smtp.user && config.smtp.pass) {
  transporter.verify()
    .then(() => {
      transporterReady = true;
      console.log("[Email] ✅ SMTP transporter ready");
    })
    .catch((err) => {
      console.warn("[Email] ⚠️  SMTP verification failed:", err.message);
    });
} else {
  console.warn("[Email] ⚠️  SMTP credentials not configured — emails disabled");
}

// ─── Base Template ────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CyberKavach</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #7f1d1d, #dc2626); display: inline-block; text-align: center; line-height: 44px; box-shadow: 0 0 20px rgba(220, 38, 38, 0.6); border: 1px solid #ef4444;">
                  <span style="color: white; font-size: 22px;">🛡️</span>
                </div>
              </div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 6px; margin: 12px 0 0; font-family: 'Courier New', monospace;">CYBERKAVACH</h1>
              <div style="width: 60px; height: 2px; background: linear-gradient(90deg, transparent, #dc2626, transparent); margin: 8px auto;"></div>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #121212; border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 16px; overflow: hidden;">
                <!-- Red accent line -->
                <tr>
                  <td style="height: 3px; background: linear-gradient(90deg, transparent, #dc2626, #ff003c, #dc2626, transparent);"></td>
                </tr>
                <tr>
                  <td style="padding: 40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding-top: 30px;">
              <p style="color: #475569; font-size: 11px; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                CYBERKAVACH 2.0 // DIGITAL OPERATIONS HUB
              </p>
              <p style="color: #334155; font-size: 10px; margin: 6px 0 0;">
                This is an automated notification. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Mail Helper (with retry) ────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  if (!transporterReady) {
    console.log(`[Email] Skipped (not ready): "${subject}" -> ${to}`);
    return false;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject: `🛡️ CyberKavach — ${subject}`,
        html,
      });
      console.log(`[Email] ✅ Sent: "${subject}" -> ${to}`);
      return true;
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[Email] ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed for "${subject}" -> ${to}: ${err.message} — retrying in ${delay}ms`);
        await sleep(delay);
      } else {
        console.error(`[Email] ❌ All ${MAX_RETRIES} attempts failed for "${subject}" -> ${to}:`, err.message);
      }
    }
  }
  return false;
}

// ─── Welcome Email (Registration) ─────────────────────────────

export async function sendWelcomeEmail(user: { name: string; email: string; role: string }) {
  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Welcome, Operative <span style="color: #f87171;">${user.name}</span>
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Your registration has been received. Your account is currently <strong style="color: #f59e0b;">pending approval</strong> by a coordinator.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 6px;">OPERATIVE_ID</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 6px;">${user.email}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #1a1a1a; padding-top: 6px;"></td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-top: 6px;">CLEARANCE_LEVEL</td>
              <td style="color: #f87171; font-size: 14px; text-align: right; padding-top: 6px; font-family: 'Courier New', monospace;">${user.role}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
      You'll receive a notification once your account has been approved. Stay tuned, operative.
    </p>
  `;

  return sendMail(user.email, "Registration Received — Awaiting Clearance", baseTemplate(content));
}

// ─── Event Registration Confirmed Email ───────────────────────

export async function sendEventRegistrationEmail(
  user: { name: string; email: string },
  event: { title: string; startDate: Date; venue?: string | null }
) {
  const startStr = event.startDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const startTime = event.startDate.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Registration Confirmed! 🛡️
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Hello <strong style="color: #f1f5f9;">${user.name}</strong>, you have successfully registered for <strong style="color: #f87171;">${event.title}</strong>.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">EVENT</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right; padding-bottom: 10px; font-weight: bold;">${event.title}</td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">START_DATE</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right; padding-bottom: 10px;">${startStr} at ${startTime}</td>
            </tr>
            ${event.venue ? `
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px;">VENUE</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right;">${event.venue}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
      Please be present at the venue on time. Stay secure!
    </p>
  `;

  return sendMail(user.email, `Registration Confirmed: ${event.title}`, baseTemplate(content));
}

// ─── Login Notification Email ─────────────────────────────────

export async function sendLoginNotificationEmail(
  user: { name: string; email: string },
  meta?: { ip?: string; userAgent?: string }
) {
  const now = new Date();
  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Login Detected 🔐
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      A new login session was initiated for your account.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 8px;">OPERATIVE</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 8px;">${user.name}</td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 8px;">TIMESTAMP</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 8px;">${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
            </tr>
            ${meta?.ip ? `
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 8px;">IP_ADDRESS</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 8px;">${meta.ip}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
      If this wasn't you, secure your account immediately by changing your password.
    </p>
  `;

  return sendMail(user.email, "New Login Session Detected", baseTemplate(content));
}

// ─── Event Published Email ────────────────────────────────────

interface EventEmailData {
  title: string;
  description?: string | null;
  venue?: string | null;
  startDate: Date;
  endDate: Date;
  maxCapacity?: number | null;
  rules?: string | null;
  tags: string[];
  posterUrl?: string | null;
  googleFormUrl?: string | null;
  documentUrl?: string | null;
  eventType: string;
  creator: { name: string };
}

export async function sendEventPublishedEmail(
  event: EventEmailData,
  recipients: { email: string; name: string }[]
) {
  const startStr = event.startDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const startTime = event.startDate.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
  const endStr = event.endDate.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const posterSection = event.posterUrl
    ? `<tr>
        <td style="padding-bottom: 24px;">
          <img src="${config.clientUrl.replace(':3000', ':4000')}${event.posterUrl}" alt="${event.title}" 
            style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; border: 1px solid #262626;" />
        </td>
      </tr>`
    : "";

  const tagsHtml = event.tags.length > 0
    ? `<div style="margin-bottom: 20px;">
        ${event.tags.map(t => `<span style="display: inline-block; background: rgba(220,38,38,0.15); color: #f87171; border: 1px solid rgba(220,38,38,0.4); padding: 2px 10px; border-radius: 4px; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 1px; margin-right: 6px; margin-bottom: 4px;">${t.toUpperCase()}</span>`).join("")}
      </div>`
    : "";

  const googleFormButton = event.googleFormUrl
    ? `<tr>
        <td style="padding-top: 24px; text-align: center;">
          <a href="${event.googleFormUrl}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; background: linear-gradient(135deg, #7f1d1d, #dc2626); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; border: 1px solid #ef4444; box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);">
            📋 REGISTER NOW
          </a>
          <p style="color: #475569; font-size: 11px; margin-top: 10px;">Click above to fill the registration form</p>
        </td>
      </tr>`
    : "";

  const documentSection = event.documentUrl
    ? `<tr>
        <td style="padding-top: 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px;">
            <tr>
              <td style="padding: 16px 20px;">
                <p style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; margin: 0 0 8px;">📄 ATTACHED_DOCUMENT</p>
                <a href="${config.clientUrl.replace(':3000', ':4000')}${event.documentUrl}" target="_blank" rel="noopener noreferrer"
                  style="color: #f87171; font-size: 13px; text-decoration: underline;">
                  Download Event Document
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const content = `
    ${posterSection ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${posterSection}</table>` : ""}
    
    <div style="margin-bottom: 6px;">
      <span style="display: inline-block; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.4); padding: 3px 12px; border-radius: 4px; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px;">NEW EVENT</span>
      <span style="display: inline-block; background: rgba(220,38,38,0.1); color: #f87171; border: 1px solid rgba(220,38,38,0.3); padding: 3px 12px; border-radius: 4px; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 1px; margin-left: 6px;">${event.eventType.toUpperCase()}</span>
    </div>
    
    <h2 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 12px 0 6px; letter-spacing: 1px;">
      ${event.title}
    </h2>
    
    <p style="color: #64748b; font-size: 12px; margin: 0 0 20px; font-family: 'Courier New', monospace;">
      Organized by <span style="color: #f87171;">${event.creator.name}</span>
    </p>
    
    ${tagsHtml}
    
    ${event.description ? `
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.8; margin: 0 0 24px; border-left: 3px solid #dc2626; padding-left: 16px;">
      ${event.description}
    </p>` : ""}
    
    <!-- Event Details Grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 4px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">📅 START</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right; padding-bottom: 10px;">${startStr} at ${startTime}</td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">📅 END</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right; padding-bottom: 10px;">${endStr}</td>
            </tr>
            ${event.venue ? `
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">📍 VENUE</td>
              <td style="color: #f1f5f9; font-size: 13px; text-align: right; padding-bottom: 10px;">${event.venue}</td>
            </tr>` : ""}
            ${event.maxCapacity ? `
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px;">👥 CAPACITY</td>
              <td style="color: #f87171; font-size: 13px; text-align: right; font-weight: 700;">${event.maxCapacity} spots</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
    
    ${event.rules ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-top: 12px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; margin: 0 0 10px;">📜 RULES & GUIDELINES</p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${event.rules}</p>
        </td>
      </tr>
    </table>` : ""}
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${googleFormButton}
      ${documentSection}
    </table>
  `;

  const html = baseTemplate(content);
  const subject = `New Event: ${event.title}`;

  // Send to all recipients in parallel (batches of 10)
  const batchSize = 10;
  let sentCount = 0;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((r) => sendMail(r.email, subject, html))
    );
    sentCount += results.filter((r) => r.status === "fulfilled" && r.value).length;
  }

  console.log(`[Email] Event "${event.title}" — sent to ${sentCount}/${recipients.length} recipients`);
  return sentCount;
}

// ─── Account Approved Email ───────────────────────────────────

export async function sendAccountApprovedEmail(user: { name: string; email: string }) {
  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Access Granted, Operative <span style="color: #10b981;">${user.name}</span>
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Your CyberKavach account has been <strong style="color: #10b981;">approved</strong>. You now have full access to all member features.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 8px;">OPERATIVE_ID</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 8px;">${user.email}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #1a1a1a; padding-top: 6px;"></td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-top: 6px;">CLEARANCE</td>
              <td style="color: #10b981; font-size: 14px; text-align: right; padding-top: 6px; font-family: 'Courier New', monospace; font-weight: 700;">MEMBER — ACTIVE</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align: center; padding-top: 8px;">
          <a href="${config.clientUrl}/dashboard" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; background: linear-gradient(135deg, #065f46, #10b981); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; border: 1px solid #34d399; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">
            ENTER DASHBOARD
          </a>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
      Welcome to the CyberKavach family. Stay sharp, operative.
    </p>
  `;

  return sendMail(user.email, "Account Approved — Welcome Aboard", baseTemplate(content));
}

// ─── Approval Decision Email ──────────────────────────────────

export async function sendApprovalDecisionEmail(
  user: { name: string; email: string },
  decision: {
    title: string;
    status: "APPROVED" | "REJECTED" | "UNDER_REVIEW";
    level: number;
    comment?: string;
    decidedBy?: string;
  }
) {
  const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
    APPROVED: { color: "#10b981", label: "APPROVED", icon: "✅" },
    REJECTED: { color: "#ef4444", label: "REJECTED", icon: "❌" },
    UNDER_REVIEW: { color: "#f59e0b", label: "UNDER REVIEW", icon: "🔍" },
  };

  const sc = statusConfig[decision.status] || statusConfig.UNDER_REVIEW;

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Approval Update ${sc.icon}
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Your request <strong style="color: #f1f5f9;">"${decision.title}"</strong> has been updated.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">STATUS</td>
              <td style="color: ${sc.color}; font-size: 14px; text-align: right; padding-bottom: 10px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">${sc.label}</td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">LEVEL</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 10px;">${decision.level}</td>
            </tr>
            ${decision.decidedBy ? `
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 10px;">DECIDED_BY</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 10px;">${decision.decidedBy}</td>
            </tr>` : ""}
          </table>
        </td>
      </tr>
    </table>
    
    ${decision.comment ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <p style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; margin: 0 0 10px;">REMARKS</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0; border-left: 3px solid ${sc.color}; padding-left: 16px;">${decision.comment}</p>
        </td>
      </tr>
    </table>` : ""}
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align: center; padding-top: 8px;">
          <a href="${config.clientUrl}/dashboard/approvals" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; background: linear-gradient(135deg, #7f1d1d, #dc2626); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; border: 1px solid #ef4444; box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);">
            VIEW DETAILS
          </a>
        </td>
      </tr>
    </table>
  `;

  return sendMail(
    user.email,
    `Request ${sc.label}: ${decision.title}`,
    baseTemplate(content)
  );
}

// ─── Role Updated Email ───────────────────────────────────────

export async function sendRoleUpdatedEmail(
  user: { name: string; email: string },
  newRole: string
) {
  const roleDisplay = newRole.replace(/_/g, " ");

  const content = `
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Role Updated
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      Your clearance level within CyberKavach has been updated.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.5); border: 1px solid #262626; border-radius: 10px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-bottom: 8px;">OPERATIVE</td>
              <td style="color: #f1f5f9; font-size: 14px; text-align: right; padding-bottom: 8px;">${user.name}</td>
            </tr>
            <tr>
              <td colspan="2" style="border-top: 1px solid #1a1a1a; padding-top: 6px;"></td>
            </tr>
            <tr>
              <td style="color: #475569; font-size: 11px; font-family: 'Courier New', monospace; letter-spacing: 2px; padding-top: 6px;">NEW_CLEARANCE</td>
              <td style="color: #f87171; font-size: 14px; text-align: right; padding-top: 6px; font-family: 'Courier New', monospace; font-weight: 700;">${roleDisplay}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
      Your dashboard permissions have been updated to reflect your new role.
    </p>
  `;

  return sendMail(user.email, `Role Updated: ${roleDisplay}`, baseTemplate(content));
}

// ─── Password Reset Email ─────────────────────────────────────

export async function sendPasswordResetEmail(user: { email: string }, token: string) {
  const resetUrl = \`\${config.clientUrl}/auth/reset-password?token=\${token}\`;

  const content = \`
    <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px;">
      Password Reset Request 🔐
    </h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
      A password reset was requested for your account. If you did not request this, you can safely ignore this email.
    </p>
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="text-align: center; padding-top: 8px;">
          <a href="\${resetUrl}" target="_blank" rel="noopener noreferrer"
            style="display: inline-block; background: linear-gradient(135deg, #7f1d1d, #dc2626); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; border: 1px solid #ef4444; box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);">
            RESET PASSWORD
          </a>
        </td>
      </tr>
    </table>
    
    <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
      This link will expire in 1 hour.
    </p>
  \`;

  return sendMail(user.email, "Password Reset Instructions", baseTemplate(content));
}

