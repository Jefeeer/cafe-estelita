import Image from 'next/image';
import { SITE, ABOUT_PHOTOS, type Day } from '@/lib/content';
import { getSiteData } from '@/lib/site-data';
import { fmtTime } from '@/lib/hours';
import Header, { PinIcon } from '@/components/Header';
import OpenStatus, { HoursProvider, HoursTable, TodayHours } from '@/components/OpenStatus';
import { DoorIntro, Parallax, RevealObserver, CopyButton, ShowAfterHero } from '@/components/Effects';
import MenuSection from '@/components/MenuSection';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';

/* Structured data for Google — opening hours come straight from the admin hours, so they never drift. */
const jsonLd = (week: Day[]) => ({
  '@context': 'https://schema.org',
  '@type': 'CafeOrCoffeeShop',
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/brand/logo-full.jpg`,
  image: SITE.heroImage,
  slogan: SITE.tagline,
  description: 'A hidden garden cafe in Dasmariñas, Cavite with indoor and garden seating, specialty coffee, pastries and comfort food.',
  telephone: SITE.phoneIntl,
  priceRange: SITE.priceRange,
  servesCuisine: ['Coffee', 'Pastries', 'Pasta', 'Filipino'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postal,
    addressCountry: 'PH',
  },
  hasMap: SITE.directions,
  openingHoursSpecification: week
    .filter((d) => d.open && d.close)
    .map((d) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: d.day, opens: d.open, closes: d.close })),
  sameAs: [SITE.instagram, SITE.facebook],
});

const PhoneIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

const Eyebrow = ({ n, children, dark = false }: { n: string; children: React.ReactNode; dark?: boolean }) => (
  <p className={`mb-5 flex items-center gap-3 ${dark ? 'text-moss' : 'text-clay'}`}>
    <span className="display text-2xl leading-none">{n}</span>
    <span className={`h-px w-10 ${dark ? 'bg-moss/60' : 'bg-clay/50'}`} aria-hidden="true" />
    <span className="caps text-[.72rem]">{children}</span>
  </p>
);

const EXPERIENCE = [
  { title: 'Garden & Indoor Seating', text: 'Breezy tables beneath the trees, or a cool indoor nook — pick your corner and stay a while.', tone: 'bg-evergreen text-blush',
    icon: <><path d="M16 29V17" /><path d="M16 17c-2-3-7-3-9 0M16 21c2-3 7-3 9 0" /><circle cx="16" cy="10" r="7" /><path d="M10 29h12" /></> },
  { title: 'Work-Friendly Space', text: 'Roomy tables and a gentle hush for deep work, study sessions, or finally finishing that book.', tone: 'bg-fern text-evergreen-deep',
    icon: <><rect x="6" y="7" width="20" height="14" rx="2" /><path d="M3 25h26" /><path d="M13 14l2 2 4-4" /></> },
  { title: 'Relaxing Music & Ambience', text: 'Calm playlists, rustling leaves and soft light — the kind of quiet that makes time slow down.', tone: 'bg-clay text-white',
    icon: <><path d="M12 24V7l14-3v17" /><circle cx="8.5" cy="24" r="3.5" /><circle cx="22.5" cy="21" r="3.5" /></> },
  { title: 'Homey Service', text: 'Warm, welcoming staff who remember your order and make you feel right at home.', tone: 'bg-ink text-blush',
    icon: <><path d="M4 15 16 5l12 10" /><path d="M7 13v14h18V13" /><path d="M16 23s-4-2.4-4-5a2 2 0 0 1 4-.8 2 2 0 0 1 4 .8c0 2.6-4 5-4 5z" /></> },
];

const FIREFLIES = [
  [12, 62, 16, 0.2], [24, 38, 12, 1.4], [41, 70, 18, 2.1], [58, 30, 14, 0.8],
  [72, 58, 17, 3], [86, 40, 13, 1.9], [66, 80, 15, 4], [6, 28, 19, 2.6],
];

export default async function Home() {
  const { menu, deals, gallery, galleryCats, week } = await getSiteData();
  const opens = week.find((d) => d.open)?.open;
  return (
    <HoursProvider week={week}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(week)).replace(/</g, '\\u003c') }} />
      <a href="#main" className="skip-link rounded-full bg-ink px-5 py-3 font-medium text-blush shadow-soft">Skip to content</a>
      <DoorIntro />
      <Header />

      <main id="main" tabIndex={-1}>
        {/* ============================== HERO ============================== */}
        <section id="top" className="on-dark relative isolate flex hero-h items-end overflow-hidden bg-evergreen-night text-blush" aria-labelledby="heroTitle">
          <Parallax>
            <Image src={SITE.heroImage} alt="Lush tropical leaves and hanging greenery filtering soft afternoon light, like the garden hidden behind Casa Estelita's walls"
              fill priority sizes="100vw" className="object-cover" />
          </Parallax>
          <div className="hero-overlay absolute inset-0" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {FIREFLIES.map(([l, t, d, delay], i) => (
              <span key={i} className="firefly" style={{ left: `${l}%`, top: `${t}%`, ['--d' as string]: `${d}s`, ['--delay' as string]: `${delay}s` }} />
            ))}
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-24 sm:px-6 sm:pb-40 sm:pt-28 lg:px-8">
            <div className="hero-copy max-w-4xl">
              <p className="caps mb-4 text-xs text-mint sm:text-sm">{SITE.tagline}</p>
              <OpenStatus className="mb-6 inline-flex items-center gap-2 rounded-full border border-blush/30 bg-evergreen-night/50 px-4 py-1.5 text-sm backdrop-blur" />
              <h1 id="heroTitle" className="display text-[clamp(2.2rem,min(9.6vw,8.6svh),5rem)]">
                Your <span className="text-mint">hidden garden</span> in the heart of Dasmariñas.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-blush/90 sm:text-xl">Coffee, comfort food, and slow afternoons among the greens.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#menu" className="inline-flex items-center gap-2 rounded-full bg-blush px-7 py-3.5 font-semibold text-evergreen shadow-soft transition hover:-translate-y-0.5 hover:bg-white">
                  View Menu
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
                <a href="#visit" className="inline-flex items-center gap-2 rounded-full border border-blush/60 px-7 py-3.5 font-semibold text-blush transition hover:-translate-y-0.5 hover:bg-blush/10">Visit Us</a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== AT A GLANCE — the 4 things visitors look for first ============================== */}
        <div className="hero-strip relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 overflow-hidden rounded-[1.75rem] bg-ivory shadow-lift ring-1 ring-evergreen/5 lg:grid-cols-4">
            {[
              { k: 'Today', v: <TodayHours />, href: '#visit' },
              { k: 'Find us', v: 'Summerwind Dr, Burol Main', href: SITE.directions, ext: true },
              { k: 'Per person', v: SITE.priceRange, href: '#menu' },
              { k: 'Call', v: SITE.phone, href: SITE.phoneHref },
            ].map((c, i) => (
              <div key={c.k} className={`group relative p-5 sm:p-7 ${i % 2 ? 'border-l' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''} border-evergreen/10`}>
                <dt className="caps text-[.68rem] text-clay">{c.k}</dt>
                <dd className="display mt-2 text-lg leading-snug text-evergreen sm:text-xl">
                  <a href={c.href} {...(c.ext ? { target: '_blank', rel: 'noopener' } : {})} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-clay/50 group-hover:underline-offset-4">
                    {c.v}{c.ext && <span className="sr-only"> (opens Google Maps)</span>}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ============================== ABOUT ============================== */}
        <section id="about" className="speckled relative overflow-hidden py-24 sm:py-32" aria-labelledby="aboutTitle">
          <svg className="vine reveal pointer-events-none absolute -left-10 top-10 hidden h-[520px] w-48 text-fern lg:block" viewBox="0 0 120 520" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path pathLength={1} d="M60 0C20 80 100 140 60 220S20 360 70 440 60 520 60 520" />
            <path pathLength={1} d="M58 90c-24-6-40-26-40-46 22 4 38 22 40 46zM70 180c22-14 46-12 56 2-18 12-38 10-56-2zM50 300c-22-8-36-28-34-48 22 6 34 24 34 48zM72 400c20-16 44-16 56-2-16 14-38 14-56 2z" />
          </svg>

          <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
            <div className="reveal">
              <Eyebrow n="01">Our story</Eyebrow>
              <h2 id="aboutTitle" className="display text-[clamp(2.2rem,5.5vw,3.8rem)] text-evergreen">Behind the gray wall, <span className="text-clay">a garden</span> was waiting.</h2>
              {/* EDIT: your story */}
              <div className="mt-8 space-y-5 text-[1.075rem] leading-relaxed text-ink/85">
                <p>From the street, you could walk right past us — a plain gray facade on busy Summerwind Drive, with only a round hanging sign to give us away. That&apos;s exactly how we like it.</p>
                <p>Step through the door and the traffic fades into birdsong and soft music. Leaves spill over the walls, light filters through the greens, and there&apos;s always a quiet corner with your name on it — indoors where it&apos;s cool, or out in the garden where the afternoon slows right down.</p>
                <p>Our tree has deep roots and open branches, and that&apos;s the whole idea: good coffee, honest comfort food, and staff who greet you like family. <span className="display text-evergreen">Relax, chill, unwind.</span></p>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-evergreen/15 pt-8">
                {[['Seating', 'Garden & indoor'], ['Per person', SITE.priceRange], ['Doors open', opens ? fmtTime(opens) : '—']].map(([k, v]) => (
                  <div key={k}><dt className="caps text-[.65rem] text-ink/75">{k}</dt><dd className="display mt-1.5 text-lg text-evergreen sm:text-xl">{v}</dd></div>
                ))}
              </dl>
            </div>

            {/* Layered photo collage */}
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
              <div className="reveal absolute left-0 top-0 h-[78%] w-[66%] overflow-hidden rounded-arch shadow-lift" style={{ ['--rd' as string]: '.1s' }}>
                <Image src={ABOUT_PHOTOS.main.src} alt={ABOUT_PHOTOS.main.alt} fill sizes="(min-width:1024px) 340px, 62vw" className="object-cover" />
              </div>
              <div className="reveal absolute bottom-0 right-0 h-[58%] w-[56%] overflow-hidden rounded-[1.75rem] border-[6px] border-blush shadow-lift" style={{ ['--rd' as string]: '.25s' }}>
                <Image src={ABOUT_PHOTOS.side.src} alt={ABOUT_PHOTOS.side.alt} fill sizes="(min-width:1024px) 300px, 52vw" className="object-cover" />
              </div>
              {/* the hanging sign, as seen from the street */}
              <div className="reveal sway absolute right-[8%] top-0 flex flex-col items-center" style={{ ['--rd' as string]: '.4s', animationDuration: '6s' }} aria-hidden="true">
                <span className="h-8 w-px bg-ink/60" />
                <span className="rounded-full bg-ivory p-1.5 shadow-lift">
                  <Image src="/brand/logo-mark.png" alt="" width={120} height={120} className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
                </span>
              </div>
              <div className="reveal absolute -bottom-6 left-[4%] w-[44%] -rotate-[4deg] rounded-2xl bg-white p-2 pb-9 shadow-lift" style={{ ['--rd' as string]: '.55s' }}>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <Image src={ABOUT_PHOTOS.polaroid.src} alt={ABOUT_PHOTOS.polaroid.alt} fill sizes="230px" className="object-cover" />
                </div>
                <p className="absolute inset-x-0 bottom-2.5 text-center text-sm italic text-ink/75">afternoon, 3:15 pm</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== EXPERIENCE ============================== */}
        <section id="experience" className="relative bg-blush-deep py-24 sm:py-32" aria-labelledby="expTitle">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal max-w-2xl">
              <Eyebrow n="02">The experience</Eyebrow>
              <h2 id="expTitle" className="display text-[clamp(2.1rem,5vw,3.4rem)] text-evergreen">A little escape from the city, <span className="text-clay">any afternoon</span>.</h2>
            </div>
            <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCE.map((x, i) => (
                <li key={x.title} className="reveal border-t border-evergreen/25 pt-8" style={{ ['--rd' as string]: `${i * 0.1}s` }}>
                  <span className={`mb-6 grid h-16 w-16 place-items-center rounded-arch ${x.tone}`}>
                    <svg className={`h-8 w-8 ${i === 0 ? 'sway' : ''}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{x.icon}</svg>
                  </span>
                  <h3 className="display text-2xl text-evergreen">{x.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink/80">{x.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============================== MENU ============================== */}
        <section id="menu" className="speckled relative py-24 sm:py-32" aria-labelledby="menuTitle">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <Eyebrow n="03">From the counter</Eyebrow>
                <h2 id="menuTitle" className="display text-[clamp(2.2rem,5.5vw,3.8rem)] text-evergreen">Made slowly, <span className="text-clay">served warmly</span>.</h2>
              </div>
              <p className="max-w-sm text-ink/80">A taste of what&apos;s on the counter. Ask our staff about today&apos;s pastries and seasonal drinks.</p>
            </div>
            <MenuSection menu={menu} deals={deals} />
            <p className="mt-10 text-center text-sm text-ink/75">Prices in Philippine pesos and subject to change.</p>
          </div>
        </section>

        {/* ============================== GALLERY ============================== */}
        <section id="gallery" className="relative bg-blush-deep py-24 sm:py-32" aria-labelledby="galTitle">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="reveal mb-8 max-w-2xl">
              <Eyebrow n="04">The gallery</Eyebrow>
              <h2 id="galTitle" className="display text-[clamp(2.2rem,5.5vw,3.8rem)] text-evergreen">Moments <span className="text-clay">among the greens</span>.</h2>
            </div>
            <Gallery photos={gallery} cats={galleryCats} />
          </div>
        </section>

        {/* ============================== TESTIMONIALS ============================== */}
        <section id="reviews" className="speckled relative overflow-hidden py-24 sm:py-32" aria-labelledby="revTitle">
          <Image src="/brand/logo-mark.png" alt="" width={520} height={520} className="spin-slow pointer-events-none absolute -right-40 top-10 h-[26rem] w-[26rem] opacity-[.06]" />
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="reveal flex justify-center"><Eyebrow n="05">Kind words</Eyebrow></div>
            <h2 id="revTitle" className="reveal display text-[clamp(2rem,5vw,3.2rem)] text-evergreen">What our guests <span className="text-clay">say</span></h2>
            <Testimonials />
          </div>
        </section>

        {/* ============================== VISIT ============================== */}
        <section id="visit" className="on-dark relative overflow-hidden bg-evergreen py-24 text-blush sm:py-32" aria-labelledby="visitTitle">
          <svg className="vine reveal pointer-events-none absolute right-0 top-0 h-full w-64 text-moss/30" viewBox="0 0 200 800" fill="none" stroke="currentColor" strokeWidth="1.5" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
            <path pathLength={1} d="M180 0C90 120 200 240 120 380S60 600 160 800" />
            <path pathLength={1} d="M140 120c-30 0-52-20-56-48 30 2 50 22 56 48zM150 260c20-24 50-30 66-18-16 22-42 28-66 18zM110 420c-30-6-48-30-46-58 28 8 44 30 46 58zM130 600c22-22 54-24 68-10-18 20-46 22-68 10z" />
          </svg>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-8">
            <div className="reveal">
              <Eyebrow n="06" dark>Finding us</Eyebrow>
              <h2 id="visitTitle" className="display text-[clamp(2.2rem,5.5vw,3.8rem)]">Find the <span className="text-mint">gray wall</span>. Open the door.</h2>
              <OpenStatus className="mt-6 inline-flex items-center gap-2 rounded-full bg-evergreen-night/60 px-4 py-2 text-sm" />

              <dl className="mt-10 space-y-7">
                <div className="flex gap-4">
                  <dt className="mt-1 flex-none text-moss"><span className="sr-only">Address</span><PinIcon className="h-5 w-5" /></dt>
                  <dd>
                    <address className="text-lg not-italic leading-snug">{SITE.address.line1},<br />{SITE.address.line2}</address>
                    <p className="mt-1 text-sm text-blush/80">Plus code: <span className="font-semibold text-blush">8XG2+CP</span> Dasmariñas, Cavite<CopyButton text={SITE.plusCode} /></p>
                  </dd>
                </div>
                <div className="flex gap-4">
                  <dt className="mt-1 flex-none text-moss"><span className="sr-only">Phone</span><PhoneIcon /></dt>
                  <dd><a href={SITE.phoneHref} className="text-lg underline decoration-moss/60 underline-offset-4 hover:decoration-blush">{SITE.phone}</a></dd>
                </div>
                <div className="flex gap-4">
                  <dt className="mt-1 flex-none text-moss"><span className="sr-only">Opening hours</span>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></dt>
                  {/* edited in /admin → Opening hours */}
                  <dd className="w-full max-w-sm"><HoursTable /></dd>
                </div>
                <div className="flex gap-4">
                  <dt className="mt-1 flex-none text-moss"><span className="sr-only">Price range and services</span>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg></dt>
                  <dd>
                    <p className="text-lg">{SITE.priceRange} per person</p>
                    <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                      {SITE.services.map((s) => <li key={s} className="rounded-full border border-moss/60 px-3 py-1">{s}</li>)}
                    </ul>
                  </dd>
                </div>
              </dl>

              <aside className="mt-10 flex items-center gap-5 rounded-[1.5rem] border border-blush/15 bg-evergreen-night/50 p-5" aria-label="Finding us tip">
                <div className="sway flex flex-none flex-col items-center" aria-hidden="true">
                  <span className="h-4 w-px bg-blush/60" />
                  <Image src="/brand/logo-mark.png" alt="" width={64} height={64} className="h-14 w-14 rounded-full ring-2 ring-ivory" />
                </div>
                <p className="leading-snug"><span className="caps text-[.68rem] text-moss">Tip</span><br />
                  <span className="display text-lg">Look for our hanging logo on the gray wall — the garden is waiting inside.</span></p>
              </aside>
            </div>

            <div className="reveal flex flex-col gap-4" style={{ ['--rd' as string]: '.15s' }}>
              <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-[2rem] border-4 border-blush/10 bg-evergreen-night shadow-lift lg:min-h-[560px]">
                <iframe title="Map showing Casa Estelita Garden Cafe in Dasmariñas, Cavite" src={SITE.mapEmbed}
                  className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <a href={SITE.directions} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 rounded-full bg-clay px-6 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#86402C]">
                  <PinIcon /> Get Directions<span className="sr-only"> (opens Google Maps)</span>
                </a>
                <a href={SITE.phoneHref} className="flex items-center justify-center gap-2 rounded-full border border-blush/40 px-6 py-4 font-semibold transition hover:bg-blush/10"><PhoneIcon className="h-4 w-4" /> Call us</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer className="on-dark bg-evergreen-night pb-28 pt-16 text-blush md:pb-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <a href="#top" className="flex items-center gap-4" aria-label="Casa Estelita — back to top">
              <Image src="/brand/logo-mark.png" alt="" width={72} height={72} className="h-16 w-16 rounded-full ring-2 ring-ivory/80" />
              <span><span className="caps block text-xl" style={{ letterSpacing: '.22em' }}>Casa Estelita</span>
                <span className="caps mt-1 block text-[.65rem] text-moss">Garden Cafe · {SITE.tagline}</span></span>
            </a>
            <p className="mt-5 max-w-xs text-blush/80">A hidden garden cafe in Dasmariñas. Coffee, comfort food &amp; slow afternoons.</p>
          </div>
          <div className="flex flex-col gap-6 md:items-end">
            <ul className="flex gap-3" aria-label="Social media">
              <li>
                <a href={SITE.instagram} target="_blank" rel="noopener" aria-label="Instagram (opens in new tab)" className="grid h-12 w-12 place-items-center rounded-full border border-blush/25 transition hover:-translate-y-0.5 hover:bg-blush hover:text-evergreen">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
                </a>
              </li>
              <li>
                <a href={SITE.facebook} target="_blank" rel="noopener" aria-label="Facebook (opens in new tab)" className="grid h-12 w-12 place-items-center rounded-full border border-blush/25 transition hover:-translate-y-0.5 hover:bg-blush hover:text-evergreen">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z" /></svg>
                </a>
              </li>
            </ul>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-blush/80">
                {['About', 'Menu', 'Gallery', 'Visit'].map((l) => <li key={l}><a className="hover:text-blush" href={`#${l.toLowerCase()}`}>{l}</a></li>)}
              </ul>
            </nav>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-blush/10 px-4 pt-6 text-sm text-blush/70 sm:px-6 lg:px-8">
          © Casa Estelita Garden Cafe · Dasmariñas, Cavite. All rights reserved.
        </div>
      </footer>

      {/* ============================== MOBILE FLOATING ACTIONS ============================== */}
      <ShowAfterHero className="fixed inset-x-3 bottom-3 z-30 flex gap-2 md:hidden">
        <a href={SITE.facebook} target="_blank" rel="noopener" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-evergreen px-4 py-3.5 text-sm font-semibold text-blush shadow-lift ring-1 ring-blush/10">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.4-2.6-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7z" /></svg>
          Message us<span className="sr-only"> on Facebook (opens in new tab)</span>
        </a>
        <a href={SITE.phoneHref} className="flex items-center justify-center gap-2 rounded-full bg-clay px-5 py-3.5 text-sm font-semibold text-white shadow-lift">
          <PhoneIcon /> Call
        </a>
      </ShowAfterHero>

      <RevealObserver />
    </HoursProvider>
  );
}
