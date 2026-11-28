const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'screenshots-9x16');
fs.mkdirSync(OUT_DIR, { recursive: true });

const RESVG_FONTS = {
  fontFiles: [
    'C:\\Windows\\Fonts\\segoeuib.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\georgiab.ttf',
    'C:\\Windows\\Fonts\\georgia.ttf',
  ],
  loadSystemFonts: false,
  defaultFontFamily: 'Segoe UI',
};

function uri(relPath, mime = 'image/jpeg') {
  const full = path.join(ROOT, relPath);
  return `data:${mime};base64,${fs.readFileSync(full).toString('base64')}`;
}

const PHOTO_JOLLOF = uri('website/assets/photos/hero-jollof-chicken.jpg');
const PHOTO_FRIED = uri('website/assets/photos/dish-fried-rice.jpg');
const PHOTO_PASTA = uri('website/assets/photos/dish-garlic-pasta.jpg');
const PHOTO_HONEY = uri('website/assets/photos/dish-honey-chicken.jpg');
const PHOTO_SALMON = uri('website/assets/photos/dish-salmon-greens.jpg');
const PHOTO_YAM = uri('website/assets/photos/dish-yam-egg.jpg');
const MAMA_AFRICA = uri('assets/mamas/mama-africa.png', 'image/png');

const W = 1080;
const H = 1920;

