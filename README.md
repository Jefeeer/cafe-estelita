# Casa Estelita Garden Cafe — website

Next.js 16 + Tailwind CSS 4. One page, fully static.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # opening-hours logic
npm run build    # production build
```

## Where to edit

| What | File |
|---|---|
| Menu, prices, gallery photos, reviews, hours, phone, links | `lib/content.ts` |
| Page text and sections | `app/page.tsx` |
| Colors (from the logo) and fonts | `app/globals.css` (`@theme`) and `app/layout.tsx` |
| Logo files | `public/brand/` |

Real photos: put them in `public/photos/` and use paths like `'/photos/latte.jpg'` in `lib/content.ts`.

`legacy/index.html` is the earlier single-file version, kept for reference.
