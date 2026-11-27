import React, { useState } from "react";
import { Gift, Copy, Check, ExternalLink, X, Heart, Smartphone, QrCode, Building2 } from "lucide-react";
import { FeedItem, GiftNominalOption, DEFAULT_GIFT_NOMINALS } from "../types";

interface RewardGiftModalProps {
  post: FeedItem;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  nominalOptions?: GiftNominalOption[];
  minLikes?: number;
}

export const RewardGiftModal: React.FC<RewardGiftModalProps> = ({
  post,
  isOpen,
  onClose,
  onShowToast,
  nominalOptions = DEFAULT_GIFT_NOMINALS,
  minLikes = 500,
}) => {
  const activeNominals = nominalOptions && nominalOptions.length > 0 ? nominalOptions : DEFAULT_GIFT_NOMINALS;
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedNominal, setSelectedNominal] = useState<number>(() => {
    return activeNominals[0]?.value || 5000;
  });

  if (!isOpen || !post) return null;

  const bankName = post.bankName?.trim() || "Bank BRI (Bank Rakyat Indonesia)";
  const bankNumber = post.bankAccountNumber?.trim() || "";
  const bankOwner = post.bankAccountName?.trim() || post.name || post.user || "Warga Kareba";

  const danaNumber = post.danaNumber?.trim() || "";
  const danaOwner = post.danaName?.trim() || post.name || post.user || "Warga Kareba";

  const qrisUrl = post.qrisUrl?.trim() || "";

  const hasBank = Boolean(bankNumber);
  const hasDana = Boolean(danaNumber);
  const hasQris = Boolean(qrisUrl);

  // Tab awal otomatis sesuai metode yang dipilih kreator atau yang tersedia
  const [activeTab, setActiveTab] = useState<"bank" | "dana" | "qris">(() => {
    if (post.payoutMethod === "bank" && hasBank) return "bank";
    if (post.payoutMethod === "dana" && hasDana) return "dana";
    if (post.payoutMethod === "qris" && hasQris) return "qris";
    if (hasBank) return "bank";
    if (hasDana) return "dana";
    if (hasQris) return "qris";
    return "bank";
  });

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    if (onShowToast) onShowToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleOpenDanaApp = () => {
    if (!danaNumber) return;
    // Buka aplikasi DANA di HP secara cerdas
    const danaAppUrl = `dana://`;
    window.location.href = danaAppUrl;
    // Cadangan: Salin nomor secara otomatis
    navigator.clipboard.writeText(danaNumber);
    if (onShowToast) onShowToast("Nomor DANA disalin & membuka aplikasi DANA...");
  };

  const availableMethodsCount = (hasBank ? 1 : 0) + (hasDana ? 1 : 0) + (hasQris ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] mx-auto box-border bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-4 sm:p-5 text-slate-950 flex items-center flex-wrap justify-between gap-2 relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/40 shrink-0">
              <Gift className="w-5 h-5 text-slate-950 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  Beri Pa'bere Apresiasi
                </h3>
                <span className="text-[10px] bg-slate-950 text-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  &ge; {minLikes} Suka
                </span>
              </div>
              <p className="text-[11px] text-slate-900/90 font-medium truncate mt-0.5">
                Untuk @{post.user} ({bankOwner || danaOwner})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-neutral-100">
          {/* Kutipan Berita Singkat */}
          <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>Postingan Viral & Populer</span>
                <span className="text-[10px] text-amber-400 font-normal">
                  ({(post.like || 0).toLocaleString("id-ID")} Suka)
                </span>
              </p>
              <p className="text-[11px] text-amber-100/90 line-clamp-2 mt-0.5 leading-relaxed">
                "{post.text}"
              </p>
            </div>
          </div>

          {/* Pilihan Nominal Pa'bere */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-2">
              Pilih Rencana Nominal Pa'bere:
            </label>
            <div className="flex flex-wrap gap-2">
              {activeNominals.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedNominal(opt.value)}
                  className={`flex-1 min-w-[125px] box-border p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedNominal === opt.value
                      ? "border-emerald-500 bg-emerald-950/50 shadow-xs ring-1 ring-emerald-500"
                      : "border-neutral-800 hover:border-neutral-700 bg-neutral-900"
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-100">{opt.label}</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Pilihan Saluran Pembayaran (Jika kreator punya lebih dari 1 metode) */}
          {availableMethodsCount > 1 && (
            <div className="flex flex-wrap rounded-xl bg-neutral-900 border border-neutral-800 p-1 gap-1 box-border">
              {hasBank && (
                <button
                  type="button"
                  onClick={() => setActiveTab("bank")}
                  className={`flex-1 min-w-[96px] py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "bank"
                      ? "bg-neutral-800 text-emerald-400 shadow-xs ring-1 ring-emerald-500/40"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Rekening Bank</span>
                </button>
              )}

              {hasDana && (
                <button
                  type="button"
                  onClick={() => setActiveTab("dana")}
                  className={`flex-1 min-w-[80px] py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "dana"
                      ? "bg-neutral-800 text-sky-400 shadow-xs ring-1 ring-sky-500/40"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#118EEA] shrink-0" />
                  <span>DANA</span>
                </button>
              )}

              {hasQris && (
                <button
                  type="button"
                  onClick={() => setActiveTab("qris")}
                  className={`flex-1 min-w-[80px] py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "qris"
                      ? "bg-neutral-800 text-amber-400 shadow-xs ring-1 ring-amber-500/40"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>QRIS</span>
                </button>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: REKENING BANK */}
          {/* ============================================================== */}
          {activeTab === "bank" && (
            <div className="bg-gradient-to-br from-emerald-950/50 via-neutral-900 to-neutral-950 border border-emerald-800/60 rounded-2xl p-4 space-y-3.5 animate-fade-in">
              <div className="flex items-center flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-emerald-300 block break-words">
                      {bankName}
                    </span>
                    <span className="text-xs font-bold text-neutral-100 break-words">
                      a.n. {bankOwner}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60 shrink-0">
                  Rekening Resmi
                </span>
              </div>

              {bankNumber ? (
                <>
                  {/* Kotak Nomor Rekening yang siap disalin */}
                  <div className="bg-black border-2 border-dashed border-emerald-500/50 rounded-xl p-3 flex items-center flex-wrap justify-between gap-2 shadow-2xs">
                    <div className="min-w-[140px] flex-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                        Nomor Rekening:
                      </span>
                      <span className="text-base sm:text-lg font-black font-mono tracking-wider text-neutral-100 select-all break-all">
                        {bankNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(bankNumber, "Nomor Rekening")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
                        copiedText === "Nomor Rekening"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/60"
                      }`}
                    >
                      {copiedText === "Nomor Rekening" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === "Nomor Rekening" ? "Tersalin!" : "Salin Rekening"}</span>
                    </button>
                  </div>

                  {/* Panduan Transfer Rekening Bank */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 space-y-1.5 text-left text-xs">
                    <p className="font-bold text-emerald-300 flex items-center gap-1">
                      <span>Cara Transfer via m-Banking / ATM:</span>
                    </p>
                    <ol className="text-[11px] text-neutral-300 list-decimal list-inside space-y-1 leading-relaxed pl-1">
                      <li>Tekan <b>"Salin Rekening"</b> di atas.</li>
                      <li>Buka m-Banking Anda (<b>BRImo, BCA, Mandiri, BNI, BSI</b>) atau ATM.</li>
                      <li>Pilih menu <b>Transfer</b> &rarr; pilih <b>{bankName.split(" ")[0] || "Bank"}</b> &rarr; tempel nomor rekening.</li>
                      <li>Masukkan nominal {selectedNominal ? `Rp ${selectedNominal.toLocaleString("id-ID")}` : "apresiasi"} & selesaikan transfer.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-300">
                    Pengunggah belum memasang nomor rekening bank
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Pengunggah kabar dapat memasukkan nomor rekening bank di menu profil akun agar hadiah dari warga bisa langsung masuk.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DANA */}
          {/* ============================================================== */}
          {activeTab === "dana" && (
            <div className="bg-gradient-to-br from-sky-950/50 via-neutral-900 to-neutral-950 border border-sky-800/60 rounded-2xl p-4 space-y-3 animate-fade-in">
              <div className="flex items-center flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#118EEA] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                    D
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-sky-400 block">
                      Akun DANA Pembuat Berita:
                    </span>
                    <span className="text-xs font-bold text-neutral-100 break-words">
                      a.n. {danaOwner}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full shrink-0">
                  Resmi
                </span>
              </div>

              {danaNumber ? (
                <>
                  {/* Kotak Nomor DANA yang siap disalin */}
                  <div className="bg-black border-2 border-dashed border-[#118EEA]/50 rounded-xl p-3 flex items-center flex-wrap justify-between gap-2 shadow-2xs">
                    <div className="min-w-[140px] flex-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                        Nomor HP DANA:
                      </span>
                      <span className="text-base sm:text-lg font-black font-mono tracking-wider text-neutral-100 select-all break-all">
                        {danaNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(danaNumber, "Nomor DANA")}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
                        copiedText === "Nomor DANA"
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                      }`}
                    >
                      {copiedText === "Nomor DANA" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === "Nomor DANA" ? "Tersalin!" : "Salin"}</span>
                    </button>
                  </div>

                  {/* Tombol Buka Aplikasi DANA */}
                  <button
                    type="button"
                    onClick={handleOpenDanaApp}
                    className="w-full py-3 px-4 bg-[#118EEA] hover:bg-[#0c7acb] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex flex-wrap items-center justify-center gap-2 text-center shadow-md shadow-[#118EEA]/20 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>Kirim {selectedNominal.toLocaleString("id-ID")} via Aplikasi DANA</span>
                  </button>
                  <p className="text-[10px] text-center text-neutral-400 leading-tight">
                    *Membuka aplikasi DANA di HP Anda. Nomor otomatis disalin ke papan klip.
                  </p>

                  {/* Panduan Praktis Kirim dari Rekening Bank (BRI, BCA, Mandiri, BNI) */}
                  <div className="bg-neutral-900 border border-sky-800/50 rounded-2xl p-3 space-y-1.5 text-left">
                    <p className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#118EEA] shrink-0" />
                      <span>Uang Anda ada di Rekening Bank (Bukan DANA)?</span>
                    </p>
                    <p className="text-[10.5px] text-neutral-300 leading-relaxed">
                      Bisa langsung kirim dari m-Banking Anda (<b>BRImo, BCA Mobile, Livin Mandiri, BNI Mobile, BSI</b>):
                    </p>
                    <ol className="text-[10.5px] text-neutral-300 list-decimal list-inside space-y-0.5 leading-relaxed pl-1">
                      <li>Klik tombol <b>"Salin"</b> nomor DANA di atas.</li>
                      <li>Buka m-Banking Anda &rarr; pilih menu <b>Top Up / Dompet Digital &rarr; DANA</b>.</li>
                      <li>Tempel nomor HP tersebut dan masukkan nominal yang ingin dikirimkan.</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-300">
                    Pengunggah belum memasang nomor DANA di profil
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Pengunggah berita dapat mengatur nomor DANA miliknya di menu profil akun agar hadiah dari warga dan admin bisa langsung cair.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: QRIS BARCODE */}
          {/* ============================================================== */}
          {activeTab === "qris" && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 animate-fade-in">
              <p className="text-xs font-bold text-neutral-200">
                Scan Barcode QRIS Warga:
              </p>
              {qrisUrl ? (
                <>
                  <div className="w-full max-w-[208px] aspect-square bg-white p-2 border border-neutral-300 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src={qrisUrl}
                      alt="QRIS Hadiah Warga"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed max-w-xs">
                    Dapat di-scan memakai m-Banking apa saja (<b>BRImo, BCA Mobile, Livin Mandiri, BNI, ShopeePay, DANA, GoPay</b>).
                  </p>
                </>
              ) : (
                <div className="bg-amber-950/50 border border-amber-700/50 rounded-xl p-3 text-center space-y-1 w-full">
                  <p className="text-xs font-bold text-amber-300">
                    Pengunggah belum mengunggah gambar QRIS
                  </p>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    Pengunggah berita dapat menambahkan link barcode QRIS miliknya di menu profil akun.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Catatan Komunitas Bersih */}
          <div className="flex items-center gap-2 text-[10px] text-neutral-400 justify-center pt-1">
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
            <span>100% hadiah diterima utuh oleh pembuat berita tanpa potongan.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
