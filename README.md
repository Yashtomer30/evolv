# Evolv Labs — evolvlabs.co

Marketing site for **Evolv Labs** — content systems for founders and coaches.
Two pages (home and contact), served as plain static files. No build step, no
dependencies to install, no framework to run.

Originally produced in Framer and exported to static HTML/CSS/JS. The export has
since been restructured, de-branded and hardened for self-hosting; see
[What was changed](#what-was-changed-from-the-raw-export).

---

## Running it locally

There is nothing to compile. Serve the repository root over HTTP:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

Any static server works (`npx serve`, `php -S localhost:8000`, Live Server, …).

> **Open it through a server, not by double-clicking `index.html`.**
> The page loads ES modules, which browsers refuse to load over `file://`.
> Opening the file directly renders a blank page.

---

## Project layout

```
.
├── index.html              Home
├── contact/index.html      Contact + booking
├── 404.html                Not-found page
├── robots.txt              Crawler rules
├── sitemap.xml             Search-engine sitemap
├── .nojekyll               Tells GitHub Pages to serve files verbatim
└── assets/
    ├── site-fixes.css      Hand-written overrides (see below)
    ├── site-fixes.js       Hand-written runtime fixes (see below)
    ├── images/             Photography, logos, UI mockups
    ├── media/              Self-hosted web fonts (.woff2) + two images
    ├── gfonts/             Mirrored Google Fonts files
    ├── sites/<build-id>/   Framer's generated JS bundles
    ├── modules/            Framer code-component module
    ├── third-party/        Fontshare font manifest
    └── vendor/             Framer page-analytics script
```

Everything under `assets/` except `site-fixes.*` is **generated output** from the
Framer export. Treat it as build artefacts: readable, but not meant to be
hand-edited. Behavioural changes belong in `site-fixes.css` / `site-fixes.js`,
which load last and therefore win.

### `assets/site-fixes.css` / `assets/site-fixes.js`

The only hand-written code in the repo. Both files are commented section by
section explaining *why* each rule exists. Between them they:

- remove the Framer template's demo chrome (a floating "Get this template"
  badge) and two social icons for accounts that don't exist
- rebuild the contact hero into a balanced two-column layout — the template
  shipped it as a single 238px column, leaving ~900px of dead space
- stop the Cal.com booking widget from trapping touch scrolling
- keep the per-page `<title>`, which the export's runtime otherwise overwrites
- reveal hero copy that the export can leave stranded at `opacity: 0`
- mobile hygiene: `100dvh` instead of `100vh`, 44px tap targets, no horizontal
  overflow, no iOS text inflation

They are applied in CSS/JS rather than by editing the markup because the page
re-renders itself on load — edits to the HTML alone get overwritten.

---

## Deployment

The site is a static bundle: upload the repository root to any host.

> **Deploy at a domain root** (`https://evolvlabs.co/`), not in a subdirectory.
> The export resolves its images and fonts from root-absolute paths such as
> `/assets/images/…`. Serving it from `example.com/evolvlabs/` would 404 those
> assets. A custom domain, or a `username.github.io` user site, is fine; a
> GitHub Pages **project** site is not, unless the paths are rewritten.

### GitHub Pages

1. **Settings → Pages → Source:** deploy from branch `main`, folder `/ (root)`.
2. **Settings → Pages → Custom domain:** enter `evolvlabs.co`. This creates a
   `CNAME` file in the repo.
3. Point DNS at GitHub:
   - `A` records for the apex → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `arnavsachdeva.github.io`
4. Tick **Enforce HTTPS** once the certificate is issued.

`.nojekyll` is already present, so Pages serves every file as-is.

### Vercel

The live deployment is **https://evolvlabs.vercel.app**, built from this repo.
There is no build step: framework preset *Other*, build command empty, output
directory `.`. Pushing to `main` redeploys.

