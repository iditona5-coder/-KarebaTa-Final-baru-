import React, { useRef, useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video as VideoIcon,
  MapPin,
  Sparkles,
} from "lucide-react";
import { SponsorAd } from "../types";

interface SponsorPopupModalProps {
  ad: SponsorAd | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SponsorPopupModal: React.FC<SponsorPopupModalProps> = ({
  ad,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [countdown, setCountdown] = useState<number>(3);
  const [canSkipImmediately, setCanSkipImmediately] = useState(true);
  const [isVerticalMedia, setIsVerticalMedia] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (isOpen && ad) {
      setIsPlaying(true);
      setIsMuted(true);
      setCountdown(3);
      setIsVerticalMedia(false);
      setMediaAspectRatio(null);

      // Kunci scroll latar belakang beranda saat pop-up terbuka agar layar belakang tidak tergulir
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevTouchAction = document.body.style.touchAction;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen || !ad) return null;

  const isVideo =
    ad.mediaType === "video" ||
    Boolean(ad.videoUrl) ||
    (ad.imageUrl &&
      (ad.imageUrl.startsWith("data:video") ||
        ad.imageUrl.includes(".mp4") ||
        ad.imageUrl.includes(".webm") ||
        ad.imageUrl.includes("video")));

  const mediaSource = ad.videoUrl || ad.imageUrl;
  const initialLetter = ad.advertiserName ? ad.advertiserName.trim().charAt(0).toUpperCase() : "S";

  const handleActionClick = () => {
    if (ad.actionType === "whatsapp") {
      const cleanPhone = (ad.actionTarget || "").replace(/[^0-9]/g, "");
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.slice(1);
      }
      const greeting = encodeURIComponent(
        `Halo ${ad.advertiserName}, saya melihat promo pop-up "${ad.title}" di aplikasi KarebaTa. Saya tertarik untuk info lebih lanjut.`
      );
      const waUrl = `https://wa.me/${formattedPhone}?text=${greeting}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } else {
      let targetUrl = (ad.actionTarget || "").trim();
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = "https://" + targetUrl;
      }
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      id="sponsor-popup-modal-overlay"
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none touch-none overscroll-none"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200/60 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 transition-all ${
          isVerticalMedia ? "max-w-[340px] sm:max-w-[360px]" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* TOP BAR / HEADER MODAL POP-UP */}
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs border border-amber-300">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-neutral-900 truncate">
                  {ad.advertiserName}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{ad.badgeText || "Promo Pop-up"}</span>
                </span>
              </div>
              {ad.location && (
                <p className="text-[10px] text-neutral-500 flex items-center gap-0.5 truncate">
                  <MapPin className="w-2.5 h-2.5 text-yellow-500" />
                  <span>{ad.location}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tombol Tutup / Lewati */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-600 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="Tutup Pop-up Iklan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AREA MEDIA FOTO ATAU VIDEO DENGAN RASIO ASLI - TANPA HITAM & TANPA BLUR */}
        <div className="relative w-full max-h-[55vh] bg-neutral-100/60 overflow-hidden flex items-center justify-center group select-none">
          {isVideo ? (
            <div className="relative w-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={mediaSource}
                poster={ad.thumbnailUrl}
                playsInline
                autoPlay
                muted={isMuted}
                loop
                className="w-full h-auto max-h-[55vh] object-contain cursor-pointer block mx-auto"
                onClick={toggleVideoPlayback}
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  if (vid.videoWidth && vid.videoHeight) {
                    const ratio = vid.videoWidth / vid.videoHeight;
                    setMediaAspectRatio(ratio);
                    setIsVerticalMedia(vid.videoHeight > vid.videoWidth * 1.05);
                  }
                }}
                onError={() => {
                  if (onShowToast) onShowToast("Gagal memuat video iklan.");
                }}
              />

              {/* OVERLAY KONTROL VIDEO (PLAY/PAUSE & SUARA) */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 bg-gradient-to-t from-black/60 via-transparent to-black/30">
                <div className="flex items-center justify-between w-full pointer-events-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white border border-white/20">
                    <VideoIcon className="w-3 h-3 text-emerald-400" />
                    <span>Video Promosi</span>
                  </span>

                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white flex items-center justify-center transition active:scale-90 border border-white/20"
                    aria-label={isMuted ? "Aktifkan suara" : "Bisukan suara"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between w-full pointer-events-auto">
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-90 border border-white/20"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3 h-3 fill-white" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-white translate-x-0.2" />
                        <span>Putar</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-white/80 font-medium bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {ad.advertiserName}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-auto max-h-[55vh] object-contain block mx-auto"
              loading="eager"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  setMediaAspectRatio(ratio);
                  setIsVerticalMedia(img.naturalHeight > img.naturalWidth * 1.05);
                }
              }}
            />
          )}
        </div>

        {/* KONTEN KETERANGAN & TOMBOL AKSI */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-white">
          <div>
            <h3 className="font-extrabold text-base text-neutral-900 leading-snug">
              {ad.title}
            </h3>
            <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed whitespace-pre-line">
              {ad.description}
            </p>
          </div>

          {/* TOMBOL AKSI UTAMA (WHATSAPP ATAU LINK WEBSITE JIKA DIPILIH) */}
          <div className="pt-1 space-y-2">
            {ad.actionType !== "none" && (
              <button
                id="popup-ad-cta-btn"
                type="button"
                onClick={handleActionClick}
                className={`w-full py-3 px-4 rounded-2xl font-extrabold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer ${
                  ad.actionType === "whatsapp"
                    ? "bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 shadow-emerald-600/25"
                    : "bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:from-amber-700 hover:to-yellow-800 shadow-amber-600/25"
                }`}
              >
                {ad.actionType === "whatsapp" ? (
                  <>
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>{ad.actionButtonText || "Hubungi via WhatsApp"}</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>{ad.actionButtonText || "Kunjungi Website Resmi"}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 rounded-xl hover:bg-neutral-100 transition cursor-pointer text-center"
            >
              Lewati Iklan &amp; Lanjutkan ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
