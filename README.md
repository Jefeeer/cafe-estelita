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

## Admin dashboard (`/admin`)

Staff edit Deals & Bundles, Menu, Gallery and Opening Hours at `/admin`. Data lives in Supabase
(`supabase/schema.sql`); `lib/content.ts` is only the fallback if the database is unreachable.

- Env vars (local `.env.local` and Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Add a staff login: Supabase → Authentication → Add user (tick "Auto confirm"), then in the SQL editor:
  `insert into public.admins select id from auth.users where email = 'staff@example.com';`
- Change a password: Supabase → Authentication → Users → the user → Reset / update password.
