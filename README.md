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
