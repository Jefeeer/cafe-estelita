import type { Metadata, Viewport } from 'next';
import { Marcellus, Figtree } from 'next/font/google';
import { SITE } from '@/lib/content';
import SmoothScroll from '@/components/SmoothScroll';
import './globals.css';

// Marcellus: Trajan-style capitals that echo the logo lettering. Figtree: warm, friendly body text.
const marcellus = Marcellus({ weight: '400', subsets: ['latin'], variable: '--font-marcellus', display: 'swap' });
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });

const title = 'Casa Estelita Garden Cafe | Garden Coffee Shop in Dasmariñas, Cavite';
const description =
  'Casa Estelita is a hidden garden cafe behind a quiet gray wall in Dasmariñas, Cavite. Specialty coffee, pastries, signature lasagna, indoor and garden seating — perfect for slow afternoons, solo dates and remote work.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: 'en_PH',
    url: '/',
    title: 'Casa Estelita Garden Cafe — Your hidden garden in Dasmariñas',
    description: 'Coffee, comfort food, and slow afternoons among the greens. Behind the gray wall on Summerwind Drive.',
    images: [{ url: '/brand/logo-full.jpg', width: 500, height: 500, alt: 'Casa Estelita Garden Cafe logo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casa Estelita Garden Cafe — Your hidden garden in Dasmariñas',
    description: 'Coffee, comfort food, and slow afternoons among the greens.',
    images: ['/brand/logo-full.jpg'],
  },
};

export const viewport: Viewport = { themeColor: '#1B2F2B', viewportFit: 'cover' };

// Runs before first paint: flags JS and decides whether to play the door intro (once per session).
const bootScript = `(function(){var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');var r=matchMedia('(prefers-reduced-motion: reduce)').matches,s=false;try{s=sessionStorage.getItem('ce-door')==='1'}catch(e){}if(!r&&!s)d.classList.add('door-on')})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`no-js ${marcellus.variable} ${figtree.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="font-sans antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
