import sharp from "sharp";
import fs from "fs";
import path from "path";

// 1. SVG Master dengan Rasio 1:1 Sempurna (512x512)
// Berisi Pin Emas Kareba'Ta dengan gradasi tajam + Teks Kareba'Ta dalam Poppins Black asli + Slogan
// SVG Master Kareba'Ta: Pin Emas Lokasi dengan Huruf K Putih Bersih di Dalamnya
// Didesain presisi untuk Safe Zone PWA (80%) agar tidak terpotong pada Android, iOS, maupun WebAPK Splash Screen
const svgEmblem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pinGradMaster" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFB703" />
      <stop offset="50%" stop-color="#E5A000" />
      <stop offset="100%" stop-color="#D48B00" />
    </linearGradient>
    <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#D48B00" flood-opacity="0.30" />
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background Putih Bersih 100% -->
  <rect width="512" height="512" fill="#ffffff" />

  <!-- Pin Ikon KarebaTa Berada di Atas-Tengah -->
  <g transform="translate(181, 65) scale(1.9)" filter="url(#crispShadow)">
    <path
      d="M 40 95 C 37 87 8 56 8 37 A 32 32 0 1 1 72 37 C 72 56 43 87 40 95 Z"
      fill="url(#pinGradMaster)"
    />
    <path
      d="M 24 20 H 33 V 35.6 L 47.8 20 H 59 L 40.6 38 L 59.8 57 H 48.6 L 33 40.8 V 57 H 24 V 20 Z"
      fill="#ffffff"
    />
  </g>

  <!-- Teks Brand: Kareba'Ta (Kareba Hijau Tua, Ta Kuning Emas) -->
  <text x="256" y="330" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-weight="900" font-size="62" letter-spacing="-1">
    <tspan fill="#00632B">Kareba&apos;</tspan><tspan fill="#E5A000">Ta</tspan>
  </text>

  <!-- Slogan Resmi: BERITAMU, SUARAMU -->
  <text x="256" y="367" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-weight="800" font-size="19" fill="#E5A000" letter-spacing="3.5">
    BERITAMU, SUARAMU
  </text>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Simpan logo.svg (1:1 square 512x512)
  const logoSvgPath = path.join(publicDir, "logo.svg");
  fs.writeFileSync(logoSvgPath, svgEmblem, "utf-8");
  console.log("Wrote:", logoSvgPath);

  const emblemBuffer = Buffer.from(svgEmblem);

  // 2. Buat pwa-192x192.png (High Quality Lanczos3)
  await sharp(emblemBuffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-192x192.png"));
  console.log("Generated: pwa-192x192.png");

  // 3. Buat pwa-512x512.png (High Quality 512x512)
  await sharp(emblemBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-512x512.png"));
  console.log("Generated: pwa-512x512.png");

  // 4. Buat pwa-maskable-512x512.png (Khusus Android Adaptive Icon Safe Zone)
  await sharp(emblemBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-maskable-512x512.png"));
  console.log("Generated: pwa-maskable-512x512.png");

  // 5. Buat apple-touch-icon.png (180x180 iOS Retina)
  await sharp(emblemBuffer)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated: apple-touch-icon.png");

  console.log("All PWA icons generated successfully with crystal clear resolution!");
}

main().catch(console.error);
