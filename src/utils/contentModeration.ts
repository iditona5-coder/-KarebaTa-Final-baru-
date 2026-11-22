/**
 * Modul Moderasi Konten Kareba'Ta (100% Gratis - Tanpa AI Berbayar)
 * 
 * Bertugas memfilter kata jorok, cabul, pornografi, ajakan transaksi asusila (VCS, Open BO),
 * kata makian kasar, serta kata-kata kotor lokal (Bahasa Indonesia & Bahasa Daerah Bugis/Makassar).
 */

// Daftar kata terlarang dasar (dalam huruf kecil)
const FORBIDDEN_WORDS = [
  // 1. Pornografi & Asusila (Organ & Tindakan)
  "kontol",
  "kntl",
  "memek",
  "mmk",
  "ngentot",
  "ngentod",
  "kentot",
  "entot",
  "totit",
  "jembut",
  "bokep",
  "bkp",
  "bugil",
  "telanjang",
  "toket",
  "tetek",
  "pepek",
  "itil",
  "coli",
  "colmek",
  "masturbasi",
  "porno",
  "pornografi",
  "porn",
  "sange",
  "sagne",
  "horny",
  "lonte",
  "lonthe",
  "pelacur",
  "jablay",
  "binal",
  "desah",
  "desahan",
  "selangkangan",
  "bispak",
  "bisyar",
  "ngaceng",
  "crot",
  "sperma",
  "ejakulasi",
  "striptis",
  "stripper",
  "kondom",
  "fetish",

  // 2. Transaksi Asusila & Ajakan Sensual Liar
  "open bo",
  "openbo",
  "vcs",
  "vcsan",
  "vcs murah",
  "video colmek",
  "video bokep",
  "foto bugil",
  "video bugil",
  "goyang erotis",
  "tarian erotis",
  "pamer toket",
  "pamer tetek",
  "remas toket",
  "julur lidah sensual",
  "julur lidah mesum",

  // 3. Makian Kasar / Kata Kotor Bahasa Indonesia
  "anjing",
  "anjir",
  "babi",
  "bangsat",
  "bajingan",
  "kampret",
  "pantek",
  "pukimak",
  "puki",
  "asu",
  "cukimai",
  "sundal",
  "kunyuk",
  "mampus",
  "goblok",
  "tolol",
  "idiot",
  "bego",
  "tai",
  "taek",

  // 4. Makian Kasar Daerah (Sulawesi Selatan: Bugis/Makassar)
  "telaso",
  "telasoe",
  "tlso",
  "laso",
  "combi",
  "lessi",
  "sundala",
  "sundala'",
  "sndla",
  "kongkong",
];

// Peta pengganti leetspeak (angka atau simbol menyerupai huruf)
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "@": "a",
  "$": "s",
  "!": "i",
};

/**
 * Normalisasi teks untuk mendeteksi penyamaran kata (leetspeak, angka pengganti huruf)
 * sambil menjaga tanda baca akhir kalimat (mis. "Kareba'Ta!") dan angka murni (mis. nomor HP/tanggal)
 * agar tidak memicu salah deteksi.
 */
function normalizeText(input: string): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .split(/(\s+)/)
    .map((segment) => {
      if (/^\s+$/.test(segment)) return segment;

      // Pisahkan tanda baca di awal & akhir kata (misal "Kareba'Ta!" -> core="kareba'ta", trail="!")
      const match = segment.match(/^([^a-z0-9@$_'-]*)(.*?)([!?.:,;"')\]}]*)$/i);
      const lead = match?.[1] || "";
      const core = match?.[2] || segment;
      const trail = match?.[3] || "";

      // Jangan ubah angka murni (nomor HP, tanggal, harga) menjadi huruf leetspeak
      if (!/[a-z]/i.test(core)) {
        return segment;
      }

      let converted = core;
      for (const [leet, char] of Object.entries(LEET_MAP)) {
        converted = converted.replaceAll(leet, char);
      }
      return `${lead}${converted}${trail}`;
    })
    .join("");
}

export interface ModerationResult {
  isClean: boolean;
  flaggedWord?: string;
  reason?: string;
}

/**
 * Memeriksa teks terhadap kata-kata jorok, porno, vulgar, dan asusila.
 * Bekerja 100% di browser / lokal tanpa kuota dan tanpa biaya AI.
 */
export function checkContentModeration(rawText: string): ModerationResult {
  if (!rawText || !rawText.trim()) {
    return { isClean: true };
  }

  const rawLower = rawText.toLowerCase();
  const normalized = normalizeText(rawText);

  for (const word of FORBIDDEN_WORDS) {
    const wordPattern = word.toLowerCase();
    const repeatedPattern = wordPattern
      .split("")
      .map((ch) => (/[a-z0-9]/.test(ch) ? `${escapeRegExp(ch)}+` : ch === " " ? "\\s+" : escapeRegExp(ch)))
      .join("");

    // 1. Cek kata utuh dengan batas non-alfanumerik & non-apostrof agar kata berapostrof (misal "Kareba'Ta" / "Kareba’Ta")
    // tidak terpecah menjadi dua kata terpisah
    const regexWord = new RegExp(`(?<![a-z0-9'’‘])${repeatedPattern}(?![a-z0-9'’‘])`, "i");
    if (regexWord.test(rawLower) || regexWord.test(normalized)) {
      return {
        isClean: false,
        flaggedWord: word,
        reason: getReasonForWord(word),
      };
    }

    // 2. Cek penyamaran huruf berjeda tanda baca/spasi (contoh: "a.s.u", "c.o.m.b.i", "l.e.s.s.i")
    const cleanChars = wordPattern.replace(/[^a-z0-9]/g, "").split("");
    if (cleanChars.length >= 3) {
      const obfuscatedPattern = cleanChars.map((c) => `${escapeRegExp(c)}+`).join("[\\s._*\\-]+");
      const regexObfuscated = new RegExp(`(?<![a-z0-9'’‘])${obfuscatedPattern}(?![a-z0-9'’‘])`, "i");
      if (regexObfuscated.test(rawLower) || regexObfuscated.test(normalized)) {
        return {
          isClean: false,
          flaggedWord: word,
          reason: getReasonForWord(word),
        };
      }
    }
  }

  return { isClean: true };
}

/**
 * Memberikan keterangan alasan yang sopan dan ramah untuk ditampilkan ke pengguna
 */
function getReasonForWord(word: string): string {
  const asusilaKeywords = [
    "kontol", "memek", "ngentot", "bokep", "bugil", "toket", "tetek",
    "pepek", "itil", "coli", "colmek", "porno", "sange", "open bo",
    "vcs", "lonte", "jablay", "crot", "erotis", "sensual", "telanjang"
  ];

  const isAsusila = asusilaKeywords.some((k) => word.includes(k));
  if (isAsusila) {
    return "Konten mengandung unsur asusila, pornografi, atau kata tidak senonoh yang dilarang di Kareba'Ta.";
  }

  return "Konten mengandung kata kasar atau makian yang melanggar pedoman etika kesantunan warga.";
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Masking kata-kata jorok dengan karakter bintang (*)
 */
export function maskBadWords(text: string): string {
  if (!text) return "";
  let result = text;
  for (const word of FORBIDDEN_WORDS) {
    const reg = new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi");
    result = result.replace(reg, (match) => "*".repeat(match.length));
  }
  return result;
}
