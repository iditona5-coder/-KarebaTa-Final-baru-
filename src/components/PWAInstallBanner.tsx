import React, { useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { KarebaPinIcon } from './KarebaTaLogo';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(sessionStorage.getItem('karebata_install_dismissed'));
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Jangan tampilkan jika sudah terinstal atau user menutup banner di sesi ini
  if (isInstalled || dismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowAndroidModal(true);
      }
    } else {
      setShowAndroidModal(true);
    }
  };

  // Tampilan Default untuk Android / Desktop Web (Jika belum standalone)
  return (
    <>
      <div className="mx-3.5 my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-amber-50/40 to-white border border-emerald-300 shadow-sm flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/90 shadow-2xs flex items-center justify-center shrink-0">
            <KarebaPinIcon size={26} />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#00632B] truncate">
                Pasang Aplikasi Kareba'Ta
              </h4>
              <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-800 shrink-0">
                Resmi
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 truncate mt-0.5">
              Buka langsung dari layar utama HP ta'
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={isIOS ? () => setShowIOSModal(true) : handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00632B] hover:bg-[#004f22] active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem('karebata_install_dismissed', 'true');
              } catch {}
              setDismissed(true);
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
            aria-label="Tutup saran pemasangan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Panduan Pasang Android jika browser butuh langkah manual */}
      {showAndroidModal && (
        <div className="fixed inset-0 z-[999999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-left animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <KarebaPinIcon size={32} />
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Pasang Aplikasi Kareba'Ta
                </h3>
                <p className="text-xs text-neutral-500">Ikon bersih resmi Kareba'Ta tanpa lencana browser</p>
              </div>
            </div>
            <ol className="text-xs text-neutral-700 space-y-2.5 my-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">1.</span>
                <span>Ketuk ikon <strong>titik tiga (⋮)</strong> di sudut kanan atas browser Chrome.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">2.</span>
                <span>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Instal aplikasi"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">3.</span>
                <span>Pilih <strong>"Instal"</strong> (bukan <em>Buat pintasan</em>) agar ikon bersih tanpa lambang Chrome kecil di sudut kanan.</span>
              </li>
            </ol>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-4 text-[11px] text-amber-900 leading-relaxed">
              <em>Jika sebelumnya terpasang pintasan lama, hapus pintasan lama sekali saja lalu pasang ulang agar ikon bersih tanpa batang loading muncul.</em>
            </div>
            <button
              type="button"
              onClick={() => setShowAndroidModal(false)}
              className="w-full py-2.5 bg-[#00632B] text-white rounded-xl text-xs font-bold hover:bg-[#004f22] transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal Panduan Pasang iOS Safari */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[999999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl text-left animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <KarebaPinIcon size={32} />
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  Pasang Kareba'Ta di iPhone
                </h3>
                <p className="text-xs text-neutral-500">Langkah mudah pasang ke beranda</p>
              </div>
            </div>
            <ol className="text-xs text-neutral-700 space-y-2.5 my-4 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">1.</span>
                <span>Tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">2.</span>
                <span>Gulir ke bawah lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#00632B]">3.</span>
                <span>Tekan <strong>Tambah (Add)</strong> di pojok kanan atas.</span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
