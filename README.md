# Austin Speedrun

Marketing site for the **Austin Speedrun**, a gt.school city-wide academic contest for every middle schooler in the 5-county Austin metro. Two $100,000 crowns (best young mathematician + best young reader), a $50,000 Effort Grand, and $1,000 champions in every zip.

Static site: plain HTML/CSS/JS, no build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Split landing page: "I'm a student" vs "I'm a parent". Panels grow on hover. |
| `students.html` | Student experience: hero countdown, leaderboard, prize lanes, ZIP lookup, 300 Club, Winter Grind. |
| `parents.html` | Parent explainer: how it works, credibility, prizes & payout, safety/COPPA, timeline, waitlist form. |
| `signup.html` | Registration form (referrals via `?ref=CODE`). Writes to Supabase → Tracker. |
| `resources/index.html` | The research behind the claims, plus the site's FAQ. Rendered from `assets/evidence.js`; served at `/resources/`. See [EVIDENCE.md](EVIDENCE.md). |

## Assets

| File | Purpose |
| --- | --- |
| `assets/logo.js` | Shared inline SVG wordmark (`ASR_LOGO` / `ASR_WORDMARK`). |
| `assets/kids.css` / `assets/kids.js` | Styles + interactivity for the student page (countdown, leaderboard tabs, ZIP tool, share). |
| `assets/parents.css` / `assets/parents.js` | Styles + waitlist form (Supabase `waitlist_participant`). |
| `assets/signup.js` | Signup form (Supabase `register_participant`, invite link on success). |
| `assets/supabase-config.example.js` | Template for Supabase URL + anon key. Copy to `supabase-config.js` (gitignored). |
| `assets/zipdata.js` | The 99 Austin-metro residential ZIPs (county, est. middle-schoolers, tier). |
| `assets/evidence.js` | Generated citation data (`window.GT_EVIDENCE`), same idiom as `zipdata.js`. Do not hand-edit. |
| `assets/resources.css` / `assets/resources.js` | Styles + renderer for the Resources page. See [EVIDENCE.md](EVIDENCE.md). |

Fonts (Clash Display, General Sans, Source Serif 4, JetBrains Mono) load from Google Fonts / Fontshare CDNs.

## Waitlist + signup (Supabase)

Both forms write to the **Austin Speedrun Tracker** database (same Supabase project).

| Form | Page | Referrals |
| --- | --- | --- |
| Waitlist | `parents.html#join` | No |
| Signup | `signup.html?ref=CODE` | Yes — invite link shown after signup |

1. Create a Supabase project (GT org) and run the SQL under `../austin-speedrun-tracker/supabase/` (see that repo’s README)
2. Copy `assets/supabase-config.example.js` → `assets/supabase-config.js` and paste Project URL + anon key (**do not commit** `supabase-config.js`)
3. Use the same keys in the tracker `.env` (**do not commit** `.env`)
4. Submit waitlist or signup → row appears in the Tracker

### Secrets

- Commit: `supabase-config.example.js` only  
- Ignore: `assets/supabase-config.js` (listed in `.gitignore`)  
- Check with `git status` before committing — real keys should not appear

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to AWS (S3 static website hosting)

Requires AWS credentials with S3 permissions (`aws configure` or env vars).

```bash
./deploy.sh              # uses default bucket name austin-speedrun-site
BUCKET=my-bucket ./deploy.sh
```

The script creates the bucket (if needed), enables static website hosting, uploads
the files with sensible cache headers, and prints the public website URL.

## Notes

- The leaderboard and ZIP-lookup data are **sample/preview** data for the demo.
- The waitlist form is front-end only (no backend); submissions are held in memory for the demo.
