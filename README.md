# Austin Speedrun

Marketing site for the **Austin Speedrun** — a gt.school city-wide academic contest for every middle schooler in the 5-county Austin metro. Two $100,000 crowns (best young mathematician + best young reader), a $50,000 Effort Grand, and $1,000 champions in every zip.

Static site — plain HTML/CSS/JS, no build step.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Split landing page — "I'm a student" vs "I'm a parent". Panels grow on hover. |
| `students.html` | Student experience — hero countdown, leaderboard, prize lanes, ZIP lookup, 300 Club, Winter Grind. |
| `parents.html` | Parent explainer — how it works, credibility, prizes & payout, safety/COPPA, timeline, FAQ, waitlist form. |

## Assets

| File | Purpose |
| --- | --- |
| `assets/logo.js` | Shared inline SVG wordmark (`ASR_LOGO` / `ASR_WORDMARK`). |
| `assets/kids.css` / `assets/kids.js` | Styles + interactivity for the student page (countdown, leaderboard tabs, ZIP tool, share). |
| `assets/parents.css` / `assets/parents.js` | Styles + waitlist form validation for the parent page. |
| `assets/zipdata.js` | The 99 Austin-metro residential ZIPs (county, est. middle-schoolers, tier). |

Fonts (Clash Display, General Sans, Source Serif 4, JetBrains Mono) load from Google Fonts / Fontshare CDNs.

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
- The waitlist form is front-end only (no backend) — submissions are held in memory for the demo.
