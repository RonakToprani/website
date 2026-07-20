# ronak.to — personal portfolio

A Notion-inspired personal site for Ronak Toprani: builds, research, notes, and
astrophotography, plus an interactive idea graph and a ⌘K command palette.

Live at **[ronak.to](https://ronak.to)**.

## Sections

- **Projects + Research** — local-first tools and on-device AI (Fixate, whoomp, kōdō,
  CryptoRadar, Mochi), quant/finance dashboards, and physics/astronomy research, with a
  category filter and detail modals.
- **Notes** — short writing and an astrophotography gallery.
- **Idea Graph** — a map linking projects, papers, and concepts.
- **Contact** — email and socials.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Framer Motion (transitions)
- lucide-react (icons)

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # tsc -b && vite build → dist/
npm run preview  # preview the production build
```

Static assets (images, logo) live in `public/`. The whole app is a single-page
React app in `src/App.tsx`.
