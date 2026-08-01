# Austin SpeedRun — Blockers & Asks

_Status: Aug 1, 2026 · Owner: Jessie_

**What it is:** A free, citywide academic contest for every Austin-metro middle schooler, run on **Timeback**, with two **$100,000 crowns** and $1,000 prizes in every zip. The marketing site and contest mechanics are built.

**Where we are:** Concept, prize structure, cost model, and the full marketing site are **done**. We are **blocked on 3 dependencies owned by other teams.** Until they clear, we can't legally launch, market, or score the contest, and the original timeline (Aug 3 registration / Aug 24 season) is no longer possible.

**The 3 asks in one line:** (1) provision `austin.gt.school` + host the site, (2) confirm Timeback can tag a SpeedRun cohort and export its metrics, (3) legal sign-off to use AlphaTest/SAT for a public commercial contest.

---

### Blocker 1 — No official web home
- **Blocker:** The full site is finished but lives on a temporary URL. We can't market or collect registrations under the GT brand off-domain.
- **Impact:** No public launch, no ads, no signups, no live-event funnel, there's nowhere legitimate to send people.
- **Ask:** Provision **`austin.gt.school`** and host the built static site (we hand off finished files).
- **Owner:** `[GT web / DNS / eng]`
- **Needed by:** `[date]`

### Blocker 2 — Timeback contest data
- **Blocker:** The contest is scored entirely on Timeback (XP, mastery / Verified Grade Levels, AlphaTest). We need Timeback to (a) **tag registrants as a "SpeedRun" cohort** and (b) **expose their per-student metrics.**
- **Impact:** Without a data feed there is **literally nothing to score or show on the leaderboard**, the contest cannot run.
- **Ask:** Confirm Timeback can tag a cohort and provide per-student **XP / mastery / AlphaTest** (API or export), and name who builds/owns it.
- **Owner:** `[Timeback / eng lead]`
- **Needed by:** `[date]`

### Blocker 3 — Legal / test usage
- **Blocker:** NWEA **MAP** likely can't be used commercially (MSA pending), so we've pivoted to **Timeback + AlphaTest for the season and the real SAT at finals.** These still need legal clearance for a public, prize-bearing contest marketed to minors.
- **Impact:** Determines whether/when we can announce and open registration, this drives the entire timeline.
- **Ask:** Confirm we can use **AlphaTest** (season) and the **SAT** (finals) as the basis for a public commercial contest; flag any COPPA / prize-tax / publicity-release constraints.
- **Owner:** `[Legal]`
- **Needed by:** `[date]`

---

### What's already done (only the 3 unlocks remain)
- Full marketing site: landing page + parent page + student page (light/dark toggle), FAQ, and waitlist form, built and deploy-ready.
- Prize structure + rules designed; cost modeled (**~$450K–$790K** realistic all-in, dominated by fixed guaranteed prizes; SAT scholarships ~$25–90K on top).
- Contest mechanics redesigned to be **MAP-free** (Timeback season → SAT finals).
- Brand assets, short-form/TikTok creative direction, and pitch slides.

### Open decisions (not hard blockers, but need a call)
- Confirm **SAT-at-finals** as the crown decider + external credibility anchor (replaces MAP).
- **Grassroots live-event pilot** vs. full launch first.
- **Revised timeline** — strawman: pilot events now → registration ~Oct → season ~late-Oct–Feb → SAT finals + championship ~Feb. (Fallback: run the real season **Spring 2027**.)
