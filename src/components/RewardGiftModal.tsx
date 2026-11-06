import React, { useState } from "react";
import { Gift, Copy, Check, ExternalLink, X, Heart, Sparkles, Smartphone, QrCode } from "lucide-react";
import { FeedItem } from "../types";

interface RewardGiftModalProps {
  post: FeedItem;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const RewardGiftModal: React.FC<RewardGiftModalProps> = ({
  post,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedNominal, setSelectedNominal] = useState<number>(5000);
  const [activeTab, setActiveTab] = useState<"dana" | "qris">("dana");

  if (!isOpen) return null;

  // Nomor DANA pembuat berita (fallback jika pembuat berita belum mengisi, beri panduan)
  const danaNumber = post.danaNumber?.trim() || "";
  const danaOwner = post.danaName?.trim() || post.name || post.user || "Warga Kareba";
  const qrisUrl = post.qrisUrl?.trim() || "";

  const nominalOptions = [
    { value: 2000, label: "Rp 2.000", desc: "☕ Traktir Kopi" },
    { value: 5000, label: "Rp 5.000", desc: "🥤 Traktir Es Teh" },
    { value: 10000, label: "Rp 10.000", desc: "🍜 Traktir Makan" },
    { value: 25000, label: "Rp 25.000", desc: "🌟 Apresiasi Hebat" },
  ];

  const handleCopy = () => {
    if (!danaNumber) return;
    navigator.clipboard.writeText(danaNumber);
    setCopied(true);
    if (onShowToast) onShowToast("Nomor DANA berhasil disalin!");
    setTimeout(() => setCopied(false), 2500);
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

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-4 sm:p-5 text-slate-950 flex items-center justify-between relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/40 shrink-0">
              <Gift className="w-5 h-5 text-slate-950 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                  Beri Hadiah Apresiasi
                </h3>
                <span className="text-[10px] bg-slate-950 text-amber-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  &ge; 500 Suka
                </span>
              </div>
              <p className="text-[11px] text-slate-900/90 font-medium truncate mt-0.5">
                Untuk @{post.user} ({danaOwner})
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-neutral-800">
          {/* Kutipan Berita Singkat */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <span>Postingan Viral & Populer</span>
                <span className="text-[10px] text-amber-700 font-normal">
                  ({(post.like || 0).toLocaleString("id-ID")} Suka)
                </span>
              </p>
              <p className="text-[11px] text-amber-900/90 line-clamp-2 mt-0.5 leading-relaxed">
                "{post.text}"
              </p>
            </div>
          </div>

          {/* Tab Pilihan Saluran Hadiah: DANA atau QRIS */}
          {qrisUrl && (
            <div className="flex rounded-xl bg-neutral-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("dana")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "dana"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#118EEA]" />
                <span>Kirim via DANA</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("qris")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "qris"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-amber-600" />
                <span>Scan Barcode QRIS</span>
              </button>
            </div>
          )}

          {/* Pilihan Nominal Apresiasi */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-2">
              Pilih Rencana Nominal Hadiah:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {nominalOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedNominal(opt.value)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedNominal === opt.value
                      ? "border-[#00632B] bg-emerald-50/70 shadow-xs ring-1 ring-[#00632B]"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-900">{opt.label}</span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {activeTab === "dana" ? (
            /* Bagian DANA */
            <div className="bg-gradient-to-br from-[#118EEA]/10 via-sky-50 to-white border border-[#118EEA]/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#118EEA] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    D
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#118EEA] block">
                      Akun DANA Pembuat Berita:
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      a.n. {danaOwner}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Resmi
                </span>
              </div>

              {danaNumber ? (
                <>
                  {/* Kotak Nomor DANA yang siap disalin */}
                  <div className="bg-white border-2 border-dashed border-[#118EEA]/40 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                        Nomor HP DANA:
                      </span>
                      <span className="text-base sm:text-lg font-black font-mono tracking-wider text-neutral-900 select-all">
                        {danaNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 ${
                        copied
                          ? "bg-emerald-600 text-white"
                          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Tersalin!" : "Salin"}</span>
                    </button>
                  </div>

                  {/* Tombol Buka Aplikasi DANA */}
                  <button
                    type="button"
                    onClick={handleOpenDanaApp}
                    className="w-full py-3 px-4 bg-[#118EEA] hover:bg-[#0c7acb] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#118EEA]/20 transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Kirim {selectedNominal.toLocaleString("id-ID")} via Aplikasi DANA</span>
                  </button>
                  <p className="text-[10px] text-center text-neutral-500 leading-tight">
                    *Membuka aplikasi DANA di HP Anda. Nomor pembuat berita otomatis disalin ke papan klip.
                  </p>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-900">
                    Pengunggah belum memasang nomor DANA di profil
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Pengunggah berita dapat mengatur nomor DANA miliknya di menu profil akun agar hadiah dari warga dan admin bisa langsung cair.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Bagian QRIS jika tersedia */
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
              <p className="text-xs font-bold text-neutral-800">
                Scan Barcode QRIS Warga:
              </p>
              <div className="w-48 h-48 bg-white p-2 border border-neutral-300 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={qrisUrl}
                  alt="QRIS Hadiah Warga"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-neutral-600">
                Dapat di-scan memakai m-Banking apa saja (BCA, BRI, Mandiri, BNI, ShopeePay, DANA).
              </p>
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
