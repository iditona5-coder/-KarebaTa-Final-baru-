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
 * Normalisasi teks untuk mendeteksi penyamaran kata (leetspeak, spasi/titik antar huruf)
 */
function normalizeText(input: string): string {
  if (!input) return "";

  let cleaned = input.toLowerCase();

  // Ubah leet char ke huruf biasa
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    cleaned = cleaned.replaceAll(leet, char);
  }

  return cleaned;
}

/**
 * Buat versi teks tanpa spasi dan tanda baca untuk mendeteksi penyamaran seperti "k.o.n.t.o.l" atau "b o k e p"
 */
function stripSeparators(input: string): string {
  return input.replace(/[^a-z0-9]/g, "");
}

/**
 * Kompres huruf yang berulang lebih dari 2 kali (misal "booooookeeep" -> "bookeep")
 */
function collapseRepeatedChars(input: string): string {
  return input.replace(/(.)\1{2,}/g, "$1$1");
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
  const collapsed = collapseRepeatedChars(normalized);
  const noSeparators = stripSeparators(collapsed);

  for (const word of FORBIDDEN_WORDS) {
    const wordPattern = word.toLowerCase();

    // 1. Cek langsung dengan boundary kata (misal di kalimat utuh)
    const regexWord = new RegExp(`\\b${escapeRegExp(wordPattern)}\\b`, "i");
    if (regexWord.test(rawLower) || regexWord.test(normalized) || regexWord.test(collapsed)) {
      return {
        isClean: false,
        flaggedWord: word,
        reason: getReasonForWord(word),
      };
    }

    // 2. Cek apakah ada di dalam teks tanpa spasi/tanda baca (contoh: "b.o.k.e.p", "v-c-s", "open_bo")
    // Hanya untuk kata dengan panjang >= 3 agar tidak salah tangkap (false positive) kata pendek wajar
    if (wordPattern.length >= 3) {
      const cleanWord = stripSeparators(wordPattern);
      if (cleanWord.length >= 3 && noSeparators.includes(cleanWord)) {
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