// Clean white Mama Dish bowl-and-steam logo mark (from actual brand SVG!)
function drawLogoMark(x, y, scale = 1, stroke = '#FFFFFF') {
  return `<g transform="translate(${x}, ${y}) scale(${scale}) translate(-140, -28)">
    <path d="M140 70H220C216 92 202 103 180 103C158 103 144 92 140 70Z" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M164 114H196" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M154 54V41C154 28 167 26 172 38L180 55L188 38C193 26 206 28 206 41V54" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

// Sleek realistic modern smartphone shell (720x1480 logical interior, centered around origin)
function wrapPhone({ cx, cy, scale = 1, rot = 0, screenSvg, id = 'p1' }) {
  const pw = 740;
  const ph = 1520;
  return `<g transform="translate(${cx}, ${cy}) rotate(${rot}) scale(${scale}) translate(${-pw / 2}, ${-ph / 2})">
    <!-- Deep soft studio drop shadow -->
    <rect x="18" y="34" width="${pw}" height="${ph}" rx="92" fill="#0D1108" fill-opacity="0.34"/>
    <!-- Metallic outer bezel rim -->
    <rect x="0" y="0" width="${pw}" height="${ph}" rx="92" fill="#1C1F1A" stroke="#3E4438" stroke-width="6"/>
    <!-- Side hardware buttons -->
    <rect x="-7" y="250" width="7" height="74" rx="3" fill="#2F342B"/>
    <rect x="-7" y="355" width="7" height="120" rx="3" fill="#2F342B"/>
    <rect x="${pw}" y="310" width="7" height="150" rx="3" fill="#2F342B"/>
    <!-- Clipped phone screen (700x1480) -->
    <defs>
      <clipPath id="scr_${id}">
        <rect x="20" y="20" width="700" height="1480" rx="74"/>
      </clipPath>
    </defs>
    <g clip-path="url(#scr_${id})">
      <rect x="20" y="20" width="700" height="1480" fill="#F8F5EF"/>
      <g transform="translate(20, 20)">
        ${screenSvg}
      </g>
    </g>
    <!-- Dynamic Island / subtle top speaker pill -->
    <rect x="${pw / 2 - 90}" y="44" width="180" height="36" rx="18" fill="#141612"/>
    <!-- Subtle inner glass highlight -->
    <rect x="20" y="20" width="700" height="1480" rx="74" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="2"/>
  </g>`;
}

// Reusable authentic Mama Dish bottom navigation bar (width 700, placed at y=1340)
function drawBottomNav(activeIdx = 0) {
  const tabs = ['Daily Edit', 'Discover', 'Kitchen', 'Saved'];
  const xs = [105, 268, 432, 595];
  return `<g transform="translate(0, 1344)">
    <rect x="0" y="0" width="700" height="136" fill="#FFFCF7"/>
    <line x1="0" y1="0" x2="700" y2="0" stroke="#E5E1D6" stroke-width="2"/>
    ${tabs.map((label, i) => {
      const active = i === activeIdx;
      const col = active ? '#66704A' : '#8E9186';
      return `<g transform="translate(${xs[i]}, 46)">
        <circle cx="0" cy="-6" r="${active ? 14 : 11}" fill="${active ? '#66704A' : 'none'}" stroke="${col}" stroke-width="3.5"/>
        <text x="0" y="34" text-anchor="middle" font-family="Segoe UI" font-size="21" font-weight="${active ? 700 : 400}" fill="${col}">${label}</text>
      </g>`;
    }).join('')}
    <!-- Home gesture bar -->
    <rect x="235" y="106" width="230" height="8" rx="4" fill="#242820" fill-opacity="0.24"/>
  </g>`;
}

// ── REAL MAMA DISH SCREEN A: YOUR DAILY EDIT (Meal Card + Shake to Roll!) ────
function screenDailyEdit(idSuffix = 'a') {
  return `
    <!-- Status bar -->
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <!-- Header row -->
    <text x="42" y="148" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.5" fill="#727568">DINNER · DECIDED IN 10s</text>
    <text x="42" y="206" font-family="Georgia" font-size="48" font-weight="700" fill="#242820">Your Daily Edit</text>
    <!-- Country / Budget pill top right -->
    <rect x="530" y="162" width="128" height="48" rx="24" fill="#E9EBDD"/>
    <text x="594" y="194" text-anchor="middle" font-family="Segoe UI" font-size="22" font-weight="700" fill="#4C5835">On Budget</text>

    <!-- Period filter chips -->
    <g transform="translate(42, 236)">
      <rect x="0" y="0" width="136" height="50" rx="25" fill="#EDE6DA"/>
      <text x="68" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Breakfast</text>
      <rect x="150" y="0" width="112" height="50" rx="25" fill="#EDE6DA"/>
      <text x="206" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Lunch</text>
      <rect x="276" y="0" width="126" height="50" rx="25" fill="#66704A"/>
      <text x="339" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" font-weight="700" fill="#FFFFFF">Dinner</text>
      <rect x="416" y="0" width="150" height="50" rx="25" fill="#EDE6DA"/>
      <text x="491" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Late Night</text>
    </g>

    <!-- Hero Meal Decision Card -->
    <g transform="translate(42, 318)">
      <rect x="0" y="8" width="616" height="802" rx="38" fill="#242820" fill-opacity="0.08"/>
      <rect x="0" y="0" width="616" height="802" rx="38" fill="#FFFCF7" stroke="#E5E1D6" stroke-width="2"/>
      <defs>
        <clipPath id="heroDish_${idSuffix}"><rect x="18" y="18" width="580" height="496" rx="28"/></clipPath>
      </defs>
      <image href="${PHOTO_JOLLOF}" x="18" y="18" width="580" height="496" clip-path="url(#heroDish_${idSuffix})" preserveAspectRatio="xMidYMid slice"/>
      <!-- Frosted top badge on photo -->
      <rect x="40" y="40" width="236" height="48" rx="24" fill="#FFFCF7" fill-opacity="0.92"/>
      <circle cx="66" cy="64" r="7" fill="#66704A"/>
      <text x="84" y="72" font-family="Segoe UI" font-size="21" font-weight="700" fill="#242820">98% Pantry Match</text>

      <!-- Meal title & quick tags -->
      <text x="32" y="576" font-family="Georgia" font-size="40" font-weight="700" fill="#242820">Smoky Jollof &amp; Chicken</text>
      <text x="32" y="618" font-family="Segoe UI" font-size="25" fill="#727568">Ready in 25 min · Uses rice, tomatoes &amp; chicken</text>

      <!-- Two clean action buttons inside card -->
      <rect x="32" y="654" width="380" height="98" rx="49" fill="#66704A"/>
      <text x="222" y="714" text-anchor="middle" font-family="Segoe UI" font-size="29" font-weight="700" fill="#FFFFFF">Let's Eat This</text>

      <rect x="428" y="654" width="156" height="98" rx="49" fill="#E9EBDD"/>
      <!-- Crisp die icon -->
      <rect x="486" y="683" width="40" height="40" rx="9" fill="none" stroke="#4C5835" stroke-width="4"/>
      <circle cx="498" cy="695" r="3.8" fill="#4C5835"/>
      <circle cx="514" cy="711" r="3.8" fill="#4C5835"/>
    </g>

    <!-- Mama live warmth bar -->
    <g transform="translate(42, 1152)">
      <rect x="0" y="0" width="616" height="148" rx="30" fill="#EDE6DA"/>
      <defs><clipPath id="mamaAv_${idSuffix}"><circle cx="72" cy="74" r="46"/></clipPath></defs>
      <image href="${MAMA_AFRICA}" x="26" y="28" width="92" height="92" clip-path="url(#mamaAv_${idSuffix})" preserveAspectRatio="xMidYMid slice"/>
      <text x="140" y="64" font-family="Georgia" font-size="25" font-weight="700" fill="#242820">"Shake again if you want</text>
      <text x="140" y="98" font-family="Georgia" font-size="25" font-weight="700" fill="#242820">something faster tonight."</text>
    </g>

    ${drawBottomNav(0)}
  `;
}

// ── REAL MAMA DISH SCREEN B: WHAT'S IN YOUR KITCHEN (Pantry Taps!) ──────────
function screenKitchen() {
  const sections = [
    {
      title: 'PRODUCE',
      y: 356,
      items: [
        { name: 'Tomatoes', on: true, w: 184 },
        { name: 'Plantains', on: true, w: 178 },
        { name: 'Onions', on: true, w: 150 },
        { name: 'Garlic', on: false, w: 138 },
        { name: 'Spinach', on: false, w: 158 },
        { name: 'Potatoes', on: false, w: 168 },
      ],
    },
    {
      title: 'PROTEINS',
      y: 616,
      items: [
        { name: 'Eggs', on: true, w: 130 },
        { name: 'Chicken', on: true, w: 168 },
        { name: 'Tuna', on: false, w: 128 },
        { name: 'Black Beans', on: false, w: 204 },
        { name: 'Sausage', on: false, w: 168 },
      ],
    },
    {
      title: 'CARBS &amp; STAPLES',
      y: 876,
      items: [
        { name: 'Rice', on: true, w: 128 },
        { name: 'Pasta', on: true, w: 140 },
        { name: 'Bread', on: false, w: 146 },
        { name: 'Yam', on: false, w: 124 },
        { name: 'Oats', on: false, w: 132 },
        { name: 'Cooking Oil', on: true, w: 204 },
      ],
    },
  ];

  let sectionsSvg = '';
  for (const sec of sections) {
    sectionsSvg += `<text x="44" y="${sec.y}" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.6" fill="#727568">${sec.title}</text>`;
    let cx = 44;
    let cy = sec.y + 24;
    for (const item of sec.items) {
      if (cx + item.w > 664) {
        cx = 44;
        cy += 82;
      }
      sectionsSvg += `<g transform="translate(${cx}, ${cy})">
        <rect x="0" y="0" width="${item.w}" height="66" rx="33" fill="${item.on ? '#66704A' : '#FFFFFF'}" stroke="${item.on ? '#66704A' : '#DAD8CC'}" stroke-width="2.5"/>
        <text x="${item.w / 2}" y="42" text-anchor="middle" font-family="Segoe UI" font-size="26" font-weight="${item.on ? 700 : 400}" fill="${item.on ? '#FFFFFF' : '#242820'}">${item.name}</text>
      </g>`;
      cx += item.w + 16;
    }
  }

  return `
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <text x="44" y="150" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.5" fill="#66704A">8 ITEMS IN YOUR KITCHEN</text>
    <text x="44" y="210" font-family="Georgia" font-size="46" font-weight="700" fill="#242820">What's at home?</text>
    <text x="44" y="258" font-family="Segoe UI" font-size="25" fill="#727568">Tap what you have — Mama picks tonight's meal.</text>

    <!-- Quick Search / Add bar -->
    <rect x="44" y="282" width="612" height="50" rx="25" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
    <text x="72" y="315" font-family="Segoe UI" font-size="22" fill="#9A9D92">+ Add any ingredient...</text>

    ${sectionsSvg}

    <!-- Sticky Olive CTA Button -->
    <rect x="44" y="1178" width="612" height="106" rx="53" fill="#66704A"/>
    <text x="350" y="1241" text-anchor="middle" font-family="Segoe UI" font-size="30" font-weight="700" fill="#FFFFFF">Decide Meal From Kitchen</text>

    ${drawBottomNav(2)}
  `;
}

