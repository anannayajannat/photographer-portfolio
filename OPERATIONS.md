# Ops Runbook

Quick answers for the situations that come up after handoff — written for
whoever's running this day-to-day, not just the original developer.

## I forgot the admin password / got locked out

There's no self-service "forgot password" flow (see Known Gaps in the
README). To reset:

```bash
# From a machine with the production DATABASE_URL available:
SEED_ADMIN_EMAIL="admin@yoursite.com" SEED_ADMIN_PASSWORD="new-password" npm run seed
```

This updates the existing admin account's password if the email already
exists, or creates a new one if it doesn't. No downtime, no data loss.

## I rotated a Stripe/Cloudinary/Resend API key

1. Update the value in Vercel → Project Settings → Environment Variables.
2. **Redeploy** — Vercel does not hot-reload environment variables into
   already-running serverless functions. Trigger a redeploy (Deployments →
   ⋯ → Redeploy) after saving the new value, or the old key stays in use
   until the next deploy anyway.
3. If you rotated the **Stripe webhook signing secret** specifically: the
   old secret stops validating incoming webhooks immediately on Stripe's
   side once you regenerate it in the Stripe Dashboard, so redeploy
   promptly — there's a window where webhooks will fail signature
   verification (logged as "Invalid signature", not silently dropped)
   until both sides agree on the new secret.

## An order is stuck as "PENDING" — buyer says they paid

This means Stripe's `checkout.session.completed` webhook either didn't
fire or failed before reaching us. To manually re-deliver it:

1. Stripe Dashboard → Developers → Events, find the event for that
   checkout session (search by the buyer's email or the session ID from
   the admin Orders page).
2. Open the event → **Resend webhook**. Our handler is idempotent
   (`src/app/api/webhooks/stripe/route.ts`), so resending is always safe —
   it checks `order.status === "PAID"` before writing anything, meaning a
   duplicate delivery can't double-charge, double-count, or reissue a
   download link that invalidates one already sent.
3. Once the order shows `PAID` in the admin Orders page, the buyer's
   original `/checkout/success` link (if they still have the tab open)
   will now show the download button — or manually forward them the
   download link Cloudinary/Resend would have sent.

If the event genuinely never reached Stripe's system at all (rare — check
Stripe Dashboard → Payments to confirm the charge actually succeeded
first), the order needs a manual DB update instead; that's a "call the
developer" situation, not a runbook step, since it means editing
production data directly.

## A buyer wants a refund

Refund it from the Stripe Dashboard as normal (Payments → find the
charge → Refund). Everything downstream is automatic: our
`charge.refunded` webhook handler flips the order to `REFUNDED`, revokes
the download token immediately (not just at its 1-hour expiry), and
emails the buyer to let them know the link no longer works.

## The contact form isn't delivering messages

Check that both `RESEND_API_KEY` and `CONTACT_RECIPIENT_EMAIL` are set in
Vercel's environment variables — if either is missing, submissions are
still validated (the visitor sees an honest error, not a false "sent!"),
but nothing gets delivered. Check the Vercel function logs for
`/api/contact` for the specific Resend error if the keys are set but
messages still aren't arriving.
