# Studio Lens — Photographer Portfolio & Storefront

Next.js 14.2.35 (App Router, TypeScript) · PostgreSQL/Drizzle ORM · NextAuth · Cloudinary · Stripe (test mode) · Resend · Upstash Redis

## Local setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, Cloudinary, Stripe (see below)
npm run db:generate        # generates SQL from src/lib/db/schema.ts into ./drizzle (already run once — re-run if you change the schema)
npm run db:migrate         # applies drizzle/*.sql to DATABASE_URL
npm run seed                # creates the admin login from SEED_ADMIN_EMAIL/PASSWORD in .env
npm run dev
```

Visit `/` for the public site, `/admin/login` for the dashboard.

## Getting free credentials

- **Postgres**: [neon.tech](https://neon.tech) free tier → copy the connection string into `DATABASE_URL`.
- **Cloudinary**: [cloudinary.com](https://cloudinary.com) free tier → Dashboard shows cloud name/key/secret.
- **Stripe**: [dashboard.stripe.com](https://dashboard.stripe.com) → toggle **Test mode** → API keys. Test card: `4242 4242 4242 4242`, any future date/CVC.
- **Stripe webhook (local)**: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (Stripe CLI). Forward `checkout.session.completed`, `charge.refunded`, and `checkout.session.expired`.
- **Resend** (email): [resend.com](https://resend.com) free tier → API key. If unset, email sending is skipped (logged, not fatal) — the `/checkout/success` page remains a working fallback.
- **Upstash Redis** (rate limiting): [upstash.com](https://upstash.com) free tier → REST URL + token. If unset, rate limiting fails open (logged, not blocking).

## Deploying (Vercel)

1. Push to GitHub, import on [vercel.com](https://vercel.com) — zero config for Next.js.
2. Add every `.env` variable in Project Settings → Environment Variables for **Production**. Set `NEXTAUTH_URL` to the deployed URL.
3. Run `npm run db:migrate` once against the production `DATABASE_URL` before the first deploy.
4. In Stripe Dashboard → Developers → Webhooks, add `https://<your-app>.vercel.app/api/webhooks/stripe` listening for `checkout.session.completed`, `charge.refunded`, and `checkout.session.expired`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Run `npm run seed` once (locally, pointed at the prod `DATABASE_URL`) to create the admin account.

## Architecture decisions

