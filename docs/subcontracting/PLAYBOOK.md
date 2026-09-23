# Subcontracting playbook — first federal past performance through a prime

**Goal.** A citable federal reference (a PPQ-able engagement with a government end customer) in
months, not years, by delivering an AI/data slice under a prime that already holds the award.
Two levers, and they differ by prime size:
- **Large primes** (awards > $750k) carry subcontracting plans with SB/SDB goals; a sub award to Frasier counts toward them.
- **Small primes on a set-aside** have no plan, but must keep ≥50% of services in-house (13 CFR 125.6). Work placed with a *similarly situated* sub does not count against that 50%. Frasier is small, so on a **total SB set-aside** we are similarly situated and our slice is free to them. On **8(a), WOSB, SDVOSB or HUBZone** set-asides we are NOT similarly situated, so keep the slice ≤30%.

## Channels, in order of yield

1. **Fresh small-prime awards (FPDS) — `npm run sub-prospects`.** Small/8(a)/SDVOSB/HUBZone/WOSB
   primes that just won software-shaped work in our NAICS and now have to staff it. Output goes to
   `docs/subcontracting/PROSPECTS-<date>.md` with a working list. Run monthly; work the top 10.
   Best targets: multi-year IT support or application-development awards $1M–$10M at agencies
   we already know (NOAA, CDC, USACE, SSS, Census/Commerce), where an "AI feature" or "dashboard"
   task order is plausible and the prime is a 20–100 person shop.
2. **Large-prime subcontracting plans.** Any large business award over $750k carries a
   subcontracting plan with SB/SDB goals and a named Small Business Liaison Officer (SBLO).
   `npm run price-anchor -- --agency "<agency>" --naics 541511 --from <date>` lists them (the
   non-set-aside, large-vendor rows). Find the SBLO on the prime's supplier-diversity page and
   register in their supplier portal; then email the SBLO with the specific contract.
3. **SBA SubNet** — https://legacy.sba.gov/federal-contracting/contracting-guide/prime-subcontracting/subcontracting-opportunities?keyword=software
   Primes post subcontracting opportunities here when their plan requires outreach. Mostly
   construction and Job Corps; check the keyword filter monthly. Postings list the prime's contact.
4. **Team on bids we already see.** When the screener flags a set-aside we cannot claim
   (SDVOSB/8(a)/WOSB-only) that is otherwise a strong fit, the move is not "pass" — it is to
   find an eligible prime already bidding and offer the AI workstream as their sub. The
   scorer's set-aside note is the trigger.
5. **Agency small-business offices (OSDBU) and industry days.** Ask the specialist which primes
   are under-delivering on SDB goals; they know and will say.

## Limits to respect

- Limitations on subcontracting (FAR 19.505 / 13 CFR 125.6): the prime keeps ≥50% of services value,
  excluding similarly-situated subs. Total-SB set-aside → we are similarly situated, pitch freely.
  8(a)/WOSB/SDVOSB/HUBZone set-aside → we are not, pitch ≤30%. Check `typeOfSetAside` on the FPDS row.
- Flow-downs: C-SCRM, SSDF attestation and 52.204-21 basic safeguarding flow to subs — we can
  sign all three today.
- Never name a sub engagement as "past performance" in a bid until the government end user will
  confirm it on a PPQ. Get that agreement in the teaming/subcontract paper.

## Cadence

- Monthly: regenerate PROSPECTS, send 10 outreach emails, log in the working list.
- Per reply: 15-minute call, then a one-page capability + rate sheet; propose a teaming agreement
  (non-exclusive) so we are on file before their next task order.
- Track in `docs/BIDS.md` under a "Subcontract pursuits" section once any prime replies.