> **Commit emails must resolve to a GitHub account.** Vercel refuses to build a
> commit whose author email it cannot match to a GitHub user, with
> *"Deployment was blocked because the commit email … could not be matched to a
> GitHub account."* If you hit this, check `git config user.email` against the
> address on your GitHub account — the `@users.noreply.github.com` form always
> works:
>
> ```bash
> git config user.email "72006440+arnavsachdeva@users.noreply.github.com"
> ```
>
> The setting only affects commits made after it, so an already-rejected commit
> stays rejected; land a new commit with the corrected identity to redeploy.

Netlify, Cloudflare Pages and S3 + CloudFront work the same way: no build
command, publish directory `.`.

---

## Third-party services

The site is self-contained except for four runtime dependencies. All four are
intentional — note the first two before any privacy or consent review.

| Service | Used for | Where |
|---|---|---|
| Google Analytics (`G-P8H8DQ7GZ3`) | Page analytics | Both pages |
| Meta Pixel (`26982088351442750`) | Ad attribution | Both pages |
| Cal.com (`cal.com/yash-tomer/30min`) | Booking widget | Contact page |
| Google Fonts (`fonts.gstatic.com`) | Some font files | Both pages |

The analytics and pixel IDs were carried over from the existing live site.
**Confirm both are yours before launch** — they send visitor data to whichever
account owns those IDs.

Most fonts are self-hosted in `assets/media/`. Nineteen weights are still
fetched from Google's CDN because the export references them there and no local
copies exist; the site renders correctly either way, but it is not fully
offline-capable.

---

## Known limitations

- **Two pages only.** Navigation links to `/case-study` and `/price` point at
  `https://evolvlabs.co/…`, which are not in this repo. They resolve against the
  live site. Either add those pages or update the links before launch.
- **Cal.com logs three console errors on the contact page.** `embed.js` is
  loaded twice — once by the document, once by the component that mounts the
  widget — and the second load re-registers the same custom elements. The
  booking flow works. This also occurs on the current live site; removing either
  loader was tested and broke the widget differently, so it is left alone.
  `site-fixes.js` absorbs the one user-visible side effect (stalled hero copy).
- **Content edits need the source.** This is a compiled export, so copy and
  layout changes are far easier in the original Framer project than in the
  generated bundles under `assets/sites/`.

---

## Changing things

| Goal | Where |
|---|---|
| Styling, spacing, layout fixes | `assets/site-fixes.css` |
| Runtime behaviour | `assets/site-fixes.js` |
| Titles, meta description, Open Graph | `<head>` of each `index.html` |
| Contact email / phone | `index.html`, `contact/index.html`, and `assets/sites/<id>/*.mjs` |
| Analytics / pixel IDs | `<head>` of each `index.html` |

Contact details and social URLs appear in **both** the HTML and the JS bundles.
Changing only the HTML looks correct until the page hydrates and reverts it —
update both, then hard-reload and confirm.

---

## What was changed from the raw export

- Flattened the mirror's hostname folders (`framerusercontent.com/`,
  `fonts.gstatic.com/`, `events.framer.com/`) into `assets/`, and moved the
  pages to `/` and `/contact/`
- Removed the "Designed by …" template credit and the "Get this template" badge
- Fixed broken contact links — `melto:example@gmail.com` and
  `tel:+1 202-555-0143` (placeholders that silently did nothing) now point at
  the real email and phone number
- Replaced placeholder social links; hid the Facebook and X icons, which had no
  accounts behind them
- Made `og:image` / `twitter:image` absolute so link previews work
- Gave each page a distinct `<title>`
- Dropped the dormant Framer editor bootstrap
- Mobile and layout fixes listed under `site-fixes.*` above
- Added `404.html`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `.gitignore`

Verified with a headless-Chrome pass over both pages at 360/375/390/430px and
1440px: no failed requests, no broken images, no horizontal overflow, no
JavaScript errors on the home page.

---

## License

All rights reserved. The content, branding and imagery are proprietary to
Evolv Labs and are not licensed for reuse.
