# Evidence data (`assets/evidence.js`)

The Resources page renders from a committed data file, the same way the ZIP
lookup renders from `assets/zipdata.js`. This document is what that file is,
what it promises, and what to do with it during the redesign.

**Nothing here needs a build step, a dependency, or a network call.**

## The short version

| | |
| --- | --- |
| `assets/evidence.js` | Generated data. Assigns one global, `window.GT_EVIDENCE`. Do not hand-edit |
| `assets/resources.js` | The renderer. **Yours to rewrite or delete** |
| `assets/resources.css` | Styles for the entries only. Layers on top of `parents.css` |
| `resources/index.html` | The page. Served at `/resources/` |

`assets/` is synced wholesale by `deploy.sh`, so the first three need nothing.
The page itself needed **one line of `deploy.sh`**: the HTML sync ended in
`--exclude "*/*"`, which drops every key containing a slash, so
`resources/index.html` would have been skipped without a word. An
`--include "resources/*.html"` now follows it. The exclude is deliberately left
in place, so any future page in a subdirectory needs its own `--include` too.

## The one rule everything else follows from

**The data augments what is already written in the HTML. It is never the sole
source of a section.**

So every failure is harmless, because the fallback is not an error page — it is
the hand-written copy already in `resources/index.html`. If the data file is missing,
empty, out of date, or fails to parse, the Resources page still renders a
finished page that says, honestly, that nothing is published yet.

That is also the state it ships in. **The file is empty on purpose right now.**
The library it draws from is still being written, so the page currently shows
its hand-written explanation and nothing else. Merging it changes nothing a
visitor can see until there is something real to show.

## What happens in every failure case

| State | What the page does |
| --- | --- |
| File is empty (today) | Renders the hand-written panel, plus the date the library was last checked |
| File missing, 404, or removed | Same, minus the date. `window.GT_EVIDENCE` is simply undefined |
| File fails to parse | Same. It is the last script on the page, so nothing else is affected |
| `schemaVersion` the renderer does not know | Renders nothing extra, deliberately. A partial read of a shape it does not understand is how a page shows something wrong with confidence |
| One collection is empty or malformed | That section stays hidden; the others render |
| One record is missing a field it needs | That record is skipped; the rest of the collection renders |
| A `url` is null | The entry renders as text instead of a link. Citations are still complete: `doiUrl` reaches the original |
| The file is out of date | It renders anyway. A stale citation beats no citation, and freshness is our problem to watch, not the page's |

Every row is a branch in `assets/resources.js`, and the same rules are unit
tested on our side against the reference implementation.

## The shape

```js
window.GT_EVIDENCE = {
  schemaVersion: 1,
  generatedAt: "2026-07-30T20:56:03.879Z",
  generator: "gt-evidence-library@c98d3f7",
  source: null,

  topics:     [],  // { slug, label }
  references: [],  // published research
  articles:   [],  // our notes on it
  faq:        [],
  claims:     []   // a statement, plus the slugs that support it
};
```

Two structural promises, so a renderer written against the empty file keeps
working unchanged when content arrives:

1. **Every collection is always present as an array**, even when empty.
2. **Every field is always present, or explicitly null.** Never
   sometimes-absent, so nothing ever needs `hasOwnProperty`.

### Fields

| Collection | Fields |
| --- | --- |
| `topics[]` | `slug` (join on this), `label` (the display name — never hardcode it) |
| `references[]` | `slug`, `title`, `citationAuthors`, `source` (journal or publisher), `year`, `keyStat`, `summary`, `doiUrl`, `sourceUrl`, `topicSlug`, `url` |
| `articles[]` | `slug`, `title`, `excerpt`, `topicSlug`, `publishDate`, `updatedDate` (both `YYYY-MM-DD` — format them however you like), `referenceSlugs`, `url` |
| `faq[]` | `slug`, `question`, `answer`, `answerSpans`, `order`, `topicSlug`, `updated`, `relatedArticleSlugs`, `url` |
| `claims[]` | `key`, `statement`, `referenceSlugs`, `articleSlugs`, `url` |

Things you can rely on:

- Every value is **plain text**. No HTML, no entities. (The renderer still uses
  `textContent` rather than `innerHTML` — a promise is not a reason to skip the
  safe call.)
- Prose fields — FAQ `answer`, article `excerpt`, reference `summary` — separate
  **paragraphs with a blank line** (`\n\n`), and a line break within a paragraph
  with a single `\n`. Answers run to four paragraphs, so `assets/resources.js`
  splits on the blank line and builds a `<p>` per block. If you rewrite the
  renderer, do the same: dropping the whole string into one node runs the
  paragraphs together.
