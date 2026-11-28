const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = __dirname;
const ICON_PATH = path.join(ROOT, 'assets', 'icon.png');

const ART_3D = 'C:\\Users\\LWRSH\\.gemini\\antigravity\\brain\\4a62da68-d7fa-4b28-b405-b152d9a3711b\\bg_3d_magic_bowl_1795793692499.jpg';
const ART_EDITORIAL = 'C:\\Users\\LWRSH\\.gemini\\antigravity\\brain\\4a62da68-d7fa-4b28-b405-b152d9a3711b\\bg_editorial_feast_seamless_1795793711524.jpg';

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

function toDataUri(filePath, mime) {
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

const iconUri = toDataUri(ICON_PATH, 'image/png');

function buildBanner({ bgPath, outPath, cropAlignY = 0.55 }) {
  // Crop the 16:9 artwork cleanly to EXACT 1024x500 via ffmpeg Lanczos first so proportions & framing are pixel-exact!
  const tmpCrop = outPath.replace(/\.png$/i, '.bg_tmp.jpg');
  // Source is 16:9 (e.g. 1376x768 -> scale width=1024 -> height~572 -> crop h=500 anchored at cropAlignY)
  const r = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-i', bgPath,
      '-vf', `scale=1024:-2:flags=lanczos,crop=1024:500:0:(ih-500)*${cropAlignY}`,
      '-q:v', '2',
      '-frames:v', '1',
      tmpCrop,
    ],
    { stdio: 'pipe' }
  );
  if (r.status !== 0) {
    throw new Error(`ffmpeg crop failed: ${r.stderr.toString()}`);
  }

  const bgUri = toDataUri(tmpCrop, 'image/jpeg');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs>
      <!-- Subtle soft dark-olive left scrim so crisp white editorial typography pops effortlessly -->
      <linearGradient id="leftScrim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1E2513" stop-opacity="0.72"/>
        <stop offset="44%" stop-color="#273019" stop-opacity="0.45"/>
        <stop offset="68%" stop-color="#273019" stop-opacity="0.0"/>
      </linearGradient>
      <clipPath id="clipIcon"><rect x="58" y="54" width="64" height="64" rx="16"/></clipPath>
    </defs>

    <!-- Full-bleed exact 1024x500 studio artwork -->
    <image href="${bgUri}" x="0" y="0" width="1024" height="500" preserveAspectRatio="xMidYMid slice"/>
    <!-- Seamless editorial vignette for ultra-clean left readability -->
    <rect x="0" y="0" width="1024" height="500" fill="url(#leftScrim)"/>

    <!-- ══ TOP BRAND ROW: MAMA ICON + WORDMARK + GOLD BADGE ══ -->
    <rect x="57" y="56" width="66" height="66" rx="17" fill="#000000" fill-opacity="0.32"/>
    <image href="${iconUri}" x="58" y="54" width="64" height="64" clip-path="url(#clipIcon)" preserveAspectRatio="xMidYMid slice"/>
    <rect x="58" y="54" width="64" height="64" rx="16" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="1.5"/>

    <text x="138" y="83" font-family="Georgia" font-size="30" font-weight="700" fill="#FAF7F1">Mama Dish</text>
    <rect x="138" y="95" width="212" height="24" rx="12" fill="#F2C14E" fill-opacity="0.18" stroke="#F2C14E" stroke-opacity="0.45" stroke-width="1.2"/>
    <text x="244" y="111.5" text-anchor="middle" font-family="Segoe UI" font-size="11.5" font-weight="700" letter-spacing="1.0" fill="#F8D678">10-SECOND MEAL DECIDER</text>

    <!-- ══ HERO EDITORIAL HEADLINE ══ -->
    <text x="58" y="214" font-family="Georgia" font-size="54" font-weight="700" fill="#FFFFFF">What to eat,</text>
    <text x="58" y="278" font-family="Georgia" font-size="54" font-weight="700" fill="#FFFFFF">decided in <tspan fill="#F4C95D">10s.</tspan></text>

    <!-- ══ CLEAN SUBCOPY ══ -->
    <text x="58" y="332" font-family="Segoe UI" font-size="20.5" font-weight="400" fill="#E6E4DA">Breakfast, lunch &amp; dinner matched to</text>
    <text x="58" y="360" font-family="Segoe UI" font-size="20.5" font-weight="400" fill="#E6E4DA">your taste, budget, and pantry.</text>

    <!-- ══ 3 FROSTED GLASS FEATURE PILLS ══ -->
    <g transform="translate(58, 398)">
      <rect x="0" y="0" width="144" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="1.2"/>
      <circle cx="20" cy="19" r="4.5" fill="#F4C95D"/>
      <text x="34" y="24" font-family="Segoe UI" font-size="14" font-weight="700" fill="#FAF7F1">Shake to Roll</text>

      <rect x="156" y="0" width="124" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="1.2"/>
      <circle cx="176" cy="19" r="4.5" fill="#A3C46C"/>
      <text x="190" y="24" font-family="Segoe UI" font-size="14" font-weight="700" fill="#FAF7F1">Your Taste</text>

      <rect x="292" y="0" width="132" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.26" stroke-width="1.2"/>
      <circle cx="312" cy="19" r="4.5" fill="#F4C95D"/>
      <text x="326" y="24" font-family="Segoe UI" font-size="14" font-weight="700" fill="#FAF7F1">Your Pantry</text>
    </g>
  </svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1024 },
    font: RESVG_FONTS,
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
  fs.unlinkSync(tmpCrop);
  console.log(`Exported ${path.basename(outPath)} -> 1024x500 (${(png.length / 1024).toFixed(1)} KB)`);
}

buildBanner({
  bgPath: ART_3D,
  outPath: path.join(OUT_DIR, 'feature-graphic-3d-1024x500.png'),
  cropAlignY: 0.56,
});

buildBanner({
  bgPath: ART_EDITORIAL,
  outPath: path.join(OUT_DIR, 'feature-graphic-editorial-1024x500.png'),
  cropAlignY: 0.72,
});

// Keep default filename pointing to the 3D Showstopper
fs.copyFileSync(
  path.join(OUT_DIR, 'feature-graphic-3d-1024x500.png'),
  path.join(OUT_DIR, 'feature-graphic-1024x500.png')
);
