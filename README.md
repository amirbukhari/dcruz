# D'Cruz Guitars

A static marketing site for D'Cruz Guitars — custom electric guitars and partscasters, hand-wired and set up by hand in Belleville, Ontario.

Plain HTML/CSS/JS with no build step. Dark editorial design (Fraunces + Inter, wood-and-brass palette) generated with the [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design skill (installed at `.claude/skills/ui-ux-pro-max`).

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Hosting on GitHub Pages

A deploy workflow is included at `.github/workflows/deploy-pages.yml`. It runs automatically on every push to the default branch (and to `main`), so no merge or PR is required:

1. On first run, go to **Settings → Pages** and set **Source** to **GitHub Actions** if it isn't already. The workflow can also be triggered manually from the Actions tab via "Run workflow".
2. If a run fails with a Pages permissions error, enable Pages under **Settings → Pages** and re-run the workflow.

The site will be live at `https://<owner>.github.io/dcruz/`.

## Structure

| File | Purpose |
|---|---|
| `index.html` | Single-page site: hero, catalogue, the build process, about, enquiry/commission CTA |
| `styles.css` | Design system tokens + all styling (responsive, dark, reduced-motion aware) |
| `script.js` | Sticky header, mobile nav, scroll-reveal, finish switcher, catalogue filter, quick-view lightbox, enquiry form |
| `.claude/skills/ui-ux-pro-max` | Installed UI/UX design skill used to generate the design system |

## URL contracts

| Pattern | Behaviour |
|---|---|
| `?filter=partscaster` \| `custom` \| `vintage` | Restores that catalogue filter on load and scrolls to the catalogue; the filter also syncs back into the URL as you browse |
| `#g-001`, `#g-squier`, `#g-blackgold`, `#g-yellow`, `#g-003`, `#g-supro`, `#g-004` | Jumps to (and pulses) that guitar's card; links copied while the quick-view is open reopen the quick-view |

## Production headers (when moving off GitHub Pages)

GitHub Pages can't set response headers, so today's CSP ships as a `<meta>` tag
(which can't express every directive). On a host with header control, move it to
a real `Content-Security-Policy` header and add what meta can't do:
`frame-ancestors 'none'`, plus `Strict-Transport-Security`,
`X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
Fonts are self-hosted, so no third-party origins are needed at all.

## Content & asset attribution

All product photography, the D'Cruz signature logo, and brand content belong to
D'Cruz Guitars (Belleville, Ontario) and appear here on their behalf — they are
not covered by any open-source license. Partner brand logos (Seymour Duncan,
D'Addario, Floyd Rose, DiMarzio, Rotosound, Ernie Ball) are the property of
their respective owners and are shown only to indicate parts used in builds.
