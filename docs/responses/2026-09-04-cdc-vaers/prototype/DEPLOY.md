# Prototype deployment

**LIVE: `https://vaers-demo.frasierdigital.com`** (branded, in Tab 2-2; `https://vaers-demo.vercel.app` serves the same deployment as fallback) (deployed 2026-08-17, project
`vaers-demo` under the jwfrasier Vercel account; verified 244ms TTFB, 1.2s
full load, headers correct, PRS#1 branch working in production).
Optional: attach `vaers-demo.frasierdigital.com` for a branded URL and update
`../tab2-2-prototype.md` if so.

The app is fully static (`npm run build` → `dist/`, ~75 KB gzip JS + fonts). No
backend, no data collection, no cookies. `noindex,nofollow` is set.

## Requirements from the bid plan

- **The link must stay alive through evaluation (~Nov 2026).** A dead link
  during evaluation = dead bid. Uptime-monitor it from day one.
- Serve over HTTPS at a clean, professional URL (e.g.
  `https://vaers-demo.frasierdigital.com`). The URL goes verbatim into Tab 2-2.
- No login wall — RFQ requires "an accessible electronic link."

## Deploy (Vercel — house instance)

`vercel.json` is committed with headers (noindex, CSP, immutable asset cache)
and the static build config. One-time setup on a new machine: `vercel login`.

```sh
cd prototype
vercel deploy --prod --yes    # first run creates the project; accept defaults
```

Then attach the clean domain in the Vercel dashboard or:

```sh
vercel domains add vaers-demo.frasierdigital.com
vercel alias <deployment-url> vaers-demo.frasierdigital.com
```

The production URL (custom domain preferred, `*.vercel.app` acceptable)
replaces the placeholder in `../tab2-2-prototype.md`. Re-deploys are the same
`vercel deploy --prod` — run the pre-send checklist below first, every time.

## AI assist endpoint (`/api/assist`)

Two-stage hardened pipeline, deployed as a Vercel serverless function:

1. **Classifier — `claude-haiku-4-5`** (schema-enforced structured output):
   dissects intent before anything is answered. Categories: form/VAERS/document
   questions, narrative drafts (coach), emergency, medical advice,
   causality/debate, prompt injection, PII shared, off-topic, abusive.
2. **Deterministic gate**: safety-critical intents receive FIXED approved
   language (the 911 message, the no-medical-advice message, the neutral
   causality message) — never model-generated. Gate order: emergency > PII >
   injection > medical advice > causality > topic.
3. **Responder — `claude-sonnet-5`** (effort low): in-scope answers only, with
   containment tags, a can't-say list (no diagnosis/treatment, no causality
   claims, no vaccine debate, no manufacturer opinions, no from-memory
   statistics, no legal advice), and output tag-stripping.

Safeguards: layered rate limits (20/min + 120/hr per IP — deliberately
generous because an evaluation panel shares one agency egress IP; 400/hr +
$5/day per instance as the real abuse backstop; Retry-After on 429), 600-char input cap, origin check, no-store,
fail-closed on any error (client falls back to scripted answers — the demo
never breaks), JSON traces to function logs (intent/latency/tokens, never user
content). Requires `ANTHROPIC_API_KEY` env var (set in Vercel, prod).

Cost: ~0.3-0.5¢ per answered question (classifier ~0.05¢ + responder). The
in-memory rate limiter is per-serverless-instance; at demo traffic one warm
instance serves everything. For hard multi-instance guarantees, attach Upstash
(Vercel Marketplace) or enable Vercel WAF rate rules.

## Uptime monitor (LIVE)

GitHub Actions workflow `vaers-demo-uptime.yml` on the repo's `main` branch,
every 10 minutes: checks the landing page (200 + expected content) and the
assist function (empty POST must return 400 — proves the function executes
without spending AI tokens). One retry after 45s before declaring failure.
On failure: opens a deduplicated `vaers-demo-down` issue with redeploy
instructions and fails the run (GitHub emails the workflow author); the issue
auto-closes when the demo is healthy again. Verified green on first run.

## Pre-send checklist (run before 9/2)

- [ ] `npm run build` clean
- [ ] `node a11y.js` all PASS (WCAG 2.1 AA + 508 tags, 9 states)
- [ ] `node e2e.js` produces the structured record
- [ ] Open deployed URL on a phone: complete public path end-to-end
- [ ] Provider vaccine-error-no-AE path: verify AE sections suppressed
- [ ] Admin edit → visible in form (then Reset all changes)
- [ ] Load time < 3s on throttled connection (Lighthouse mobile)
- [ ] AI battery: in-scope answer works; emergency/medical-advice/injection/PII
      prompts all return canned gates; rate limit 429s on the 9th rapid request
- [ ] Uptime monitor green (Actions → "VAERS demo uptime", no open vaers-demo-down issue)
- [ ] Hard-refresh after the final deploy (HTML CDN cache is 5 minutes)