// ── REAL MAMA DISH SCREEN C: MAKE IT YOURS (Taste, Budget & Goals!) ─────────
function screenMakeItYours() {
  return `
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <!-- Step Progress Bar -->
    <rect x="44" y="112" width="612" height="10" rx="5" fill="#E4E1D6"/>
    <rect x="44" y="112" width="420" height="10" rx="5" fill="#66704A"/>

    <text x="44" y="198" font-family="Georgia" font-size="48" font-weight="700" fill="#242820">Make it yours</text>
    <text x="44" y="246" font-family="Segoe UI" font-size="25" fill="#727568">One-time setup. Every pick fits your life.</text>

    <!-- Weekly Budget Card -->
    <g transform="translate(44, 286)">
      <rect x="0" y="0" width="612" height="248" rx="32" fill="#FFFCF7" stroke="#E5E1D6" stroke-width="2"/>
      <text x="32" y="54" font-family="Segoe UI" font-size="21" font-weight="700" letter-spacing="1.4" fill="#727568">WEEKLY FOOD BUDGET</text>
      <text x="32" y="118" font-family="Georgia" font-size="46" font-weight="700" fill="#242820">Comfort · Balanced</text>
      <rect x="32" y="152" width="548" height="14" rx="7" fill="#E9EBDD"/>
      <rect x="32" y="152" width="330" height="14" rx="7" fill="#66704A"/>
      <circle cx="362" cy="159" r="20" fill="#66704A" stroke="#FFFFFF" stroke-width="6"/>
      <text x="32" y="216" font-family="Segoe UI" font-size="22" fill="#727568">Student</text>
      <text x="306" y="216" text-anchor="middle" font-family="Segoe UI" font-size="22" font-weight="700" fill="#66704A">Everyday</text>
      <text x="580" y="216" text-anchor="end" font-family="Segoe UI" font-size="22" fill="#727568">Treat Mode</text>
    </g>

    <!-- Body Goals 2x2 Grid -->
    <text x="44" y="592" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.4" fill="#727568">YOUR GOAL</text>
    <g transform="translate(44, 616)">
      <rect x="0" y="0" width="296" height="132" rx="28" fill="#66704A"/>
      <text x="30" y="64" font-family="Georgia" font-size="30" font-weight="700" fill="#FFFFFF">Balanced</text>
      <text x="30" y="102" font-family="Segoe UI" font-size="21" fill="#E4E8D5">Everyday energy</text>

      <rect x="316" y="0" width="296" height="132" rx="28" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
      <text x="346" y="64" font-family="Georgia" font-size="30" font-weight="700" fill="#242820">Lose Weight</text>
      <text x="346" y="102" font-family="Segoe UI" font-size="21" fill="#727568">Lighter plates</text>

      <rect x="0" y="152" width="296" height="132" rx="28" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
      <text x="30" y="216" font-family="Georgia" font-size="30" font-weight="700" fill="#242820">Gain Weight</text>
      <text x="30" y="254" font-family="Segoe UI" font-size="21" fill="#727568">Hearty portions</text>

      <rect x="316" y="152" width="296" height="132" rx="28" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
      <text x="346" y="216" font-family="Georgia" font-size="30" font-weight="700" fill="#242820">High Protein</text>
      <text x="346" y="254" font-family="Segoe UI" font-size="21" fill="#727568">Strong &amp; fueled</text>
    </g>

    <!-- Taste & Spice Chips -->
    <text x="44" y="962" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.4" fill="#727568">FLAVOR &amp; DIET</text>
    <g transform="translate(44, 988)">
      <rect x="0" y="0" width="176" height="64" rx="32" fill="#E9EBDD" stroke="#66704A" stroke-width="2.5"/>
      <text x="88" y="41" text-anchor="middle" font-family="Segoe UI" font-size="25" font-weight="700" fill="#4C5835">Bold Spice</text>
      <rect x="192" y="0" width="160" height="64" rx="32" fill="#E9EBDD" stroke="#66704A" stroke-width="2.5"/>
      <text x="272" y="41" text-anchor="middle" font-family="Segoe UI" font-size="25" font-weight="700" fill="#4C5835">20m Fast</text>
      <rect x="368" y="0" width="170" height="64" rx="32" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
      <text x="453" y="41" text-anchor="middle" font-family="Segoe UI" font-size="25" fill="#242820">Dairy-Free</text>
      <rect x="0" y="80" width="150" height="64" rx="32" fill="#E9EBDD" stroke="#66704A" stroke-width="2.5"/>
      <text x="75" y="121" text-anchor="middle" font-family="Segoe UI" font-size="25" font-weight="700" fill="#4C5835">Halal</text>
      <rect x="166" y="80" width="214" height="64" rx="32" fill="#FFFFFF" stroke="#DAD8CC" stroke-width="2"/>
      <text x="273" y="121" text-anchor="middle" font-family="Segoe UI" font-size="25" fill="#242820">Comfort Food</text>
    </g>

    <rect x="44" y="1264" width="612" height="106" rx="53" fill="#242820"/>
    <text x="350" y="1328" text-anchor="middle" font-family="Segoe UI" font-size="30" font-weight="700" fill="#FFFFFF">Save My Taste Profile</text>
  `;
}

