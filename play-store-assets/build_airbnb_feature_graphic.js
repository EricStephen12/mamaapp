const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = __dirname;

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
  return `data:${mime};base64,${fs.readFileSync(path.join(ROOT, relPath)).toString('base64')}`;
}

const PHOTO_JOLLOF = uri('website/assets/photos/hero-jollof-chicken.jpg');
const PHOTO_FRIED = uri('website/assets/photos/dish-fried-rice.jpg');
const PHOTO_PASTA = uri('website/assets/photos/dish-garlic-pasta.jpg');
const PHOTO_YAM = uri('website/assets/photos/dish-yam-egg.jpg');
const MAMA_AFRICA = uri('assets/mamas/mama-africa.png', 'image/png');

function drawLogoMark(x, y, scale = 1, stroke = '#FFFFFF') {
  return `<g transform="translate(${x}, ${y}) scale(${scale}) translate(-140, -28)">
    <path d="M140 70H220C216 92 202 103 180 103C158 103 144 92 140 70Z" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M164 114H196" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M154 54V41C154 28 167 26 172 38L180 55L188 38C193 26 206 28 206 41V54" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function wrapPhone({ cx, cy, scale = 1, rot = 0, screenSvg, id = 'fp1' }) {
  const pw = 740;
  const ph = 1520;
  return `<g transform="translate(${cx}, ${cy}) rotate(${rot}) scale(${scale}) translate(${-pw / 2}, ${-ph / 2})">
    <rect x="22" y="34" width="${pw}" height="${ph}" rx="92" fill="#0D1108" fill-opacity="0.38"/>
    <rect x="0" y="0" width="${pw}" height="${ph}" rx="92" fill="#1C1F1A" stroke="#3F4639" stroke-width="7"/>
    <defs>
      <clipPath id="fscr_${id}">
        <rect x="20" y="20" width="700" height="1480" rx="74"/>
      </clipPath>
    </defs>
    <g clip-path="url(#fscr_${id})">
      <rect x="20" y="20" width="700" height="1480" fill="#F8F5EF"/>
      <g transform="translate(20, 20)">${screenSvg}</g>
    </g>
    <rect x="${pw / 2 - 90}" y="44" width="180" height="36" rx="18" fill="#141612"/>
    <rect x="20" y="20" width="700" height="1480" rx="74" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="2.5"/>
  </g>`;
}

function screenDailyEdit() {
  return `
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <text x="42" y="148" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.5" fill="#727568">DINNER · DECIDED IN 10s</text>
    <text x="42" y="208" font-family="Georgia" font-size="48" font-weight="700" fill="#242820">Your Daily Edit</text>
    <rect x="530" y="162" width="128" height="48" rx="24" fill="#E9EBDD"/>
    <text x="594" y="194" text-anchor="middle" font-family="Segoe UI" font-size="22" font-weight="700" fill="#4C5835">On Budget</text>

    <g transform="translate(42, 238)">
      <rect x="0" y="0" width="136" height="50" rx="25" fill="#EDE6DA"/>
      <text x="68" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Breakfast</text>
      <rect x="150" y="0" width="112" height="50" rx="25" fill="#EDE6DA"/>
      <text x="206" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Lunch</text>
      <rect x="276" y="0" width="126" height="50" rx="25" fill="#66704A"/>
      <text x="339" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" font-weight="700" fill="#FFFFFF">Dinner</text>
      <rect x="416" y="0" width="150" height="50" rx="25" fill="#EDE6DA"/>
      <text x="491" y="33" text-anchor="middle" font-family="Segoe UI" font-size="22" fill="#5D6155">Late Night</text>
    </g>

    <g transform="translate(42, 318)">
      <rect x="0" y="0" width="616" height="802" rx="38" fill="#FFFCF7" stroke="#E5E1D6" stroke-width="2"/>
      <defs><clipPath id="fgHeroDish"><rect x="18" y="18" width="580" height="496" rx="28"/></clipPath></defs>
      <image href="${PHOTO_JOLLOF}" x="18" y="18" width="580" height="496" clip-path="url(#fgHeroDish)" preserveAspectRatio="xMidYMid slice"/>
      <rect x="40" y="40" width="236" height="48" rx="24" fill="#FFFCF7" fill-opacity="0.92"/>
      <circle cx="66" cy="64" r="7" fill="#66704A"/>
      <text x="84" y="72" font-family="Segoe UI" font-size="21" font-weight="700" fill="#242820">98% Pantry Match</text>

      <text x="32" y="576" font-family="Georgia" font-size="40" font-weight="700" fill="#242820">Smoky Jollof &amp; Chicken</text>
      <text x="32" y="618" font-family="Segoe UI" font-size="25" fill="#727568">Ready in 25 min · Uses rice, tomatoes &amp; chicken</text>

      <rect x="32" y="654" width="380" height="98" rx="49" fill="#66704A"/>
      <text x="222" y="714" text-anchor="middle" font-family="Segoe UI" font-size="29" font-weight="700" fill="#FFFFFF">Let's Eat This</text>

      <rect x="428" y="654" width="156" height="98" rx="49" fill="#E9EBDD"/>
      <rect x="486" y="683" width="40" height="40" rx="9" fill="none" stroke="#4C5835" stroke-width="4"/>
      <circle cx="498" cy="695" r="3.8" fill="#4C5835"/>
      <circle cx="514" cy="711" r="3.8" fill="#4C5835"/>
    </g>

    <g transform="translate(42, 1152)">
      <rect x="0" y="0" width="616" height="148" rx="30" fill="#EDE6DA"/>
      <defs><clipPath id="fgMama"><circle cx="72" cy="74" r="46"/></clipPath></defs>
      <image href="${MAMA_AFRICA}" x="26" y="28" width="92" height="92" clip-path="url(#fgMama)" preserveAspectRatio="xMidYMid slice"/>
      <text x="140" y="64" font-family="Georgia" font-size="25" font-weight="700" fill="#242820">"Shake again if you want</text>
      <text x="140" y="98" font-family="Georgia" font-size="25" font-weight="700" fill="#242820">something faster tonight."</text>
    </g>
  `;
}

function screenCollection() {
  const cards = [
    { title: 'Smoky Jollof', sub: '25 min', img: PHOTO_JOLLOF, x: 42, y: 260, id: 'fc1' },
    { title: 'Garlic Pasta', sub: '15 min', img: PHOTO_PASTA, x: 364, y: 260, id: 'fc2' },
    { title: 'Yam &amp; Egg', sub: '20 min', img: PHOTO_YAM, x: 42, y: 730, id: 'fc3' },
    { title: 'Fried Rice', sub: '18 min', img: PHOTO_FRIED, x: 364, y: 730, id: 'fc4' },
  ];
  return `
    <text x="54" y="64" font-family="Segoe UI" font-size="24" font-weight="700" fill="#242820">7:14</text>
    <text x="42" y="148" font-family="Segoe UI" font-size="22" font-weight="700" letter-spacing="1.5" fill="#66704A">SAVED FAVORITES</text>
    <text x="42" y="210" font-family="Georgia" font-size="48" font-weight="700" fill="#242820">Your Collection</text>
    ${cards.map((c) => `
      <g transform="translate(${c.x}, ${c.y})">
        <rect x="0" y="0" width="294" height="440" rx="30" fill="#FFFCF7" stroke="#E5E1D6" stroke-width="2"/>
        <defs><clipPath id="${c.id}"><rect x="12" y="12" width="270" height="316" rx="22"/></clipPath></defs>
        <image href="${c.img}" x="12" y="12" width="270" height="316" clip-path="url(#${c.id})" preserveAspectRatio="xMidYMid slice"/>
        <text x="20" y="374" font-family="Georgia" font-size="28" font-weight="700" fill="#242820">${c.title}</text>
        <text x="20" y="410" font-family="Segoe UI" font-size="22" fill="#727568">${c.sub}</text>
      </g>
    `).join('')}
  `;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <!-- Clean signature Mama Olive canvas matching Slides 1 & 2 of the 9:16 gallery! -->
    <linearGradient id="fgBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5B683E"/>
      <stop offset="100%" stop-color="#3F4B28"/>
    </linearGradient>
    <radialGradient id="fgWarm" cx="76%" cy="52%" r="48%">
      <stop offset="0%" stop-color="#F4C95D" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#F4C95D" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1024" height="500" fill="url(#fgBg)"/>
  <rect width="1024" height="500" fill="url(#fgWarm)"/>

  <!-- ══ LEFT MINIMAL AIRBNB-STYLE TYPOGRAPHY (ZERO BADGES, ZERO CLUTTER!) ══ -->
  ${drawLogoMark(64, 62, 0.72, '#FFFFFF')}
  <text x="132" y="106" font-family="Georgia" font-size="34" font-weight="700" fill="#FFFFFF">Mama Dish</text>

  <text x="62" y="232" font-family="Segoe UI" font-size="68" font-weight="700" letter-spacing="-1.8" fill="#FFFFFF">Open. Shake.</text>
  <text x="62" y="308" font-family="Segoe UI" font-size="68" font-weight="700" letter-spacing="-1.8" fill="#FFFFFF">Decide. <tspan fill="#F4C95D">Eat.</tspan></text>

  <text x="64" y="380" font-family="Segoe UI" font-size="25" font-weight="400" fill="#E4E8D5">What to eat, decided in 10 seconds.</text>

  <!-- ══ RIGHT SHOWCASE: TWO SLEEK FLOATING REAL-APP PHONES (Airbnb / Spotify style!) ══ -->
  <!-- Secondary tilted phone behind on right showing Your Collection -->
  ${wrapPhone({ cx: 882, cy: 365, scale: 0.36, rot: 10, screenSvg: screenCollection(), id: 'fgBack' })}
  <!-- Primary hero tilted phone in front showing Your Daily Edit + Jollof & Chicken -->
  ${wrapPhone({ cx: 694, cy: 325, scale: 0.41, rot: -8, screenSvg: screenDailyEdit(), id: 'fgFront' })}
</svg>`;

const outPath = path.join(OUT_DIR, 'feature-graphic-1024x500.png');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1024 },
  font: RESVG_FONTS,
});
const png = resvg.render().asPng();
fs.writeFileSync(outPath, png);
console.log(`Exported clean Airbnb-style Feature Graphic -> ${outPath} (1024x500, ${(png.length / 1024).toFixed(1)} KB)`);

