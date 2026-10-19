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
    <filter id="crispShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#D48B00" flood-opacity="0.36" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.10" />
    </filter>
  </defs>

  <!-- Background Putih Bersih 100% -->
  <rect width="512" height="512" fill="#ffffff" rx="0" />

  <!-- Pin Ikon Kareba'Ta Berada di Tengah Sempurna (Center 256, 256) -->
  <g transform="translate(131, 76) scale(2.5)" filter="url(#crispShadow)">
    <!-- Pin Lokasi Keemasan -->
    <path
      d="M 50 118 C 47 108 10 70 10 46 A 40 40 0 1 1 90 46 C 90 70 53 108 50 118 Z"
      fill="url(#pinGradMaster)"
    />
    <!-- Huruf K Putih Bersih Tebal Berpresisi Tinggi -->
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