// ── REAL MAMA DISH SCREEN D: YOUR COLLECTION (Saved Cravings Grid!) ─────────
function screenCollection() {
  const cards = [
    { title: 'Smoky Jollof', sub: '25 min · Home', img: PHOTO_JOLLOF, x: 42, y: 274, id: 'c1' },
    { title: 'Garlic Pasta', sub: '15 min · Fast', img: PHOTO_PASTA, x: 364, y: 274, id: 'c2' },
    { title: 'Yam &amp; Egg', sub: '20 min · Bold', img: PHOTO_YAM, x: 42, y: 744, id: 'c3' },
    { title: 'Wok Fried Rice', sub: '18 min · Pantry', img: PHOTO_FRIED, x: 364, y: 744, id: 'c4' },
  ];

  return `
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <text x="42" y="150" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.5" fill="#66704A">SAVED FAVORITES</text>
    <text x="42" y="212" font-family="Georgia" font-size="48" font-weight="700" fill="#242820">Your Collection</text>

    ${cards.map((c) => `
      <g transform="translate(${c.x}, ${c.y})">
        <rect x="0" y="0" width="294" height="440" rx="30" fill="#FFFCF7" stroke="#E5E1D6" stroke-width="2"/>
        <defs><clipPath id="col_${c.id}"><rect x="12" y="12" width="270" height="316" rx="22"/></clipPath></defs>
        <image href="${c.img}" x="12" y="12" width="270" height="316" clip-path="url(#col_${c.id})" preserveAspectRatio="xMidYMid slice"/>
        <text x="20" y="374" font-family="Georgia" font-size="28" font-weight="700" fill="#242820">${c.title}</text>
        <text x="20" y="410" font-family="Segoe UI" font-size="22" fill="#727568">${c.sub}</text>
      </g>
    `).join('')}

    <!-- Taste learning card strip -->
    <rect x="42" y="1214" width="616" height="96" rx="26" fill="#E9EBDD"/>
    <text x="72" y="1272" font-family="Segoe UI" font-size="25" font-weight="700" fill="#4C5835">Mama learns your favorites every roll</text>

    ${drawBottomNav(3)}
  `;
}

