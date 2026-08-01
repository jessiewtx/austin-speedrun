/* ============================================================
   Renders the Resources page from window.GT_EVIDENCE (assets/evidence.js).

   This file is yours to rewrite or delete. It only reads the data file and
   builds DOM; nothing else on the site depends on it.

   The one rule it is built around: the page's hand-written copy is the
   fallback, never an error state. Every branch below fails towards leaving
   the markup alone, so a missing, empty, stale or unparseable data file
   leaves a Resources page that still reads as finished and honest. Nothing
   here ever empties a container before it knows it has something to put in
   it.
   ============================================================ */
(() => {
  const KNOWN_SCHEMA = 1;

  const data = window.GT_EVIDENCE;

  // Absent (never deployed, or removed by `aws s3 sync --delete`), not an
  // object (failed to parse), or a version this renderer does not know. An
  // unknown version is a total no-op on purpose: a partial read of a shape we
  // do not understand is how a page displays something wrong confidently.
  if (!data || typeof data !== 'object' || data.schemaVersion !== KNOWN_SCHEMA) return;

  const list = (value) => (Array.isArray(value) ? value : []);

  const references = list(data.references);
  const articles   = list(data.articles);
  const faq        = list(data.faq);
  const claims     = list(data.claims);
  const topics     = list(data.topics);

  const referenceBySlug = new Map(references.map(r => [r && r.slug, r]));
  const articleBySlug   = new Map(articles.map(a => [a && a.slug, a]));
  const labelBySlug     = new Map(topics.map(t => [t && t.slug, t && t.label]));

  /* ---------- helpers ---------- */

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    // textContent throughout: the contract promises plain text, but a
    // renderer that trusts that promise is one bad record away from injecting
    // markup into a page aimed at families.
    if (text) node.textContent = text;
    return node;
  };

  const text = (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null);

  // The data file separates paragraphs with a blank line, so build real
  // elements from them. Several answers run to four paragraphs, and dropping
  // one into a single text node renders it as an unbroken wall. Text nodes
  // throughout, for the same reason el() uses textContent.
  const prose = (tag, className, value) => {
    const node = el(tag, className);
    String(value).split(/\n{2,}/).forEach(block => {
      const trimmed = block.trim();
      if (!trimmed) return;
      const para = document.createElement('p');
      // A single newline is a line break within one paragraph.
      trimmed.split('\n').forEach((line, index) => {
        if (index) para.appendChild(document.createElement('br'));
        para.appendChild(document.createTextNode(line));
      });
      node.appendChild(para);
    });
    return node.childElementCount ? node : null;
  };

  // A citation with no usable link renders as plain text; the reader still
  // reaches the source through whichever of the others resolves.
  const safeUrl = (value) => {
    if (typeof value !== 'string' || value.trim() === '') return null;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (_) { return null; }
  };

  const readableDate = (value) => {
    if (typeof value !== 'string' || value === '') return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
  };

  const topicChip = (slug) => {
    const label = text(labelBySlug.get(slug));
    return label ? el('span', 'ev-topic', label) : null;
  };

  const linkRow = (candidates) => {
    const row = el('div', 'ev-links');
    candidates.forEach(([label, raw]) => {
      const href = safeUrl(raw);
      if (!href) return;
      const anchor = el('a', 'ev-link', label);
      anchor.href = href;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      row.appendChild(anchor);
    });
    return row.childElementCount ? row : null;
  };

  const append = (parent, ...nodes) => {
    nodes.forEach(node => { if (node) parent.appendChild(node); });
    return parent;
  };

  /* ---------- entries ---------- */

  // "Bloom, B. S. · Educational Researcher · 1984", with whatever is present.
  const citationLine = (reference) => {
    const parts = [
      text(reference.citationAuthors),
      text(reference.source),
      typeof reference.year === 'number' && Number.isFinite(reference.year) ? String(reference.year) : null
    ].filter(Boolean);
    return parts.length ? el('p', 'ev-cite', parts.join(' · ')) : null;
  };

  const renderReference = (reference) => {
    const title = text(reference.title);
    if (!title) return null;
    return append(el('li', 'ev-item'),
      topicChip(reference.topicSlug),
      el('h3', null, title),
      citationLine(reference),
      text(reference.keyStat) ? el('p', 'ev-stat', text(reference.keyStat)) : null,
      text(reference.summary) ? prose('div', 'ev-note', text(reference.summary)) : null,
      linkRow([['Source', reference.doiUrl], ['Full text', reference.sourceUrl], ['On gt.school', reference.url]])
    );
  };

  const renderArticle = (article) => {
    const title = text(article.title);
    if (!title) return null;
    const published = readableDate(article.publishDate);
    const updated = readableDate(article.updatedDate);
    const dateLine = updated && updated !== published
      ? `Published ${published || '—'} · Updated ${updated}`
      : published ? `Published ${published}` : null;
    const cited = list(article.referenceSlugs)
      .map(slug => referenceBySlug.get(slug))
      .filter(Boolean);

    const item = append(el('li', 'ev-item'),
      topicChip(article.topicSlug),
      el('h3', null, title),
      dateLine ? el('p', 'ev-cite', dateLine) : null,
      text(article.excerpt) ? prose('div', 'ev-note', text(article.excerpt)) : null
    );

    if (cited.length) {
      const support = el('ul', 'ev-support');
      cited.forEach(reference => {
        const row = el('li');
        row.appendChild(el('span', 'ev-kind', 'Cites'));
        row.appendChild(document.createTextNode(text(reference.title) || reference.slug));
        support.appendChild(row);
      });
      item.appendChild(support);
    }
    return append(item, linkRow([['Read it', article.url]]));
  };

  // Built to their accordion's exact shape, so a library answer and a
  // hand-written one are the same component. The only addition is the slug,
  // which is how the next refresh finds this entry again.
  const faqEntry = (record) => {
    const question = text(record.question);
    const answer = text(record.answer);
    const slug = text(record.slug);
    if (!question || !answer || !slug) return null;

    const details = el('details');
    details.setAttribute('data-faq-slug', slug);
    details.id = `faq-${slug}`;
    details.appendChild(el('summary', null, question));

    const body = prose('div', 'fa', answer) || el('div', 'fa', answer);
    const link = linkRow([['Read more on gt.school', record.url]]);
    if (link) body.appendChild(link);
    details.appendChild(body);
    return details;
  };

  const renderClaim = (claim) => {
    const statement = text(claim.statement);
    if (!statement) return null;

    const item = append(el('li', 'ev-item ev-claim'),
      el('p', 'ev-statement', statement)
    );

    const support = el('ul', 'ev-support');
    const addSupport = (kind, label) => {
      const row = el('li');
      row.appendChild(el('span', 'ev-kind', kind));
      row.appendChild(document.createTextNode(label));
      support.appendChild(row);
    };
    list(claim.referenceSlugs).forEach(slug => {
      const reference = referenceBySlug.get(slug);
      if (reference) addSupport('Source', text(reference.title) || slug);
    });
    list(claim.articleSlugs).forEach(slug => {
      const article = articleBySlug.get(slug);
      if (article) addSupport('Note', text(article.title) || slug);
    });
    if (support.childElementCount) item.appendChild(support);

    return append(item, linkRow([['Methodology', claim.url]]));
  };

  /* ---------- assembly ---------- */

  const fill = (id, records, render) => {
    const section = document.getElementById(id);
    if (!section) return 0;
    const target = section.querySelector('[data-ev-list]');
    if (!target) return 0;

    const fragment = document.createDocumentFragment();
    records.forEach(record => {
      if (!record || typeof record !== 'object') return;
      // A record missing what it needs is skipped; the rest of the collection
      // still renders.
      const node = render(record);
      if (node) fragment.appendChild(node);
    });

    // Counted before appending: a DocumentFragment is emptied into its new
    // parent, so asking it afterwards always answers zero.
    const count = fragment.childElementCount;
    if (!count) return 0;
    target.appendChild(fragment);
    section.hidden = false;
    return count;
  };

  /**
   * Merge library answers into the hand-written accordion.
   *
   * A record whose slug matches a `data-faq-slug` already in the markup
   * replaces that entry where it stands; anything else is appended. Matching on
   * the slug rather than on the question text is the whole point: their copy is
   * being reworded during a redesign, and a match that depends on wording would
   * quietly start showing both versions of the same question.
   *
   * This never empties the container, so their entries stand whatever the data
   * file does — the same rule the rest of this file follows.
   */
  const mergeFaq = (records) => {
    const list = document.getElementById('faq-list');
    if (!list) return { added: 0, superseded: 0 };

    let added = 0;
    let superseded = 0;

    records.forEach(record => {
      if (!record || typeof record !== 'object') return;
      const entry = faqEntry(record);
      if (!entry) return;

      const slug = entry.getAttribute('data-faq-slug');
      const existing = Array.prototype.find.call(
        list.querySelectorAll('[data-faq-slug]'),
        node => node.getAttribute('data-faq-slug') === slug
      );

      if (existing) {
        // Replaced in place, so their ordering survives and the reader does not
        // watch an answer jump to the bottom of the list. An entry they left
        // open stays open.
        if (existing.hasAttribute('open')) entry.setAttribute('open', '');
        existing.replaceWith(entry);
        superseded += 1;
      } else {
        list.appendChild(entry);
        added += 1;
      }
    });

    return { added, superseded };
  };

  // The FAQ is deliberately outside the count below. That count decides whether
  // the research sections have anything to show, and the FAQ section is never
  // empty because their hand-written entries are always in the markup.
  const faqMerged = mergeFaq(faq);

  const counts = {
    claims:     fill('ev-claims', claims, renderClaim),
    references: fill('ev-references', references, renderReference),
    articles:   fill('ev-articles', articles, renderArticle)
  };

  const rendered = Object.values(counts).reduce((total, n) => total + n, 0);
  const checked = readableDate(data.generatedAt);

  // Provenance for the section as a whole rather than a badge on individual
  // answers: which entry came from where is not the reader's problem.
  if ((faqMerged.added || faqMerged.superseded) && checked) {
    const note = document.getElementById('faq-note');
    if (note) {
      note.textContent = `Answers last checked ${checked}.`;
      note.hidden = false;
    }
  }

  if (rendered === 0) {
    // Nothing to show. Leave the hand-written status panel exactly as it is,
    // and add only the date, which turns "empty" into "checked, and empty" —
    // the difference between a page that is waiting and a page that is broken.
    const stamp = document.getElementById('ev-stamp');
    if (stamp && checked) {
      stamp.textContent = `Library last checked ${checked}. No sources or notes published yet.`;
      stamp.hidden = false;
    }
    return;
  }

  const status = document.getElementById('ev-status');
  if (status) status.hidden = true;

  const summary = document.getElementById('ev-summary');
  if (summary) {
    const described = [
      counts.claims     ? `${counts.claims} claim${counts.claims === 1 ? '' : 's'}` : null,
      counts.references ? `${counts.references} source${counts.references === 1 ? '' : 's'}` : null,
      counts.articles   ? `${counts.articles} note${counts.articles === 1 ? '' : 's'}` : null
    ].filter(Boolean).join(' · ');
    summary.textContent = checked ? `${described} · updated ${checked}` : described;
    summary.hidden = false;
  }
})();

