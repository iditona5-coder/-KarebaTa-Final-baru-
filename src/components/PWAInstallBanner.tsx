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

  // Jangan tampilkan jika sudah terinstal atau user menutup banner di sesi ini
  if (isInstalled || dismissed) {
    return null;
  }

  // Jika browser mendukung instalasi PWA langsung (Chrome / Android / Edge)
  if (isInstallable) {
    return (
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
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00632B] hover:bg-[#004f22] active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('karebata_install_dismissed', 'true');
              setDismissed(true);
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
            aria-label="Tutup saran pemasangan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Jika di perangkat iOS (iPhone / iPad di Safari)
  if (isIOS) {
    return (
      <>
        <div className="mx-3.5 my-2.5 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-center shrink-0">
              <KarebaPinIcon size={24} />
            </div>
            <div className="min-w-0 text-left">
              <h4 className="text-xs font-bold text-[#00632B] truncate">
                Pasang di Layar Utama iPhone
              </h4>
              <p className="text-[10.5px] text-neutral-500 truncate">
                Akses instan dari beranda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIOSModal(true)}
            className="px-2.5 py-1 text-[11px] font-bold text-[#00632B] bg-white border border-emerald-300 rounded-lg shadow-2xs hover:bg-emerald-50 transition"
          >
            Petunjuk
          </button>
        </div>

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
  }

  return null;
};
