# Submission Notes — Photographer Portfolio (Web Developer & IT Specialist role)

Live demo: https://photographer-portfolio-ruddy.vercel.app/
Admin: https://photographer-portfolio-ruddy.vercel.app/admin/login

This file is a 2-minute map of the decisions behind the code — what to
read first, and why things are built the way they are. Full detail on
every decision is in `README.md`; day-2 operational stuff (password
reset, key rotation, re-triggering a stuck webhook) is in
`OPERATIONS.md`.

## Where to start reading

1. **`src/app/api/webhooks/stripe/route.ts`** — the most load-bearing
   file in the app. Payment confirmation, refunds, and abandoned-checkout
   cleanup all route through here, and all three are idempotent.
2. **`src/lib/db/schema.ts`** — the whole data model in one file
   (Drizzle ORM, plain SQL migrations in `./drizzle`).
3. **`src/lib/cloudinary.ts`** — how originals stay locked down while
   previews stay public and watermarked.

## Stack

Next.js 14 (App Router, TypeScript) · PostgreSQL via Drizzle ORM ·
NextAuth (admin auth) · Cloudinary (storage/watermarking) · Stripe
(test mode) · Resend (transactional email) · Upstash Redis (rate
limiting) · deployed on Vercel.

## Decisions worth asking me about

- **Why the download link is only ever issued from the Stripe webhook,
  never from the `/checkout/success` redirect** — that redirect is
  client-controlled and can be hit with a fabricated session ID; the
  webhook is cryptographically signed and verified server-side.
- **Why every webhook handler checks current status before writing
  anything** — Stripe redelivers events on any non-2xx response, so a
  duplicate delivery has to be a safe no-op, not a double-charge or a
  reissued token that silently invalidates one already emailed out.
- **Why the original file and the public preview are two separate
  Cloudinary uploads**, not one image with a client-side blur — the
  original is stored `authenticated`, so Cloudinary itself refuses to
  serve it without a signed, time-limited URL. There's no hidden
  full-res link sitting in page HTML to find.
- **Why Drizzle over Prisma** — no separate query-engine binary, so no
  added cold-start latency on serverless functions, and the generated
  SQL is easy to reason about directly.
- **Why services are a real database table with their own admin UI**,
  not a JSON field — the goal was something a non-technical
  photographer could actually run without editing code.

## Known gaps (deliberately scoped out, not missed)

- No automated test suite yet (Vitest/Playwright groundwork noted in
  `README.md`).
- No CI/CD pipeline yet.
- Admin dashboard sidebar isn't mobile-optimized (public site is).

Happy to walk through any part of this live, including the parts I'd
build differently with more time.