- **Public preview vs. private original are two separate Cloudinary uploads.** The original is `type: authenticated` — Cloudinary refuses to serve it without a signed URL, so there's no hidden full-res link sitting in page HTML.
- **Watermark + downscale happen server-side at upload time**, so the pixels themselves carry the watermark rather than a CSS overlay anyone can strip via dev tools.
- **Uploaded files are verified by magic bytes (`file-type`), not by the client-reported MIME type.** `file.type` is attacker-controlled — a renamed script reports as `image/jpeg` just fine. The upload route sniffs the actual bytes and ignores what the browser claims.
- **Cloudinary's own detected format is stored per asset (`originalFormat`)** and used when building signed download URLs, instead of assuming every original is a `.jpg`. A PNG or WebP original previously would have been served through an unwanted forced conversion to jpg.
- **Payment confirmation only ever happens via the Stripe webhook**, never the `/checkout/success` redirect — that redirect is client-controlled. The webhook is signed and verified server-side.
- **Download tokens are short-lived JWTs issued only inside the webhook**, re-checked against the DB row at download time — not just the JWT signature — so a refund can invalidate access immediately instead of waiting for the 1-hour expiry.
- **Webhook handling is idempotent** for all three event types it handles (checkout completed, refunded, expired) — each checks current order status before writing, so a Stripe redelivery can't double-increment counts, reissue a token, or downgrade an already-PAID order.
- **Refunds are handled via `charge.refunded`**, correlated back to the order through `paymentIntentId` (stored at payment time, since the refund event only carries the charge/payment intent, not the checkout session id). A refund flips status to `REFUNDED`, clears the download token, and emails the buyer so a link that worked yesterday doesn't just silently 403 today.
- **Abandoned checkouts expire in 30 minutes, not Stripe's ~24h default**, via an explicit `expires_at` on session creation — 30 minutes is Stripe's minimum allowed value. `checkout.session.expired` then flips any still-`PENDING` order to `FAILED`, so abandoned carts don't sit forever cluttering the orders table.
- **Order confirmation email is sent from inside the webhook**, not from the success page — a closed browser tab doesn't cost the buyer their download. Both this and the refund email are fire-and-log: a failed email can't fail the webhook and trigger a pointless Stripe retry against an order that's already correctly updated.
- **Download endpoint is rate-limited via Upstash Redis** — free assets keyed by IP, paid assets keyed by the download token itself, so a leaked/forwarded token has its own budget independent of which IP uses it. REST-based Redis specifically because it works from stateless serverless functions without holding a persistent connection.
- **Batch upload loops client-side over the existing single-file `/api/upload` route** rather than rewriting that route into a multipart-batch endpoint. The single-file route is already the one that carries the auth check, magic-byte verification, and size limit — reusing it via a client-side loop (with per-file progress and independent pass/fail) gets batch behavior without re-implementing or re-reviewing that security surface under time pressure.
- **Price is read from the database inside `/api/checkout`, never trusted from the request body.** The client only ever sends an `assetId`.
- **Admin routes are guarded twice**: `middleware.ts` blocks unauthenticated page loads at the edge, and every mutating API route independently calls `requireAdmin()`. The middleware matcher deliberately excludes `/api/*` — those routes have public GET methods alongside admin-only mutations, so auth is enforced per-operation inside each route rather than per-path.
- **Public pages are `dynamic = "force-dynamic"`, not ISR.** ISR (`revalidate = 60`) prerenders at *build time*, which would make every Vercel deploy silently depend on the build environment reaching Postgres. On-request rendering removes that coupling.
- **Drizzle over Prisma** — no separate query-engine binary, so no added cold-start latency on serverless functions, and it reads closer to raw SQL.
- **Next.js pinned to 14.2.35, not 14.2.15.** 14.2.15 carries CVE-2025-29927, a critical middleware authorization-bypass — directly relevant since every admin route's protection lives in `middleware.ts`.

