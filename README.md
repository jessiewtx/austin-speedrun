# Austin Speedrun

Marketing site for the **Austin Speedrun**, a gt.school city-wide academic contest for every middle schooler in the 5-county Austin metro. Two $100,000 crowns (best young mathematician + best young reader), a $50,000 Effort Grand, and $1,000 champions in every zip.

Static site: plain HTML/CSS/JS, no build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Split landing page: "I'm a student" vs "I'm a parent". Panels grow on hover. |
| `students.html` | Student experience: hero countdown, leaderboard, prize lanes, ZIP lookup, 300 Club, Winter Grind. |
| `parents.html` | Parent explainer + registration form (`#join`). Referrals via `?ref=CODE`. Writes to Supabase → Tracker. |
| `resources/index.html` | The research behind the claims, plus the site's FAQ. Rendered from `assets/evidence.js`; served at `/resources/`. See [EVIDENCE.md](EVIDENCE.md). |

## Assets

| File | Purpose |
| --- | --- |
| `assets/logo.js` | Shared inline SVG wordmark (`ASR_LOGO` / `ASR_WORDMARK`). |
| `assets/kids.css` / `assets/kids.js` | Styles + interactivity for the student page (countdown, leaderboard tabs, ZIP tool, share). |
| `assets/parents.css` / `assets/parents.js` | Styles + registration form (Supabase `register_participant`, invite link on success). |
| `assets/supabase-config.example.js` | Template for Supabase URL + anon key. Copy to `supabase-config.js` (gitignored). |
| `assets/zipdata.js` | The 99 Austin-metro residential ZIPs (county, est. middle-schoolers, tier). |
| `assets/evidence.js` | Generated citation data (`window.GT_EVIDENCE`), same idiom as `zipdata.js`. Do not hand-edit. |
| `assets/resources.css` / `assets/resources.js` | Styles + renderer for the Resources page. See [EVIDENCE.md](EVIDENCE.md). |

Fonts (Clash Display, General Sans, Source Serif 4, JetBrains Mono) load from Google Fonts / Fontshare CDNs.

## Registration (Supabase)

The parent registration form on `parents.html#join` writes to the **Austin Speedrun Tracker** database.

| Page | Referrals |
| --- | --- |
| `parents.html?ref=CODE#join` | Yes — invite link shown after signup |

1. Create a Supabase project (GT org) and run the SQL under `../austin-speedrun-tracker/supabase/` (see that repo’s README), including `patch-portal-auth.sql` for the parent portal
2. Copy `assets/supabase-config.example.js` → `assets/supabase-config.js` and paste Project URL + anon key + optional `portalUrl` (**do not commit** `supabase-config.js`)
3. Use the same keys in the tracker `.env` and `../austin-speedrun-portal/.env` (**do not commit** `.env`)
4. Submit registration → row appears in the Tracker; with `portalUrl` set, success links to the [parent portal](../austin-speedrun-portal) where parents **Create password** (no auth email). Resend set-password emails are parked until a domain is ready.

### Secrets

- Commit: `supabase-config.example.js` only  
- Ignore: `assets/supabase-config.js` (listed in `.gitignore`)  
- Check with `git status` before committing — real keys should not appear

## Run locally

```bash
# any static server; e.g.
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Related docs

| File | Purpose |
| --- | --- |
| [SPEEDRUN-blockers-and-asks.md](SPEEDRUN-blockers-and-asks.md) | Open program decisions + the three asks for leadership. |
| [EVIDENCE.md](EVIDENCE.md) | How the evidence library and FAQ on `/resources/` are authored and built. |
| [PRIZE-STRUCTURE.md](PRIZE-STRUCTURE.md) | Full prize architecture (math + research notes). |
| [MAP-alternatives-research.md](MAP-alternatives-research.md) | Assessment-instrument options if MAP isn't viable. |
| [EVENTS-research.md](EVENTS-research.md) | Live-event formats under consideration. |
