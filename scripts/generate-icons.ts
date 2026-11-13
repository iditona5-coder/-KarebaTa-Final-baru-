import sharp from "sharp";
import fs from "fs";
import path from "path";

const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="pinGradMask" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFB703" />
      <stop offset="50%" stop-color="#E5A000" />
      <stop offset="100%" stop-color="#D48B00" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#ffffff" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <g transform="translate(180, 92) scale(1.9)">
      <path
        d="M 40 95 C 37 87 8 56 8 37 A 32 32 0 1 1 72 37 C 72 56 43 87 40 95 Z"
        fill="url(#pinGradMask)"
      />
      <path
        d="M 24 20 H 33 V 35.6 L 47.8 20 H 59 L 40.6 38 L 59.8 57 H 48.6 L 33 40.8 V 57 H 24 V 20 Z"
        fill="#ffffff"
      />
    </g>
    <text x="256" y="357" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-weight="900" font-size="62" letter-spacing="-1">
      <tspan fill="#00632B">Kareba&apos;</tspan><tspan fill="#E5A000">Ta</tspan>
    </text>
    <text x="256" y="394" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-weight="800" font-size="19" fill="#E5A000" letter-spacing="3.5">
      BERITAMU, SUARAMU
    </text>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const logoSvgPath = path.join(publicDir, "logo.svg");
  const emblemBuffer = fs.readFileSync(logoSvgPath);
  const maskableBuffer = Buffer.from(svgMaskable, "utf-8");

  await sharp(emblemBuffer)
    .resize(192, 192, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-192x192.png"));
  console.log("Generated: pwa-192x192.png");

  await sharp(emblemBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-512x512.png"));
  console.log("Generated: pwa-512x512.png");

  await sharp(maskableBuffer)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "pwa-maskable-512x512.png"));
  console.log("Generated: pwa-maskable-512x512.png");

  await sharp(emblemBuffer)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated: apple-touch-icon.png");

  await sharp(emblemBuffer)
    .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon.png"));

  await sharp(emblemBuffer)
    .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon.ico"));
  console.log("Generated: favicon.png & favicon.ico");
}

main().catch(console.error);
