# Providhy Documentations

One repo, one GitHub Pages site. Each product section is a subfolder of the repo root, deployed by the Pages workflow on every push to main.

```
/                        <- portal (root index.html)
  esewa-miniapp-docs/    <- eSewa federated-identity miniapps docs (17 pages, live)
```

**Live:** https://providhydev.github.io/Documentations/esewa-miniapp-docs/

## eSewa miniapp section
Source markdown: E:\\Work\\Documentations\\Federated-Miniapps-Docs (16 docs).
Regenerate the site: E:\\Work\\.scratch\\build_site2.mjs (point its output at the esewa-miniapp-docs folder).

## Adding a new section
1. Create a folder (e.g. \`providhy-erp/\`) with self-contained static pages and an \`index.html\`.
2. Add a card for it in the root \`index.html\`.
3. Push to main - the Pages workflow deploys the whole repo automatically.