// ── BUILD ALL 5 AIRBNB x FARFETCH 9:16 (1080x1920) SLIDES ───────────────────
const SLIDES = [
  // SLIDE 1: Iconic Airbnb-style bold olive hero + stacked minimal words + panoramic split phone bleeding right!
  {
    name: '01_open_shake_eat_9x16.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="olPair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5B683E"/>
          <stop offset="100%" stop-color="#434F2B"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#olPair)"/>
      <!-- Clean minimal white Mama Dish bowl-steam emblem (Airbnb style!) -->
      ${drawLogoMark(96, 200, 1.55, '#FFFFFF')}
      <!-- Iconic bold stacked 4-word Airbnb typography -->
      <text x="92" y="545" font-family="Segoe UI" font-size="136" font-weight="700" letter-spacing="-3" fill="#FFFFFF">Open.</text>
      <text x="92" y="695" font-family="Segoe UI" font-size="136" font-weight="700" letter-spacing="-3" fill="#FFFFFF">Shake.</text>
      <text x="92" y="845" font-family="Segoe UI" font-size="136" font-weight="700" letter-spacing="-3" fill="#FFFFFF">Decide.</text>
      <text x="92" y="995" font-family="Segoe UI" font-size="136" font-weight="700" letter-spacing="-3" fill="#F4C95D">Eat.</text>
      <!-- ONE panoramic angled phone seamlessly split across Slide 1 (cx=1340) & Slide 2 (cx=260)!! -->
      ${wrapPhone({ cx: 1340, cy: 1210, scale: 1.08, rot: -14, screenSvg: screenDailyEdit('s1'), id: 's1' })}
    </svg>`,
  },

  // SLIDE 2: Exact invisible-seam continuation of Slide 1's tilted phone! (Pure Airbnb Slides 1 & 2!)
  {
    name: '02_decided_in_10s_9x16.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="olPair2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5B683E"/>
          <stop offset="100%" stop-color="#434F2B"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#olPair2)"/>
      <!-- Clean bold top headline sitting cleanly ABOVE the continuing tilted phone! -->
      <text x="540" y="205" text-anchor="middle" font-family="Georgia" font-size="78" font-weight="700" fill="#FFFFFF">Decided in</text>
      <text x="540" y="295" text-anchor="middle" font-family="Georgia" font-size="78" font-weight="700" fill="#F4C95D">10 seconds.</text>
      <!-- EXACT pixel continuation of Slide 1's tilted phone (cx = 1340 - 1080 = 260)! -->
      ${wrapPhone({ cx: 260, cy: 1210, scale: 1.08, rot: -14, screenSvg: screenDailyEdit('s2'), id: 's2' })}
    </svg>`,
  },

  // SLIDE 3: Clean bright Seashell Cream Airbnb/Apple centered showcase — What's in Your Kitchen!
  {
    name: '03_your_kitchen_9x16.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <rect width="${W}" height="${H}" fill="#F4EFE6"/>
      <text x="540" y="210" text-anchor="middle" font-family="Georgia" font-size="78" font-weight="700" fill="#242820">Use what's</text>
      <text x="540" y="298" text-anchor="middle" font-family="Georgia" font-size="78" font-weight="700" fill="#5D6B3E">already at home.</text>
      ${wrapPhone({ cx: 540, cy: 1185, scale: 1.04, rot: 0, screenSvg: screenKitchen(), id: 's3' })}
    </svg>`,
  },

  // SLIDE 4: Farfetch-style full-bleed warm food editorial photograph + angled tilted phone!
  {
    name: '04_taste_budget_9x16.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1A2011" stop-opacity="0.88"/>
          <stop offset="42%" stop-color="#1A2011" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#1A2011" stop-opacity="0.82"/>
        </linearGradient>
      </defs>
      <!-- Full-bleed mouth-watering editorial food backdrop (Farfetch style!) -->
      <image href="${PHOTO_SALMON}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>
      <rect width="${W}" height="${H}" fill="url(#topFade)"/>
      <text x="86" y="215" font-family="Georgia" font-size="82" font-weight="700" fill="#FFFFFF">Made for</text>
      <text x="86" y="308" font-family="Georgia" font-size="82" font-weight="700" fill="#F4C95D">your taste.</text>
      <text x="86" y="382" font-family="Segoe UI" font-size="38" fill="#EAE7DC">Matched to your budget &amp; diet.</text>
      ${wrapPhone({ cx: 615, cy: 1265, scale: 1.0, rot: -11, screenSvg: screenMakeItYours(), id: 's4' })}
    </svg>`,
  },

  // SLIDE 5: Luxury Deep Charcoal-Olive Collection Finale!
  {
    name: '05_just_for_you_9x16.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="darkCol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2A331C"/>
          <stop offset="100%" stop-color="#181E10"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#darkCol)"/>
      <text x="540" y="210" text-anchor="middle" font-family="Georgia" font-size="82" font-weight="700" fill="#FFFFFF">Just for you.</text>
      <text x="540" y="286" text-anchor="middle" font-family="Segoe UI" font-size="38" fill="#C9D0BA">Save cravings you actually love.</text>
      ${wrapPhone({ cx: 540, cy: 1175, scale: 1.04, rot: 0, screenSvg: screenCollection(), id: 's5' })}
    </svg>`,
  },
];

// Render all 5 exact 1080x1920 PNGs!
const renderedPaths = [];
for (const slide of SLIDES) {
  const outPath = path.join(OUT_DIR, slide.name);
  const resvg = new Resvg(slide.svg, {
    fitTo: { mode: 'width', value: W },
    font: RESVG_FONTS,
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
  renderedPaths.push(outPath);
  console.log(`OK ${slide.name.padEnd(32)} 1080x1920 (${(png.length / 1024).toFixed(1)} KB)`);
}

// Build a 5-up side-by-side Play Store carousel preview strip so we can visually inspect all 5 together!
const stripOut = path.join(OUT_DIR, '_preview_carousel_strip.jpg');
const ff = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i', renderedPaths[0],
    '-i', renderedPaths[1],
    '-i', renderedPaths[2],
    '-i', renderedPaths[3],
    '-i', renderedPaths[4],
    '-filter_complex',
    '[0:v]scale=270:480[s0];[1:v]scale=270:480[s1];[2:v]scale=270:480[s2];[3:v]scale=270:480[s3];[4:v]scale=270:480[s4];[s0][s1][s2][s3][s4]hstack=inputs=5[out]',
    '-map', '[out]',
    '-q:v', '3',
    stripOut,
  ],
  { stdio: 'pipe' }
);
if (ff.status !== 0) {
  throw new Error(`Strip failed: ${ff.stderr.toString()}`);
}
console.log(`Preview strip -> ${stripOut}`);