/* ============================================================
   FAQ permalinks.

   A second, independent block on purpose. The renderer above returns early
   whenever the data file is missing, empty or unreadable, and a broken data
   file must not cost the hand-written entries their links. It runs after that
   renderer, so library-supplied entries are already in the list and are
   linkable on exactly the same terms.
   ============================================================ */
(() => {
  const list = document.getElementById('faq-list');
  if (!list) return;

  /**
   * The slug is the single source of truth and the id is derived from it, so
   * the id written into the markup — which exists so a link still scrolls
   * before this script runs — cannot drift away from the attribute the
   * supersede matching uses.
   */
  const addLinks = () => {
    list.querySelectorAll('details[data-faq-slug]').forEach(entry => {
      const slug = entry.getAttribute('data-faq-slug');
      if (!slug) return;
      entry.id = `faq-${slug}`;

      const summary = entry.querySelector('summary');
      if (!summary || summary.querySelector('.faq-link')) return;

      const link = document.createElement('a');
      link.className = 'faq-link';
      link.href = `#faq-${slug}`;
      link.textContent = '#';
      link.title = 'Link to this question';
      // The visible text is a bare '#', which tells a screen reader nothing.
      link.setAttribute('aria-label', `Link to this question: ${summary.textContent.trim()}`);

      // Inside a <summary>, one click would both follow the link and toggle the
      // entry, so the answer would collapse at the moment someone copied its
      // address. The hash change below is what opens it instead.
      link.addEventListener('click', event => event.stopPropagation());

      summary.appendChild(link);
    });
  };

  const targetOfHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return null;
    const target = document.getElementById(id);
    if (!target || target.tagName !== 'DETAILS' || !list.contains(target)) return null;
    return target;
  };

  const place = (target) => {
    const root = document.scrollingElement || document.documentElement;
    const previous = root.style.scrollBehavior;
    // The site scrolls smoothly, which here is actively harmful: the browser
    // begins an animation aimed at where the entry sat while it was still
    // collapsed, and that animation lands after this correction and undoes it.
    // Placing instantly is what makes the final position predictable.
    root.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'start' });
    root.style.scrollBehavior = previous;
  };

  // Correcting the scroll position under someone who has started reading is
  // worse than landing a little low, so any deliberate input stops it.
  let readerHasMoved = false;
  ['wheel', 'touchstart', 'keydown'].forEach(type =>
    window.addEventListener(type, () => { readerHasMoved = true; }, { passive: true })
  );

  /**
   * A deep link to a <details> lands on a collapsed element: a heading with
   * nothing under it, which reads as a broken link rather than as an answer.
   */
  const openFromHash = () => {
    const target = targetOfHash();
    if (!target) return;

    target.open = true;
    readerHasMoved = false;

    // Web fonts, images and the browser's own scroll all settle at different
    // moments, and whichever moves last decides where the reader ends up. So
    // the position is reasserted a few times across a short window after the
    // navigation rather than once, optimistically.
    const reassert = () => { if (!readerHasMoved) place(target); };

    requestAnimationFrame(() => requestAnimationFrame(reassert));
    setTimeout(reassert, 120);
    setTimeout(reassert, 400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reassert);
  };

  addLinks();
  openFromHash();

  // Following a second link while already on the page fires no page load, so
  // without this the URL would change and nothing else would.
  window.addEventListener('hashchange', openFromHash);
})();