- **Login is rate-limited by email+IP together** (`loginLimit` in `rateLimit.ts`), checked before the DB lookup or bcrypt compare — the one auth entry point in the app, so brute-force protection matters more here than anywhere else. NextAuth's credentials flow already carries built-in CSRF protection (double-submit cookie via `/api/auth/csrf`); the rate limit was the actual missing half, not CSRF.
- **The contact page has a real, working form** (`/api/contact`), not just CMS-rendered text — validated server-side, rate-limited by IP, forwarded via Resend to `CONTACT_RECIPIENT_EMAIL`, with a honeypot field against basic bot spam. If Resend/recipient aren't configured, the visitor gets an honest delivery-failed error rather than a false "sent!".
- **Every asset now has its own permalink** at `/photo/[id]` with real per-asset `generateMetadata` (title, description, Open Graph image from the actual preview). Before this, assets only existed inside a lightbox modal on `/` — nothing for Google Images to index or a social share to point at, which matters specifically for a photography storefront. Gallery thumbnails are real `<Link>` elements to these permalinks (crawlable, work with JS disabled) whose click handler is intercepted to open the faster in-page lightbox when JS is available — progressive enhancement, not an either/or.
- **`sitemap.ts` and `robots.ts`** — the sitemap is generated per-request (same OK build-time-DB-dependency reasoning as the other DB-backed routes) and includes every asset's permalink.
- **The purchase/checkout UI (`PurchasePanel.tsx`) is shared** between the lightbox and the standalone photo page — written and reviewed once instead of maintaining the same checkout logic in two places that could drift apart.
- **Lightbox accessibility**: focus moves into the dialog on open and is trapped there (Tab/Shift+Tab cycle within it, don't escape to the page behind), focus returns to whatever triggered it on close, `role="dialog"`/`aria-modal`/`aria-labelledby` are set, and alt text includes the description when one exists, not just the title.
- **First-row gallery images get `priority`** on the `next/image` call (the rest stay lazy) — meaningful for LCP on a page whose entire job is displaying images, and the kind of thing that's easy to leave uniformly-lazy by default.
- **`OPERATIONS.md`** — a runbook for the non-technical client, not just the developer: password reset, API key rotation (and why a redeploy is required after), manually re-delivering a stuck webhook, and how the refund flow behaves so a support request doesn't need to reach a developer.

## Update log — design/UX/architecture pass

- **Monochrome theme.** Removed the gold/bronze accent palette entirely — `tailwind.config.ts` now has `ink`/`paper`/`graphite` only, matching the minimal black-and-white direction of the reference sites (Awwwards photography portfolios).
- **Rebrand** — "Studio Lens" → "Photographer Portfolio" everywhere (nav, footer, page metadata, OG tags).
- **Removed a real watermark bug**: the codebase had two watermark layers stacked — the intended one baked server-side into the preview image by Cloudinary, and a second, purely decorative CSS overlay rendered client-side in the Lightbox. The CSS one was the one showing "in the middle" diagonally, and it was also a genuine weak point: a CSS overlay can be defeated by disabling styles, viewing page source, or right-click → "copy image" (which grabs the raw `<img>` src underneath it). Removed it — the only watermark now is the real one.
- **Watermark repositioned to a small bottom-right corner mark** instead of a large rotated diagonal through the center, text now brand-consistent ("PORTFOLIO" by default) and configurable via `WATERMARK_TEXT`.
- **Real mobile nav** — `Nav.tsx`: hamburger + slide-in panel below `md`, full inline links at `md` and above, body-scroll lock while open. This was the root cause behind both the nav complaint and the "photo page isn't responsive" complaint — same shared header.
- **Services rebuilt as a first-class, DB-backed collection** instead of a JSON blob typed into an admin textarea:
  - New `services` table — title, price (free text, not run through Stripe), short/long description, optional photo, admin-controlled sort order, and a slug that's minted server-side once and never changes afterward (so a service's URL survives future title edits).
  - `/admin/services` — one page: an add/edit form with the current list rendered directly below it, up/down reorder buttons, image upload, edit, delete. No JSON, no code, by design.
  - Every service now has its own page at `/services/[slug]` with a full description, photo, and a CTA into `/contact` — the "expand into another page" behavior asked for, and also closes the earlier SEO gap the same way `/photo/[id]` did for assets (its own crawlable, shareable URL with real OpenGraph metadata).
  - `/admin/content`'s Services tab is now just the intro heading/body shown above the service cards — it links to `/admin/services` for the actual list.
- **Asset-rename UX**: audited the whole path (edit page, `PUT /api/assets/[id]`) and found no functional bug — it works. What's much more likely is discoverability: the only entry point was a small text link easy to miss. The entire thumbnail is now clickable straight into edit (with a hover affordance), and the "Edit" action is now a visible button instead of small text.

## Known gaps / what I'd still do with more time

- **Automated tests** — none yet. Vitest for `validations.ts` / `downloadToken.ts` (both pure functions, no mocking needed), Playwright for gallery rendering, admin-auth redirect, and — as a stretch goal, since it's the hardest to keep stable — the full Stripe checkout redirect.
- **CI/CD** — no GitHub Actions workflow yet (lint + typecheck + test on PR, `db:migrate` on push to main). Note for whoever writes it: `next build` reads several `process.env` vars at module-load time (Stripe/Cloudinary client construction), so the build/typecheck job needs placeholder secrets even though it isn't hitting a real service — same placeholders used to validate this build locally.
- **Admin dashboard sidebar isn't mobile-responsive** (fixed-width, no collapse) — same class of issue the public nav had, not yet applied to `/admin`. Not flagged in the original brief, and the admin is presumably used on desktop, but worth knowing it's there.