- An answer that carries a link or a bold run also carries `answerSpans`: the
  same answer, as paragraphs of `{ text, href, strong }`, where `href` is an
  absolute `http(s)` URL or null and `strong` is a boolean. It is **null on
  plain answers** — the field exists so ten records can carry formatting, not so
  all twenty-five can carry a second copy of themselves.

  Concatenating every span's `text` and joining the paragraphs with a blank line
  reproduces `answer` exactly. That is checked when the file is built, and the
  field is dropped rather than emitted when the two disagree, so the pair can
  never say different things. Read whichever one you understand.

  Both travel as data because the text does not carry markup: an `<a>` or a
  `<b>` written into `answer` would arrive here as the characters `<a href=…>`.
  `assets/resources.js` builds the elements with `createElement` and
  `textContent` and sets `href` only after checking the scheme. If you rewrite
  the renderer, keep that shape — and if you skip the field entirely, every
  answer still reads correctly and only loses its formatting.

  Links and bold, and nothing else. Headings, lists and italics are still
  flattened to text. If you want another one, it is a small change.
- `faq[].order` is the sequence an editor put the questions in, ascending. It is
  **not a ranking and not an instruction** — where the questions go on the page
  is still entirely yours; this only says which one we think a reader should
  meet first within a group, which is the one thing you cannot work out from the
  records themselves. Ties are normal (the column defaults to zero), so sort
  stably or tie-break on your own order. Ignore it and you get slug order, which
  is what you got before the field existed.
- Every non-null `topicSlug` resolves to a record in `topics`.
- Every entry in a `*Slugs` array resolves to a record in its collection.
- Collections are sorted by slug. **That is not a ranking** — it just keeps the
  diff of a refresh small. Placement is yours.
- `url` and the top-level `source` are **null today**. They point at our own
  site, and it has no public home yet. They will start appearing on their own.

One wart, called out so it does not surprise anyone: top-level `source` is our
site's origin, while `references[].source` is a journal or publisher. Different
things, same word.

## The FAQ: one section, two sources

The Resources page has a single FAQ section. Your hand-written entries are the
base and live in the HTML exactly as they always have; library entries merge
into the same list. They use your accordion markup and your classes, so a reader
cannot tell which is which, and nothing about the section depends on the data
file loading.

Every entry carries a slug, and that one value does two jobs:

```html
<details data-faq-slug="speedrun-cost" id="faq-speedrun-cost">
  <summary>How much does it cost?</summary>
  <div class="fa">Nothing. Entry is <b>100% free</b>…</div>
</details>
```

**It is the permalink.** The id is always `faq-` + the slug, so
`/resources/#faq-speedrun-cost` addresses one question and keeps addressing it.
Following such a link expands that entry and scrolls it clear of the sticky nav,
whether the page was already open or not.

**It is also the supersede hook**, which is the part worth understanding,
because it means the two are the same mechanism rather than two ideas sharing a
name: publish a library record with a matching slug and that answer starts
coming from the database, at the URL people have already been sharing. An entry
gets its identifier today and its migration path for free.

The slugs were derived from the questions once and then written into the markup.
**They are identifiers now, not derivations — do not regenerate them from edited
copy.** Reword a question freely; the link and the matching both survive it,
which is the whole reason they are not computed from the text.

- A library record whose `slug` matches a `data-faq-slug` **replaces that entry
  where it sits**, keeping your ordering and its open/closed state.
- A library record matching nothing is **appended**.
- An entry with no `data-faq-slug` is never touched.

**Matching is on the slug, never on the question text.** That is deliberate: you
are rewording this copy during the redesign, and text matching would silently
start showing both versions of the same question the first time a word changed.

So the attribute is the control surface, and it is yours:

| You want | Do this |
| --- | --- |
| Us to maintain an answer | Publish a library record with that entry's slug |
| To take an answer back | Unpublish the record; your copy stands again |
| To keep an answer entirely yours | Nothing — an unmatched slug is just a permalink |
| To rename a question's URL | Change the slug, knowing existing links stop resolving |

All ten of your entries carry a slug, since each one needs a permalink:
`speedrun-cost`, `eligibility`, `homeschoolers`, `time-commitment`,
`cheating-prevention`, `prize-taxes`, `timeback-and-gt-school`, `top-prizes`,
`late-registration`, `program-language`. **All ten now have a library record
behind them**, so every answer in the section is coming from the database. The
markup you wrote is still in the file and is still what renders if the data file
does not load.

Each of the nine that changed in this refresh says everything your version said
and then adds to it — usually a third paragraph naming something the program has
*not* published yet.

**Your bold is back.** The contract now carries emphasis as data, and the nine
answers we replaced emphasise exactly what yours did: **$200,000 Double Crown**,
**30 minutes a day**, **December 20**, **proctored**, **English**. We matched
your originals rather than inventing new emphasis, so the fifteen answers the
library added are unemphasised. If you would rather they were all treated the
same way, say so — but adding bold to an answer nobody wrote in your voice
seemed like the wrong default.

Everything is in American English, including the dates. Our editor had drifted
into British spelling and day-month order, which is how `$100,000 cheques` and
`registration closes on 20 December` ended up on an Austin page.

One change is worth your judgement rather than ours. **"What language is the
program in?"** carries a sentence saying no English-learner support has been
published, pointed at asking about it rather than at whether to enter. The
earlier draft told a family that a child still learning English "is a real thing
to weigh", which is the library's register and probably not yours; that is gone.
The remaining sentence is a fact a parent needs and we would keep it, but
unpublishing that record puts your original back.

### Twenty-five questions, five headings

