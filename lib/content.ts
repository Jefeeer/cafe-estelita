/* =====================================================================
   ✏️  CONTENT — everything you'll want to edit lives in this one file.
   ===================================================================== */

// Small helper for Unsplash placeholders. For your own photos, drop them in
// /public/photos and use a plain path instead, e.g. img: '/photos/spanish-latte.jpg'
const U = (id: string, w = 1200, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`;

export const SITE = {
  name: 'Casa Estelita Garden Cafe',
  tagline: 'Relax ~ Chill ~ Unwind', // straight from the logo
  url: 'https://case-estilita.vercel.app', // swap if you add a custom domain
  phone: '0906 508 1467',
  phoneHref: 'tel:+639065081467',
  phoneIntl: '+63-906-508-1467',
  address: {
    line1: 'Brgy. Burol Main, 501 Summerwind Drive',
    line2: 'Dasmariñas, 4114 Cavite',
    street: '501 Summerwind Drive, Brgy. Burol Main',
    city: 'Dasmariñas',
    region: 'Cavite',
    postal: '4114',
  },
  plusCode: '8XG2+CP Dasmariñas, Cavite',
  priceRange: '₱1–500',
  services: ['Dine-in', 'Curbside pickup', 'No-contact delivery'],
  // Map query uses the plus code; swap for the exact Google Maps place name if you prefer
  mapEmbed: 'https://www.google.com/maps?q=Casa+Estelita+Garden+Cafe+8XG2%2BCP+Dasmari%C3%B1as%2C+Cavite&output=embed',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=8XG2%2BCP%20Dasmari%C3%B1as%2C%20Cavite',
  instagram: 'https://www.instagram.com/popular/cafe-estelita/', // PLACEHOLDER: swap for your profile URL
  facebook: 'https://www.facebook.com/people/Casa-Estelita-Garden-Cafe/61584296136764/',
  heroImage: U('1470058869958-2a77ade41c02', 2000),
};

/* ---------- OPENING HOURS (Philippine time) ----------
   Only "Opens 3 PM" is confirmed.
   PLACEHOLDER: closing time (23:00) and open days are GUESSES — CONFIRM FULL WEEKLY HOURS.
   Use 24-hour "HH:MM". Closing after midnight is fine (open '15:00', close '01:00').
   To mark a day closed:  open: null, close: null.
   (Google's structured data is generated from this automatically.) */
export type Day = { day: string; open: string | null; close: string | null };
export const HOURS: { timezone: string; week: Day[] } = {
  timezone: 'Asia/Manila',
  week: [ // index 0 = Sunday
    { day: 'Sunday',    open: '15:00', close: '23:00' },
    { day: 'Monday',    open: '15:00', close: '23:00' },
    { day: 'Tuesday',   open: '15:00', close: '23:00' },
    { day: 'Wednesday', open: '15:00', close: '23:00' },
    { day: 'Thursday',  open: '15:00', close: '23:00' },
    { day: 'Friday',    open: '15:00', close: '23:00' },
    { day: 'Saturday',  open: '15:00', close: '23:00' },
  ],
};

/* ---------- MENU ----------
   REPLACE WITH REAL MENU ITEMS AND PRICES FROM INSTAGRAM/FACEBOOK
   Each category becomes a tab. price = number in pesos.
   The item with  signature: true  is shown as the big featured card. */
export type MenuItem = { name: string; price: number; desc: string; tags?: string[]; img: string; alt: string; signature?: boolean };
export const MENU: Record<string, MenuItem[]> = {
  Coffee: [
    { name: 'Spanish Latte', price: 160, desc: 'Espresso, steamed milk and a ribbon of condensed milk — our everyday favorite.', tags: ['Hot / Iced', 'Bestseller'], img: U('1572442388796-11668a67e53d', 800, 600), alt: 'Spanish latte with rosetta latte art in a white cup' },
    { name: 'Sea Salt Caramel Latte', price: 180, desc: 'House caramel, a pinch of sea salt and cold milk over a double shot.', tags: ['Iced'], img: U('1461023058943-07fcbe16d735', 800, 600), alt: 'Iced caramel latte with milk swirling into espresso' },
    { name: 'Estelita Honey Oat', price: 190, desc: 'Our house special: oat milk, wildflower honey and a hint of cinnamon.', tags: ['House special'], img: U('1541167760496-1628856ab772', 800, 600), alt: 'Barista pouring steamed milk into a latte' },
    { name: 'Iced Cafe Mocha', price: 170, desc: 'Dark chocolate and espresso, shaken cold and topped with milk.', tags: ['Iced'], img: U('1517701604599-bb29b565090c', 800, 600), alt: 'Tall glass of iced mocha on a wooden table' },
    { name: 'Cappuccino', price: 150, desc: 'Equal parts espresso, milk and velvety foam. Simple and perfect.', tags: ['Hot'], img: U('1495474472287-4d71bcdd2085', 800, 600), alt: 'Friends toasting cups of cappuccino with latte art' },
    { name: 'Americano', price: 120, desc: 'A clean, smooth double shot over hot water or ice.', tags: ['Hot / Iced'], img: U('1610889556528-9a770e32642f', 800, 600), alt: 'Espresso in a small glass cup on a saucer' },
  ],
  'Non-Coffee': [
    { name: 'Ceremonial Matcha Latte', price: 170, desc: 'Whisked Japanese matcha with your choice of fresh or oat milk.', tags: ['Hot / Iced'], img: U('1515823064-d6e0c04616a7', 800, 600), alt: 'Matcha latte with leaf art in a white cup' },
    { name: 'Calamansi Honey Cooler', price: 130, desc: 'Fresh calamansi, local honey and sparkling water with mint.', tags: ['Refreshing'], img: U('1621263764928-df1444c5e859', 800, 600), alt: 'Sparkling citrus drink with lime slices and mint' },
    { name: 'Strawberry Garden Soda', price: 150, desc: 'Strawberry, hibiscus and a squeeze of citrus over ice.', tags: ['Iced'], img: U('1497534446932-c925b458314e', 800, 600), alt: 'Glasses of red strawberry soda garnished with mint and lime' },
    { name: 'Classic Tablea Choco', price: 150, desc: 'Rich Filipino tablea chocolate, served hot and frothy.', tags: ['Hot'], img: U('1542990253-0d0f5be5f0ed', 800, 600), alt: 'Hot chocolate being poured into a ceramic cup' },
    { name: 'Garden Herbal Tea', price: 120, desc: 'A calming pot of chamomile, lemongrass and pandan.', tags: ['Pot for one'], img: U('1558160074-4d7d8bdf4256', 800, 600), alt: 'Small teapot and glass cup of amber herbal tea' },
    { name: 'Lemon Iced Tea', price: 110, desc: 'House-brewed black tea with fresh lemon.', tags: ['Iced'], img: U('1556679343-c7306c1976bc', 800, 600), alt: 'Iced tea with lime wedge and ice cubes' },
  ],
  Pastries: [
    { name: 'Butter Croissant', price: 95, desc: 'Flaky, golden and baked through the afternoon.', tags: ['Freshly baked'], img: U('1555507036-ab1f4038808a', 800, 600), alt: 'Golden butter croissant dusted with flour' },
    { name: 'Cinnamon Swirl', price: 110, desc: 'Soft brioche roll with brown sugar, cinnamon and cream-cheese glaze.', tags: ['Bestseller'], img: U('1509365465985-25d11c17e812', 800, 600), alt: 'Cinnamon rolls dusted with sugar on a dark tray' },
    { name: 'Banana Walnut Loaf', price: 90, desc: 'Moist, toasty and best with a cup of Americano.', tags: ['Slice'], img: U('1606101273945-e9eba91c0dc4', 800, 600), alt: 'Slices of banana walnut bread with butter' },
    { name: 'Sea Salt Choco Cookie', price: 75, desc: 'Chewy middle, crisp edges, flakes of sea salt.', tags: ['Freshly baked'], img: U('1558961363-fa8fdf82db35', 800, 600), alt: 'Chocolate chip cookies in a basket' },
    { name: 'Dark Chocolate Cake', price: 160, desc: 'Layers of moist chocolate sponge and silky ganache.', tags: ['Slice'], img: U('1578985545062-69928b1d9587', 800, 600), alt: 'Chocolate layer cake with ganache drip and piped rosettes' },
    { name: 'Fruit Tartlets', price: 120, desc: 'Buttery shells, vanilla custard and seasonal fruit.', tags: ['Set of 2'], img: U('1495147466023-ac5c588e2e94', 800, 600), alt: 'Mini fruit tarts topped with berries and kiwi' },
  ],
  Mains: [
    { name: 'Casa Lasagna', signature: true, price: 285, desc: 'Our most-loved dish: slow-simmered beef ragù, layers of fresh pasta, creamy béchamel and a bubbling golden cheese crust. Served with garlic toast.', tags: ['Signature', 'Good for sharing'], img: U('1574894709920-11b28e7367e3', 1200, 900), alt: 'Generous slice of baked lasagna with bubbling cheese and tomato ragù' },
    { name: 'Beef Ragù Tagliatelle', price: 265, desc: 'Ribbon pasta tossed in our slow-cooked tomato and beef sauce.', tags: ['Pasta'], img: U('1551183053-bf91a1d81141', 800, 600), alt: 'Bowl of tagliatelle with beef ragù and herbs' },
    { name: 'Garden Grain Bowl', price: 245, desc: 'Herb chicken, greens, corn, egg and house vinaigrette.', tags: ['Light'], img: U('1546069901-ba9599a7e63c', 800, 600), alt: 'Colorful salad bowl with chicken, egg, corn and greens' },
    { name: 'Pressed Ham & Cheese', price: 195, desc: 'Toasted sourdough, smoked ham, melted cheese and a side of dip.', tags: ['Sandwich'], img: U('1528735602780-2552fd46c7af', 800, 600), alt: 'Grilled ham and cheese sandwich halves with dips' },
    { name: 'Eggs Benedict', price: 225, desc: 'Poached eggs, hollandaise and smoked ham on toasted muffin.', tags: ['All-day'], img: U('1608039829572-78524f79c4c7', 800, 600), alt: 'Eggs benedict with runny yolk and hollandaise sauce' },
    { name: 'Sunny Avo Toast', price: 210, desc: 'Smashed avocado, fried egg and chili flakes on sourdough.', tags: ['All-day'], img: U('1525351484163-7529414344d8', 800, 600), alt: 'Avocado toast topped with a sunny-side-up egg' },
  ],
};

/* ---------- GALLERY ----------
   USE REAL PHOTOS FROM INSTAGRAM/FACEBOOK
   cat must be one of: 'Vibe', 'Coffee', 'Food', 'Garden'.
   w / h = the photo's real proportions (prevents layout jumps). */
export type Photo = { src: string; w: number; h: number; cat: 'Vibe' | 'Coffee' | 'Food' | 'Garden'; alt: string };
export const GALLERY: Photo[] = [
  { src: U('1600093463592-8e36ae95ef56', 1200, 1500), w: 1200, h: 1500, cat: 'Vibe', alt: 'Cafe interior with hanging plants, rattan and soft pendant lights' },
  { src: U('1509042239860-f550ce710b93', 1200, 1200), w: 1200, h: 1200, cat: 'Coffee', alt: 'Lattes with leaf art on a table beside fresh greenery' },
  { src: U('1585320806297-9794b3e4eeae', 1200, 1590), w: 1200, h: 1590, cat: 'Garden', alt: 'Garden path lined with flowering shrubs and green hedges' },
  { src: U('1619895092538-128341789043', 1200, 900), w: 1200, h: 900, cat: 'Food', alt: 'Lasagna on a plate next to a baking dish and fresh basil' },
  { src: U('1445116572660-236099ec97a0', 1200, 900), w: 1200, h: 900, cat: 'Vibe', alt: 'Quiet cafe table by tall windows with a French press and plants' },
  { src: U('1515823064-d6e0c04616a7', 1200, 1500), w: 1200, h: 1500, cat: 'Coffee', alt: 'Bright green matcha latte with leaf latte art' },
  { src: U('1497250681960-ef046c08a56e', 1200, 1200), w: 1200, h: 1200, cat: 'Garden', alt: 'Close-up of lush green fern fronds' },
  { src: U('1555507036-ab1f4038808a', 1200, 1500), w: 1200, h: 1500, cat: 'Food', alt: 'Freshly baked croissant on a dark surface' },
  { src: U('1559496417-e7f25cb247f3', 1200, 1500), w: 1200, h: 1500, cat: 'Vibe', alt: 'Glass of coffee casting soft leaf shadows in afternoon sun' },
  { src: U('1461023058943-07fcbe16d735', 1200, 900), w: 1200, h: 900, cat: 'Coffee', alt: 'Iced latte with milk swirling through espresso' },
  { src: U('1520412099551-62b6bafeb5bb', 1200, 1500), w: 1200, h: 1500, cat: 'Garden', alt: 'Small leafy tree in a pot against a deep green backdrop' },
  { src: U('1495147466023-ac5c588e2e94', 1200, 1200), w: 1200, h: 1200, cat: 'Food', alt: 'Assorted fruit tartlets topped with berries and kiwi' },
  { src: U('1534040385115-33dcb3acba5b', 1200, 900), w: 1200, h: 900, cat: 'Vibe', alt: 'Window seat with coffee cup, notebook and potted plant' },
  { src: U('1470058869958-2a77ade41c02', 1200, 1500), w: 1200, h: 1500, cat: 'Garden', alt: 'Dense tropical foliage with monstera and palm leaves' },
];

/* ---------- TESTIMONIALS ---------- */
export const TESTIMONIALS = [
  { quote: 'A hidden gem in the busy streets of Dasmariñas.', source: 'Guest review' },
  { quote: 'Nice ambiance and very spacious cafe… a cafe with nature vibes.', source: 'Guest review' },
  { quote: 'The place was very inviting, and both the coffee and pastries were really good.', source: 'Guest review' },
];

/* ---------- ABOUT PHOTOS (collage) ---------- */
export const ABOUT_PHOTOS = {
  main: { src: U('1600093463592-8e36ae95ef56', 900, 1160), alt: 'Cafe interior filled with hanging plants, wooden tables and warm pendant lights' },
  side: { src: U('1534040385115-33dcb3acba5b', 800, 940), alt: 'Sunlit window table with a cup of coffee, notebook and potted plants' },
  polaroid: { src: U('1509042239860-f550ce710b93', 600, 600), alt: 'Two lattes with leaf latte art beside a sprig of greenery' },
};
