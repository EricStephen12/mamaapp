/**
 * Reusable 4-second Stickman Episode Validator:
 *  1. Renders 16 evenly-spaced keyframes into a 4x4 JPEG storyboard.
 *  2. Smoke-tests the final 90 frames at full 1080px width to catch any resvg geometry panics.
 *  3. Mixes the full episode audio (.m4a) so you can audition it with read_file before rendering.
 *
 * Usage:
 *   node .agents/skills/stickman-comedy-studio/scripts/preview_episode.js promo-videos/stickman-studio/<episode>.js [outJpgPath]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const epArg = process.argv[2];
if (!epArg) {
  console.error('Usage: node preview_episode.js <episode_script.js> [out_contact_sheet.jpg]');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '../../../..');
const { Resvg } = require(path.join(repoRoot, 'node_modules/@resvg/resvg-js'));
const { mixEpisodeAudio } = require(path.join(repoRoot, 'promo-videos/stickman-studio/audioMixer'));

const epPath = path.resolve(repoRoot, epArg);
const ep = require(epPath);
const { renderFrame, FPS, TOTAL_FRAMES, AUDIO_PLAN, AUDIO_MIX } = ep;

if (typeof renderFrame !== 'function' || !TOTAL_FRAMES) {
  console.error('Episode script must export { renderFrame, FPS, TOTAL_FRAMES, AUDIO_PLAN, AUDIO_MIX }.');
  process.exit(1);
}

const slug = path.basename(epPath, '.js');
const tmpDir = path.join(repoRoot, 'promo-videos/stickman-studio/out', `_preview_${slug}`);
fs.mkdirSync(tmpDir, { recursive: true });
const outJpg = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(repoRoot, 'promo-videos/stickman-studio/out', `${slug}_keycheck.jpg`);

const fontOpts = {
  fontFiles: [
    'C:\\Windows\\Fonts\\segoeuib.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\georgia.ttf',
  ],
  loadSystemFonts: false,
  defaultFontFamily: 'Segoe UI',
};

// 1. Render 16 evenly-spaced key frames (from 4% to 97% of video)
for (let i = 0; i < 16; i++) {
  const frac = 0.04 + (i / 15) * 0.93;
  const f = Math.min(TOTAL_FRAMES - 1, Math.round(frac * TOTAL_FRAMES));
  const svg = renderFrame(f);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 270 }, font: fontOpts }).render().asPng();
  fs.writeFileSync(path.join(tmpDir, `k_${String(i).padStart(2, '0')}.png`), png);
}

execFileSync('ffmpeg', [
  '-y',
  '-i', path.join(tmpDir, 'k_%02d.png'),
  '-vf', 'tile=4x4',
  '-frames:v', '1',
  outJpg,
  '-loglevel', 'error',
]);
console.log(`1/3 Preview 4x4 storyboard saved -> ${outJpg}`);

// 2. Smoke-test final 90 frames at full width to catch any resvg off-screen opacity clip panic
const startCheck = Math.max(0, TOTAL_FRAMES - 90);
for (let f = startCheck; f < TOTAL_FRAMES; f++) {
  new Resvg(renderFrame(f), { fitTo: { mode: 'width', value: 1080 }, font: { loadSystemFonts: false } }).render();
}
console.log(`2/3 Finale resvg smoke-test PASS (frames ${startCheck}..${TOTAL_FRAMES - 1})`);

// 3. Mix audio track for immediate audition
if (AUDIO_PLAN && AUDIO_MIX) {
  mixEpisodeAudio({ ...AUDIO_PLAN, outPath: AUDIO_MIX })
    .then(() => console.log(`3/3 Audio mix ready for audition -> ${AUDIO_MIX}`))
    .catch((err) => {
      console.error('Audio mix failed:', err);
      process.exit(1);
    });
}

