import React, { useState } from "react";
import { Building2, Smartphone, QrCode, Check, X, ShieldCheck } from "lucide-react";
import { UserWalletSettings } from "../types";

export const POPULAR_BANKS = [
  "Bank BRI (Bank Rakyat Indonesia)",
  "Bank Sulselbar",
  "Bank BCA",
  "Bank Mandiri",
  "Bank BNI",
  "Bank BSI (Syariah)",
  "Bank Danamon",
  "Bank CIMB Niaga",
  "Bank Lainnya",
];

interface WalletSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallet?: UserWalletSettings;
  currentBankName?: string;
  currentBankAccountNumber?: string;
  currentBankAccountName?: string;
  currentDanaNumber?: string;
  currentDanaName?: string;
  currentQrisUrl?: string;
  currentPayoutMethod?: "bank" | "dana" | "qris";
  onSave: (data: UserWalletSettings) => Promise<void>;
  onShowToast?: (msg: string) => void;
}

export const WalletSettingsModal: React.FC<WalletSettingsModalProps> = ({
  isOpen,
  onClose,
  currentBankName = "Bank BRI (Bank Rakyat Indonesia)",
  currentBankAccountNumber = "",
  currentBankAccountName = "",
  currentDanaNumber = "",
  currentDanaName = "",
  currentQrisUrl = "",
  currentPayoutMethod = "bank",
  onSave,
  onShowToast,
}) => {
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "dana" | "qris">(
    currentPayoutMethod || (currentBankAccountNumber ? "bank" : currentDanaNumber ? "dana" : "bank")
  );
  const [bankName, setBankName] = useState(currentBankName || "Bank BRI (Bank Rakyat Indonesia)");
  const [bankAccountNumber, setBankAccountNumber] = useState(currentBankAccountNumber || "");
  const [bankAccountName, setBankAccountName] = useState(currentBankAccountName || "");
  const [danaNumber, setDanaNumber] = useState(currentDanaNumber || "");
  const [danaName, setDanaName] = useState(currentDanaName || "");
  const [qrisUrl, setQrisUrl] = useState(currentQrisUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (payoutMethod === "bank") {
      if (!bankAccountNumber.trim()) {
        if (onShowToast) onShowToast("Silakan isi nomor rekening bank Anda!");
        return;
      }
      if (!bankAccountName.trim()) {
        if (onShowToast) onShowToast("Silakan isi nama pemilik rekening bank!");
        return;
      }
    } else if (payoutMethod === "dana") {
      if (!danaNumber.trim()) {
        if (onShowToast) onShowToast("Silakan isi nomor HP akun DANA Anda!");
        return;
      }
      if (!danaName.trim()) {
        if (onShowToast) onShowToast("Silakan isi nama pemilik akun DANA Anda!");
        return;
      }
    } else if (payoutMethod === "qris") {
      if (!qrisUrl.trim()) {
        if (onShowToast) onShowToast("Silakan masukkan tautan/URL gambar QRIS Anda!");
        return;
      }
    }

    try {
      setIsSaving(true);
      await onSave({
        payoutMethod,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountName: bankAccountName.trim(),
        danaNumber: danaNumber.trim(),
        danaName: danaName.trim(),
        qrisUrl: qrisUrl.trim(),
      });
      if (onShowToast) {
        onShowToast(
          payoutMethod === "bank"
            ? "Rekening Bank penerima hadiah berhasil disimpan!"
            : payoutMethod === "dana"
            ? "Nomor DANA penerima hadiah berhasil disimpan!"
            : "Barcode QRIS berhasil disimpan!"
        );
      }
      onClose();
    } catch {
      if (onShowToast) onShowToast("Gagal menyimpan data rekening/dompet hadiah.");
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
        <div className="bg-gradient-to-r from-[#00632B] via-emerald-700 to-[#00632B] p-4 sm:p-5 text-white flex items-center justify-between relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/20 shrink-0">
              {payoutMethod === "bank" ? (
                <Building2 className="w-5 h-5 text-white" />
              ) : payoutMethod === "dana" ? (
                <Smartphone className="w-5 h-5 text-white" />
              ) : (
                <QrCode className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">
                Pengaturan Hadiah (Pa'bere)
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                Pilih Rekening Bank, DANA, atau QRIS untuk menerima hadiah
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
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5">
            <p className="text-xs text-emerald-950 leading-relaxed">
              Ketika postingan berita Anda mencapai syarat tanda Suka, tombol <b>Pa'bere</b> akan muncul sehingga warga dan admin bisa mentransfer apresiasi langsung ke rekening/dompet Anda tanpa potongan!
            </p>
          </div>

          {/* Tab Pilihan Metode Penerimaan Uang */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-800 block">
              Pilih Saluran Penerimaan Hadiah Anda:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setPayoutMethod("bank")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  payoutMethod === "bank"
                    ? "bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="text-[11px]">Rekening Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod("dana")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  payoutMethod === "dana"
                    ? "bg-white text-[#118EEA] shadow-xs ring-1 ring-[#118EEA]"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Smartphone className="w-4 h-4 text-[#118EEA]" />
                <span className="text-[11px]">Dompet DANA</span>
              </button>

              <button
                type="button"
                onClick={() => setPayoutMethod("qris")}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  payoutMethod === "qris"
                    ? "bg-white text-amber-700 shadow-xs ring-1 ring-amber-600"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <QrCode className="w-4 h-4 text-amber-600" />
                <span className="text-[11px]">QRIS Barcode</span>
              </button>
            </div>
          </div>

          {/* JIKA MEMILIH REKENING BANK */}
          {payoutMethod === "bank" && (
            <div className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-3.5 space-y-3.5 animate-fade-in">
              {/* Pilihan Bank */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Nama Bank (Pilih Bank Anda):
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 focus:border-emerald-600 outline-none transition"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nomor Rekening */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Nomor Rekening Bank (Wajib):
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9-]/g, "").slice(0, 30))}
                  placeholder="Contoh: 0123-01-000456-50-8"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-neutral-900 focus:border-emerald-600 outline-none transition"
                />
                <p className="text-[10px] text-neutral-500">
                  *Nomor rekening yang tertera di buku tabungan atau kartu ATM Anda.
                </p>
              </div>

              {/* Nama Pemilik Rekening */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Nama Pemilik Rekening (Sesuai Buku Tabungan):
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.slice(0, 45))}
                  placeholder="Contoh: Andi Rustam / Hj. Nurhaedah"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* JIKA MEMILIH DANA */}
          {payoutMethod === "dana" && (
            <div className="bg-sky-50/50 border border-sky-200/80 rounded-2xl p-3.5 space-y-3.5 animate-fade-in">
              {/* Nomor HP DANA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Nomor Akun DANA (Wajib):
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sky-600 select-none flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={danaNumber}
                    onChange={(e) => setDanaNumber(e.target.value.replace(/[^0-9+]/g, "").slice(0, 16))}
                    placeholder="Contoh: 085351037179"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-neutral-900 focus:border-[#118EEA] outline-none transition"
                  />
                </div>
              </div>

              {/* Nama Pemilik Akun DANA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Nama Terdaftar di DANA (Wajib):
                </label>
                <input
                  type="text"
                  required
                  value={danaName}
                  onChange={(e) => setDanaName(e.target.value.slice(0, 40))}
                  placeholder="Contoh: Sitti Salma / Andi Rustam"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 focus:border-[#118EEA] outline-none transition"
                />
              </div>
            </div>
          )}

          {/* JIKA MEMILIH QRIS */}
          {payoutMethod === "qris" && (
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5 space-y-3.5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tautan / URL Gambar Barcode QRIS:</span>
                </label>
                <input
                  type="url"
                  required
                  value={qrisUrl}
                  onChange={(e) => setQrisUrl(e.target.value)}
                  placeholder="https://... (URL gambar barcode QRIS Anda)"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:border-amber-600 outline-none transition"
                />
                <p className="text-[10.5px] text-neutral-500">
                  *Barcode QRIS dari aplikasi bank (BRI, BCA, Mandiri) atau e-wallet (DANA, GoPay) yang dapat di-scan oleh pembaca kabar.
                </p>
              </div>
            </div>
          )}

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
              <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan Hadiah"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 justify-center text-[10px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Rekening hanya ditampilkan saat postingan Anda mencapai syarat Suka.</span>
          </div>
        </form>
      </div>
    </div>
  );
};
