import sharp from "sharp";
import fs from "fs";
import path from "path";

// 1. SVG Master dengan Rasio 1:1 Sempurna (512x512)
// Berisi Pin Emas Kareba'Ta dengan gradasi tajam + Teks Kareba'Ta dalam Poppins Black asli + Slogan
const svgFullBrand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFB300" />
      <stop offset="100%" stop-color="#E59400" />
    </linearGradient>
    <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#E59400" flood-opacity="0.32" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Background Putih Bersih Full-Bleed 1:1 -->
  <rect width="512" height="512" fill="#ffffff" />

  <!-- Grup Logo di Tengah Sempurna (Safe Zone 80%) -->
  <g id="karebata-logo-centered">
    <!-- Pin Icon Kareba'Ta: Ditempatkan tepat di tengah horizontal x=256 -->
    <g transform="translate(176, 68) scale(1.6)" filter="url(#subtleShadow)">
      <!-- Bentuk Pin Lokasi Warna Kuning Keemasan -->
      <path
        d="M 50 118 C 47 108 10 70 10 46 A 40 40 0 1 1 90 46 C 90 70 53 108 50 118 Z"
        fill="url(#pinGrad)"
      />
      <!-- Huruf K Tebal Putih Bersih di Dalam Pin -->
      <path
        d="M 30 25 H 41 V 44.5 L 59.5 25 H 73.5 L 50.5 47.5 L 74.5 71 H 60.5 L 41 51 V 71 H 30 V 25 Z"
        fill="#ffffff"
      />
    </g>

    <!-- Teks Kareba'Ta: Rata Tengah Sempurna (x=256) dengan Font Poppins Asli -->
    <text
      x="256"
      y="320"
      text-anchor="middle"
      font-family="Poppins"
      font-weight="900"
      font-size="52"
      letter-spacing="-0.03em"
    >
      <tspan fill="#00632B">Kareba'</tspan><tspan fill="#E5A000">Ta</tspan>
    </text>

    <!-- Slogan beritamu suaramu: Rata Tengah Sempurna di x=256 -->
    <text
      x="256"
      y="354"
      text-anchor="middle"
      font-family="Poppins"
      font-weight="800"
      font-size="14.5"
      fill="#E5A000"
      letter-spacing="0.16em"
    >
      BERITAMU, SUARAMU
    </text>
  </g>
</svg>`;

// 2. SVG Khusus Maskable Icon (Pin Simbol Utama Berukuran Besar & Kokoh di Safe Zone 80%)
const svgMaskablePin = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pinGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFB300" />
      <stop offset="100%" stop-color="#E59400" />
    </linearGradient>
    <filter id="shadowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#E59400" flood-opacity="0.35" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>
  <rect width="512" height="512" fill="#ffffff" />
  
  <g transform="translate(141, 98) scale(2.3)" filter="url(#shadowMask)">
    <path
      d="M 50 118 C 47 108 10 70 10 46 A 40 40 0 1 1 90 46 C 90 70 53 108 50 118 Z"
      fill="url(#pinGradMask)"
    />
    <path
      d="M 30 25 H 41 V 44.5 L 59.5 25 H 73.5 L 50.5 47.5 L 74.5 71 H 60.5 L 41 51 V 71 H 30 V 25 Z"
      fill="#ffffff"
    />
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Simpan logo.svg (1:1 square 512x512)
  const logoSvgPath = path.join(publicDir, "logo.svg");
  fs.writeFileSync(logoSvgPath, svgFullBrand, "utf-8");
  console.log("Wrote:", logoSvgPath);

  const fullBrandBuffer = Buffer.from(svgFullBrand);
  const maskableBuffer = Buffer.from(svgMaskablePin);

  // 2. Buat pwa-192x192.png (High Quality Lanczos3)
  await sharp(fullBrandBuffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-192x192.png"));
  console.log("Generated: pwa-192x192.png");

  // 3. Buat pwa-512x512.png (High Quality 512x512)
  await sharp(fullBrandBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-512x512.png"));
  console.log("Generated: pwa-512x512.png");

  // 4. Buat pwa-maskable-512x512.png (Khusus Android Adaptive Icon Safe Zone)
  await sharp(maskableBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-maskable-512x512.png"));
  console.log("Generated: pwa-maskable-512x512.png");

  // 5. Buat apple-touch-icon.png (180x180 iOS Retina)
  await sharp(fullBrandBuffer)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated: apple-touch-icon.png");

  console.log("All PWA icons generated successfully with crystal clear resolution!");
}

main().catch(console.error);
