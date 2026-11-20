const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const rawSvg = fs.readFileSync(path.join(__dirname, '../assets/Mama Kitchen — SVG logo.svg'), 'utf-8');

// Extract inner path elements from raw SVG
const innerPathsMatch = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
if (!innerPathsMatch) {
  console.error('Could not parse inner SVG content');
  process.exit(1);
}
const innerPaths = innerPathsMatch[1];

// Monochrome version of inner paths (all fills and strokes replaced with #000000)
const monochromeInnerPaths = innerPaths
  .replace(/stroke="#[A-Fa-f0-9]{3,6}"/g, 'stroke="#000000"')
  .replace(/fill="#[A-Fa-f0-9]{3,6}"/g, 'fill="#000000"');

function renderSvgToPng(svgString, width, height) {
  const resvg = new Resvg(svgString, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

// 1. icon.png (1024x1024) - Universal App Icon with #F8F5EF background
function generateUniversalIcon() {
  const size = 1024;
  const scale = 2.4;
  const svgW = 360 * scale;
  const svgH = 270 * scale;
  const tx = (size - svgW) / 2;
  const ty = (size - svgH) / 2;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#F8F5EF"/>
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      ${innerPaths}
    </g>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/icon.png'), png);
  console.log('✓ Generated assets/icon.png (1024x1024)');
}

// 2. android-icon-foreground.png (512x512) - Transparent background, fitted in Android safe circle
function generateAndroidForeground() {
  const size = 512;
  const scale = 1.05;
  const svgW = 360 * scale;
  const svgH = 270 * scale;
  const tx = (size - svgW) / 2;
  const ty = (size - svgH) / 2;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      ${innerPaths}
    </g>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/android-icon-foreground.png'), png);
  console.log('✓ Generated assets/android-icon-foreground.png (512x512)');
}

// 3. android-icon-background.png (512x512) - Solid #F8F5EF background
function generateAndroidBackground() {
  const size = 512;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#F8F5EF"/>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/android-icon-background.png'), png);
  console.log('✓ Generated assets/android-icon-background.png (512x512)');
}

// 4. android-icon-monochrome.png (512x512) - Transparent background, solid black silhouette for Material You
function generateAndroidMonochrome() {
  const size = 512;
  const scale = 1.05;
  const svgW = 360 * scale;
  const svgH = 270 * scale;
  const tx = (size - svgW) / 2;
  const ty = (size - svgH) / 2;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      ${monochromeInnerPaths}
    </g>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/android-icon-monochrome.png'), png);
  console.log('✓ Generated assets/android-icon-monochrome.png (512x512)');
}

// 5. splash-icon.png (1024x1024) - Transparent background, centered logo
function generateSplashIcon() {
  const size = 1024;
  const scale = 2.4;
  const svgW = 360 * scale;
  const svgH = 270 * scale;
  const tx = (size - svgW) / 2;
  const ty = (size - svgH) / 2;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      ${innerPaths}
    </g>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/splash-icon.png'), png);
  console.log('✓ Generated assets/splash-icon.png (1024x1024)');
}

// 6. favicon.png (48x48) - Web favicon
function generateFavicon() {
  const size = 48;
  const scale = 48 / 360;
  const svgW = 360 * scale;
  const svgH = 270 * scale;
  const tx = (size - svgW) / 2;
  const ty = (size - svgH) / 2;

  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#F8F5EF" rx="8"/>
    <g transform="translate(${tx}, ${ty}) scale(${scale})">
      ${innerPaths}
    </g>
  </svg>`;

  const png = renderSvgToPng(svg, size, size);
  fs.writeFileSync(path.join(__dirname, '../assets/favicon.png'), png);
  console.log('✓ Generated assets/favicon.png (48x48)');
}

generateUniversalIcon();
generateAndroidForeground();
generateAndroidBackground();
generateAndroidMonochrome();
generateSplashIcon();
generateFavicon();
console.log('All icons generated successfully from Mama Kitchen — SVG logo.svg!');

