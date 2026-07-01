# Bakarkhaniii Dev Site

## Structure
```
bakarkhaniii/
├── index.html          # Homepage
├── index.css           # Shared design system (all pages link to this)
├── nav.js              # Dropdown nav logic (shared)
├── about.html
├── blog.html
├── products/
│   ├── trackxpense.html
│   └── gupto.html
├── sites/
│   ├── attic.html      → links to attic-5gp.pages.dev
│   └── yard.html       → links to yard-1fa.pages.dev
└── blog/
    └── post-template.html  # Copy this to write new posts
```

## Writing Blog Posts
1. Copy `blog/post-template.html` → `blog/your-post-slug.html`
2. Fill in all `✏️` fields
3. Add a card to `blog.html` (instructions at bottom of template)

## Dev
```bash
python -m http.server 8080
```
Open http://localhost:8080
