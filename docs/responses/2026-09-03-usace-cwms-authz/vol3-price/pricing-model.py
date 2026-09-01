#!/usr/bin/env python3
"""USACE CWMS PANHEC-26-P-0000-026407 — price model (8/30 draft).
FFP per-task CLINs. Rate card (fully burdened bill): PM $165 / Senior $145 / Associate $90.
Hours = Vol I Factor 1 Table A-2 (must stay identical). Cost basis: 1099 rates on people cards,
burden 5%, G&A 8% (house convention). Incumbent anchor: W912HQ25P0049 Solid Logix $241,435.
"""
import json
BURDEN, GA = 0.05, 0.08
LOAD = (1 + BURDEN) * (1 + GA)
RATE = {"PM": 165, "SR": 145, "AS": 90}
COST = {"Joseph": 75, "Scott": 60, "Zach": 75, "Randy": 65, "Andrew": 50, "Seth": 50}
CAT = {"Joseph": "PM", "Scott": "SR", "Zach": "SR", "Randy": "SR", "Andrew": "AS", "Seth": "AS"}
LABEL = {"Joseph": "Project Manager", "Scott": "System Engineer / Architect",
         "Zach": "Senior Forms (React/TypeScript) Developer / Senior Oracle DBA (dual role)", "Randy": "Senior Java Developer",
         "Andrew": "Associate Software Engineer", "Seth": "Associate Software Engineer"}
# CLIN, task, description, option?, hours by person
TASKS = [
    ("1001", "Task 1a", "Development meetings (26)", False, {"Joseph": 78, "Scott": 12, "Zach": 20, "Randy": 12, "Seth": 8}),
    ("2001", "Task 2",  "Improve authorization web UI and CDA integration", False, {"Joseph": 50, "Zach": 250, "Randy": 150, "Andrew": 100}),
    ("3001", "Task 3a", "Implement authorization in CWBI-Dev", False, {"Joseph": 40, "Scott": 120, "Randy": 40}),
    ("5001", "Task 5a", "Maintenance (≤803 h)", False, {"Joseph": 70, "Zach": 160, "Randy": 150, "Seth": 400}),
    ("1002", "Task 1b", "Development meetings, additional 26 (option)", True, {"Joseph": 78, "Scott": 12, "Zach": 20, "Randy": 12, "Seth": 8}),
    ("3002", "Task 3b", "Implement authorization in CWBI-Test (option)", True, {"Joseph": 20, "Scott": 80, "Randy": 20}),
    ("4001", "Task 4",  "Load testing (option)", True, {"Joseph": 20, "Zach": 20, "Scott": 60, "Randy": 40, "Seth": 40}),
    ("5002", "Task 5b", "Maintenance (≤704 h) (option)", True, {"Joseph": 60, "Zach": 140, "Randy": 130, "Seth": 350}),
]
def price(h): return sum(n * RATE[CAT[p]] for p, n in h.items())
def cost(h): return sum(n * COST[p] for p, n in h.items())
out = []
print(f"{'CLIN':<6}{'Task':<9}{'hrs':>6}{'price':>10}{'raw cost':>10}{'loaded':>10}{'margin':>8}")
tb = to = 0
for clin, task, desc, opt, h in TASKS:
    hrs, p, c = sum(h.values()), price(h), cost(h)
    l = c * LOAD
    print(f"{clin:<6}{task:<9}{hrs:>6}{p:>10,}{c:>10,}{l:>10,.0f}{(p-l)/p:>8.0%}")
    out.append({"clin": clin, "task": task, "desc": desc, "option": opt, "hours": h, "price": p})
    if opt: to += p
    else: tb += p
print(f"\nBASE {tb:,}   OPTIONS {to:,}   TOTAL EVALUATED {tb+to:,}")
by_person = {}
for t in TASKS:
    for p, n in t[4].items(): by_person[p] = by_person.get(p, 0) + n
allh = sum(by_person.values()); allp = tb + to
print(f"blended bill ${allp/allh:,.0f}/hr over {allh} h; by person: {by_person}")
rc = sum(n * COST[p] for p, n in by_person.items()); print(f"all-options raw cost ${rc:,} loaded ${rc*LOAD:,.0f} profit ${allp-rc*LOAD:,.0f} ({(allp-rc*LOAD)/allp:.0%}); owner labor in cost ${by_person['Joseph']*75:,}")
json.dump({"rate": RATE, "cat": CAT, "label": LABEL, "tasks": out, "base": tb, "options": to, "total": tb + to},
          open(__file__.replace("pricing-model.py", "model.json"), "w"), indent=1)
