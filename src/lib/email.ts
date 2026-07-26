import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Fire-and-log, not fire-and-forget-silently: if this fails, the buyer
 * still has the success page as a fallback, so we don't want an email
 * failure to fail the webhook (Stripe would just retry it, redundantly,
 * against an already-PAID order).
 */
export async function sendDownloadEmail(params: {
  to: string;
  assetTitle: string;
  downloadUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order confirmation email.");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "orders@resend.dev",
      to: params.to,
      subject: `Your download: ${params.assetTitle}`,
      html: `
        <p>Thanks for your purchase of <strong>${params.assetTitle}</strong>.</p>
        <p><a href="${params.downloadUrl}">Click here to download your file</a></p>
        <p style="color:#888;font-size:12px">This link expires in 1 hour. If it expires, reply to this email and we'll issue a new one.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send download email:", err);
  }
}

/** Sent when a refund revokes a previously-issued download link — so the
 * buyer isn't left wondering why a link that worked yesterday now 403s. */
export async function sendRefundEmail(params: { to: string; assetTitle: string }) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping refund notification email.");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "orders@resend.dev",
      to: params.to,
      subject: `Refund processed: ${params.assetTitle}`,
      html: `
        <p>Your refund for <strong>${params.assetTitle}</strong> has been processed.</p>
        <p style="color:#888;font-size:12px">As part of this, the download link for this purchase has been deactivated. If you believe this is a mistake, reply to this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send refund email:", err);
  }
}

/** Forwards a contact-page submission to the photographer's real inbox. */
export async function sendContactNotification(params: {
  name: string;
  email: string;
  message: string;
}) {
  const to = process.env.CONTACT_RECIPIENT_EMAIL;
  if (!resend || !to) {
    console.warn(
      "RESEND_API_KEY or CONTACT_RECIPIENT_EMAIL not set — contact message was validated but not delivered."
    );
    return false;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "orders@resend.dev",
      to,
      replyTo: params.email,
      subject: `New contact form message from ${params.name}`,
      html: `
        <p><strong>${params.name}</strong> (${params.email}) wrote:</p>
        <p style="white-space:pre-wrap">${params.message}</p>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send contact notification:", err);
    return false;
  }
}
