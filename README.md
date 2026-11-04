# Providhy Documentation

One repo, one GitHub Pages site, one folder per product section:

```
/                     <- portal (root index.html)
  miniapp-esewa-docs/ <- eSewa federated-identity miniapps docs (16 docs, live)
  Providhy-erp/       <- Providhy ERP docs (placeholder)
  oms/                <- OMS docs (placeholder)
  .github/workflows/pages.yml  <- deploys the repo root to Pages
```

**Live:** https://providhydev.github.io/miniapp-esewa-docs/

## eSewa Miniapps section
Source markdown: E:\\Work\\Documentations\\Federated-Miniapps-Docs (16 docs).
Regenerate the site: E:\\Work\\.scratch\\build_site2.mjs (output folder = miniapp-esewa-docs/).

## Adding a new product section
1. Create a folder, e.g. \`crm/\`, with its own \`index.html\` (self-contained static pages work best).
2. Add a card for it in the root \`index.html\`.
3. Push to main - the Pages workflow deploys the whole repo automatically.
