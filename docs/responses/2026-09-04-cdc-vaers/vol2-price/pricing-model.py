#!/usr/bin/env python3
"""CDC VAERS RFQ 75D301-26-Q-00146 — price model.
9-month FFP (CLIN 0001) + travel CLINs 0002/0003 at CDC's NTE estimates ($31,500 each,
direct reimbursement — not in our margin math).
Cost basis mirrors house convention: 1099 cost rates, burden 5%, G&A 8%.

DECIDED (Joseph 2026-08-24): Scenario B $495,000, itemized per OPTION 1 below —
7 billing lines, 2,780 hrs, blended ≈ $178/hr. Vol I Tab 3-1 synced to these FTEs.
"""

BURDEN, GA = 0.05, 0.08
LOAD = (1 + BURDEN) * (1 + GA)
CLIN_0001 = 495_000

# OPTION 1 (as submitted): (billing category, person, hours, cost_rate, bill_rate)
LINES = [
    ("Program Manager / Lead Architect",              "J. Frasier",   546, 75, 235),
    ("Security & Compliance Lead (SA&A/ATD/EPLC)",    "J. Frasier",   340, 75, 235),
    ("Technical Lead — Healthcare IT",                "R. Daley",     390, 75, 205),
    ("Integration & Data Engineer",                   "R. Shoukoohi", 234, 75, 175),
    ("Frontend Engineer / Test Automation",           "A. Frasier",   780, 50, 135),
    ("QA & Accessibility Engineer",                   "S. Chesky",    300, 50, 135),
    ("Content & UX Research Specialist",              "R. Khazi",     190, 45, 105),
]

hdr = f"{'billing category':<46}{'person':<14}{'hrs':>6}{'bill':>6}{'extended':>11}{'cost':>10}"
print(hdr); print("-" * len(hdr))
tot_hrs = tot_ext = tot_cost = 0
for cat, person, hrs, cost_rate, bill in LINES:
    ext, c = hrs * bill, hrs * cost_rate
    tot_hrs += hrs; tot_ext += ext; tot_cost += c
    print(f"{cat:<46}{person:<14}{hrs:>6}{bill:>6}{ext:>11,}{c:>10,}")
print("-" * len(hdr))
rounding = CLIN_0001 - tot_ext
print(f"{'TOTAL (before rounding adj)':<60}{tot_hrs:>6}{'':>6}{tot_ext:>11,}{tot_cost:>10,}")
print(f"rounding adjustment to FFP: ${rounding:,}   → CLIN 0001 = ${CLIN_0001:,}")

loaded = tot_cost * LOAD
profit = CLIN_0001 - loaded
print(f"\nblended bill rate: ${tot_ext/tot_hrs:,.0f}/hr   avg FTE over 9 mo: {tot_hrs/ (9*173.33):.2f}")
print(f"raw cost: ${tot_cost:,}   loaded (+5% burden +8% G&A): ${loaded:,.0f}")
print(f"CLIN 0001 ${CLIN_0001:,} → profit ${profit:,.0f} ({profit/CLIN_0001:.0%})")
print(f"TEP w/ travel NTEs (0002/0003 pass-through): ${CLIN_0001 + 63_000:,}")
print(f"note: owner labor in cost line = ${886*75:,} — effective owner cash ≈ ${profit + 886*75:,.0f}")