Ten questions read fine as one flat run. Twenty-five do not — there was no route
to the tax question except reading every heading on the way down. So the section
is now grouped under the five topics the data already carries, with a row of
jump links above it.

Two things about that are deliberate. The topics appear in the order their first
question already appeared, so the page still opens on cost, as you wrote it. And
it is all or nothing: if any entry's topic cannot be resolved — including the
case where the data file is missing entirely — the list keeps exactly the order
it has in your HTML and no jump links appear. A half-filed accordion would be
worse than the flat one.

Within a topic the questions now follow `faq[].order`, so **"What is the Austin
Speedrun?"** leads Participation instead of sitting near the bottom in
alphabetical order. That is the only thing the new field does, and it means the
whole section can be sequenced from the CMS without a pull request to either
repository. Which topic goes where on the page is still decided by your markup.

### Where this is heading

This is a transitional arrangement, and worth saying so plainly. The end state is
that the FAQ entries you want maintained become library records, so they carry
citations, an audit trail, and a review date rather than living only in markup. We
already have a CSV import path, and now that every entry carries a slug the
migration needs nothing from you in the markup at all: tell us which questions
you want maintained, we import them under the slugs already in your HTML, and
those answers start updating on a data refresh instead of in a pull request. The
URLs people have been sharing keep working across the change, because the slug
that was the permalink is the slug the record matches on. Nothing has to move at
once, and the entries you keep stay exactly as they are.

## The order of the page, and what the notes can't do yet

Two changes to `resources/index.html` worth reading before you skim the diff.

**The FAQ now sits directly under the hero, and the library sits below it.** It
was the other way round. The reasoning is that a parent arrives at this page
with a question, and the questions were 2,300 pixels down behind the hero, two
note cards and the three-column standards panel. They start at 864 now. The
library is the credibility layer: it earns attention *after* an answer has
raised the question of whether to believe it, which is also the moment "here is
what we checked" reads as substantiation rather than as preamble. The whole
library section moved as one, so the sources and claims blocks land in the right
place when they have records. This is your page and it is the most invasive
thing in the change — if you want it back the way it was, it is one section
moving in the markup and nothing else depends on it.

**Two capabilities are staged rather than broken.** The Sources block renders
nothing, because no reference in the library is published yet — an entry only
appears once every source under it is published, which is the rule the page's
own standards panel describes. And the notes carry no "read it" link, because
the library is `noindex` and not publicly reachable, so `articles[].url` is
`null` for both. Rather than draw a dead link or a "coming soon" placeholder,
each note is written to be the whole entry: what it found, and what it could not
confirm. A reader who never clicks anything still learns something.

Both fill in on their own. The renderer skips a destination it cannot use, so
the day the library becomes reachable and `url` stops being `null`, the "Read
it" links appear with no change to the markup, the stylesheet or the renderer.
The same is true of the Sources block the first time a reference publishes.

### How the notes are ordered

The notes are grouped under topic headings, in the order the file lists its
topics — the same headings and the same sequence the FAQ above them uses.

**Within a topic the order is alphabetical by title, and that is arbitrary on
purpose.** Notes carry no editorial sequence in the data, and their publish
dates are nearly all the same day, so there is nothing real to sort on. What
alphabetical buys is a list that stays put: inside a topic of two or three,
that is something a reader can scan. Across all eighteen it was noise, which
is what the section did before this.

If a deliberate order ever matters, it belongs in the data as a field on the
record — the way `faq[].order` already works — rather than being inferred in
the renderer. `groupNotesByTopic` in `assets/resources.js` is the one place
that would read it. Nobody has asked for it, so it is not there.

## Using it anywhere else on the site

If you ever want a citation next to a specific sentence on `parents.html` or
`students.html`, you do not need anything from us. Put a container where your
design wants it and tag it with the claim key:

```html
<p>...a 300 in Math is a perfect score...</p>
<div data-gt-claim="map-scale-ceiling"></div>
```

Then look the key up in `window.GT_EVIDENCE.claims`. A `data-` attribute is the
smallest possible coupling and, unlike a class name, it has no reason to change
during a restyle. **If a key is not in the file, render nothing and leave your
copy alone** — that is the normal case while the library fills up, not an
error.

Claim keys are permanent. We add new ones and stop emitting old ones; we never
rename one, because a rename is the only change that could break you.

## Refreshes, and the redesign

A refresh is another small pull request replacing `assets/evidence.js`. Nothing
else in it changes, and you can merge them whenever suits — there is no window
to hit and nothing breaks if you skip one.

**During the redesign, treat all four files as yours.** Restyle
`resources.css`, rewrite `resources.js`, rebuild the page markup. The only
thing we ask you not to hand-edit is `assets/evidence.js`, because the next
refresh overwrites it. If it is easier to drop the renderer entirely for a
while, that is fine too: nothing else on the site reads the global.

`schemaVersion` only changes if we break something, which we will not do
without a pull request in the same window explaining it.

## Questions

Anything about a specific citation, or a sentence you would like sourced, goes
to the GT Evidence Library team. If a claim on the site is not on the Resources
page, that is usually deliberate — we leave a sentence uncited rather than
attach a source that does not actually support it.
