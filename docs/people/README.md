# People Roster

Single source of truth for everyone Frasier Digital may name in proposals — team bench,
consultants, references, and contacts. Proposal staffing sections and bios pull from here.

## How to use (Joseph)
- **Drop resumes into `resumes/`** — any format (PDF/docx/txt/LinkedIn export). Name them
  `firstname-lastname-anything.ext`. Claude reads them and updates the person's card.
- One markdown card per person in this folder, `firstname-lastname.md`. Add new people by
  creating a stub with just a name — Claude fills structure on next touch.
- Tell Claude when facts change (rate, availability, left a job) — cards get updated, and
  active bid docs get synced.

## How to use (Claude)
- **Before writing any staffing section or bio: check this folder first.** Pull facts from
  the person's card and any resume in `resumes/`; put TBD markers only for facts missing
  HERE, and add the same gap to the person's card under "Missing."
- When Joseph supplies bio facts in conversation, update the card here AND the active bid
  docs — this folder is the durable copy.
- Respect the `status` field. In particular: **a person serving as a past-performance
  reference POC must NOT be proposed on any bid team** (verification conflict — the Ethan
  Gula rule).
- Facts marked UNVERIFIED must not ship in a proposal without Joseph's confirmation.

## Card fields
name, status (bench / active-bid / reference-POC / do-not-use / prospect), location,
citizenship, current employer + outside-work constraint, rate, roles they can fill,
verified facts (education, years, systems, certs), bids they're named on, missing facts,
source + verification notes.
