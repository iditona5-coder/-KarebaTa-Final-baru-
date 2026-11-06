import React, { useState } from "react";
import { Smartphone, QrCode, Check, X, ShieldCheck, Sparkles } from "lucide-react";

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDanaNumber: string;
  currentDanaName: string;
  currentQrisUrl?: string;
  onSave: (data: { danaNumber: string; danaName: string; qrisUrl?: string }) => Promise<void>;
  onShowToast?: (msg: string) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  currentDanaNumber,
  currentDanaName,
  currentQrisUrl = "",
  onSave,
  onShowToast,
}) => {
  const [danaNumber, setDanaNumber] = useState(currentDanaNumber || "");
  const [danaName, setDanaName] = useState(currentDanaName || "");
  const [qrisUrl, setQrisUrl] = useState(currentQrisUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danaNumber.trim()) {
      if (onShowToast) onShowToast("Isi nomor HP akun DANA Anda!");
      return;
    }
    if (!danaName.trim()) {
      if (onShowToast) onShowToast("Isi nama pemilik akun DANA Anda!");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        danaNumber: danaNumber.trim(),
        danaName: danaName.trim(),
        qrisUrl: qrisUrl.trim(),
      });
      if (onShowToast) onShowToast("Dompet DANA berhasil disimpan!");
      onClose();
    } catch {
      if (onShowToast) onShowToast("Gagal menyimpan data dompet DANA.");
    } finally {
      setIsSaving(false);
    }
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
        <div className="bg-gradient-to-r from-[#00632B] to-emerald-700 p-4 sm:p-5 text-white flex items-center justify-between relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/20 shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                Pengaturan Dompet Hadiah
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                Terima hadiah DANA saat berita mencapai &ge;500 Suka
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulir */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 leading-relaxed">
              Ketika postingan berita Anda mencapai <strong>500 Suka (Like)</strong>, tombol <strong>🎁 Beri Hadiah</strong> akan otomatis aktif di postingan Anda sehingga penonton & admin bisa mengirim hadiah uang langsung ke DANA Anda!
            </p>
          </div>

          {/* Nomor HP DANA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Nomor Akun DANA (Wajib):
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-neutral-400 select-none">
                📱
              </span>
              <input
                type="tel"
                required
                value={danaNumber}
                onChange={(e) => setDanaNumber(e.target.value.replace(/[^0-9+]/g, "").slice(0, 16))}
                placeholder="Contoh: 085351037179"
                className="w-full pl-9 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:bg-white focus:border-[#00632B] outline-none transition"
              />
            </div>
          </div>

          {/* Nama Pemilik Akun DANA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Nama Terdaftar di DANA (Wajib):
            </label>
            <input
              type="text"
              required
              value={danaName}
              onChange={(e) => setDanaName(e.target.value.slice(0, 40))}
              placeholder="Contoh: Sitti Salma / Andi Rustam"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:bg-white focus:border-[#00632B] outline-none transition"
            />
            <p className="text-[10.5px] text-neutral-500">
              *Agar pengirim yakin bahwa uang hadiah terkirim ke nama pemilik yang benar.
            </p>
          </div>

          {/* Tautan / URL Foto QRIS (Opsional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-600" />
              <span>Link Gambar Barcode QRIS Anda (Opsional):</span>
            </label>
            <input
              type="url"
              value={qrisUrl}
              onChange={(e) => setQrisUrl(e.target.value)}
              placeholder="https://... (Kosongkan jika tidak ada)"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:bg-white focus:border-[#00632B] outline-none transition"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-1/3 py-3 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-[#00632B] hover:bg-[#004f22] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Dompet DANA"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 justify-center text-[10px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Nomor DANA hanya ditampilkan saat postingan Anda tembus 500 Suka.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
