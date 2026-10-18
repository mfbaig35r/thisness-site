# thisness-site

The site for [Thisness](https://github.com/mfbaig35r/thisness): a landing page, the docs, and a read-only explorer over real resolved data. Static Next.js, built ahead of time and served as files.

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # static site in out/, with the search index
npm start         # serve out/
```

## Where things come from

- **Guides** (`content/docs/*.md`) are written for the site. They may carry HTML for diagrams.
- **Design documents, vision and changelog** are not copied: `scripts/sync-upstream.mjs` pulls them from the thisness repo at the release the site documents (`THISNESS_REF`, default `v0.3.1`) before every dev and build. Set `THISNESS_REPO=../thisness` to read a local checkout instead. Mentions such as "design 05" become links.
- **The explorer's data** (`data/explorer.json`) is exported from a resolved store of the UK benchmark (design 07) with the review assistant's suggestions:

  ```bash
  uv run --project ../thisness python scripts/export_explorer.py STORE data/explorer.json
  ```

  The reviews and entities it exports are listed at the top of the script.
- **Search** is [Pagefind](https://pagefind.app), built over `out/` after `next build`. It covers the docs (pages marked `data-pagefind-body`).

## Design

The look follows [Twenty](https://twenty.com): its design tokens (`styles/twenty-theme.css`, MIT, the same file the Workbench uses), Aleo for display type, Inter for text, Azeret Mono for labels and DM Mono for code. `styles/workbench.css` is the Workbench's own stylesheet scoped to `.wb`, so the explorer looks exactly like it; regenerate it when the Workbench's styles change. Light and dark follow the system.

Avoid naming a class after a Tailwind utility (`fixed`, `hidden`, `block`, ...): Tailwind generates the utility for it.

## Deploy

Vercel, as a static export (`vercel.json` sets clean URLs and headers). The build fetches the upstream documents from GitHub.
