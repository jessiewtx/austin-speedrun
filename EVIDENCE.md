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
| `faq[]` | `slug`, `question`, `answer`, `topicSlug`, `updated`, `relatedArticleSlugs`, `url` |
| `claims[]` | `key`, `statement`, `referenceSlugs`, `articleSlugs`, `url` |

Things you can rely on:

- Every value is **plain text**. No HTML, no entities. (The renderer still uses
  `textContent` rather than `innerHTML` — a promise is not a reason to skip the
  safe call.)
- Every non-null `topicSlug` resolves to a record in `topics`.
- Every entry in a `*Slugs` array resolves to a record in its collection.
- Collections are sorted by slug. **That is not a ranking** — it just keeps the
  diff of a refresh small. Ordering and emphasis are yours.
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

Two of your questions and two of ours can be the same question, so entries are
matched on an explicit id:

```html
<details data-faq-slug="speedrun-cost">
  <summary>How much does it cost?</summary>
  <div class="fa">Nothing. Entry is <b>100% free</b>…</div>
</details>
```

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
| Us to maintain an answer | Add `data-faq-slug="…"` to your `<details>` |
| To take an answer back | Remove the attribute; your copy stands again |
| To keep an answer entirely yours | Leave the attribute off (the default) |

Today only `speedrun-cost` carries one. We left **"Who is eligible?"** alone even
though our `requirements` record covers similar ground, because your answer names
the five counties and ours does not — superseding it would have quietly dropped
information. That is a judgement call and it is yours to reverse: adding
`data-faq-slug="requirements"` to that entry hands it over.

### Where this is heading

This is a transitional arrangement, and worth saying so plainly. The end state is
that the FAQ entries you want maintained become library records, so they carry
citations, an audit trail, and a review date rather than living only in markup. We
already have a CSV import path, so the migration is: you send us the questions you
want to own that way, we import them, you add the matching `data-faq-slug` to each
`<details>`, and from then on those answers update on a refresh instead of in a
pull request. Nothing has to move at once — an entry migrates the moment it gets
an attribute, and the rest keep working untouched.

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
