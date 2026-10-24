import React, { useRef, useState } from "react";
import { MessageCircle, ExternalLink, Megaphone, MapPin, Play, Pause, Volume2, VolumeX, Video as VideoIcon } from "lucide-react";
import { SponsorAd } from "../types";

interface SponsorAdCardProps {
  ad: SponsorAd;
  onOpenHelp?: () => void;
  onShowToast?: (msg: string) => void;
}

export const SponsorAdCard: React.FC<SponsorAdCardProps> = ({
  ad,
  onOpenHelp,
  onShowToast,
}) => {
  const touchTrackRef = useRef<{
    x: number;
    y: number;
    startTime: number;
    moved: boolean;
    initiated: boolean;
    blockUntil: number;
  }>({
    x: 0,
    y: 0,
    startTime: 0,
    moved: false,
    initiated: false,
    blockUntil: 0,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchTrackRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startTime: Date.now(),
        moved: false,
        initiated: true,
        blockUntil: touchTrackRef.current.blockUntil,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchTrackRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchTrackRef.current.y);
      if (dx > 4 || dy > 4) {
        touchTrackRef.current.moved = true;
        touchTrackRef.current.blockUntil = Date.now() + 1000;
      }
    }
  };

  const handleTouchEnd = () => {
    const elapsed = Date.now() - touchTrackRef.current.startTime;
    if (touchTrackRef.current.moved || elapsed > 500) {
      touchTrackRef.current.blockUntil = Date.now() + 1000;
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const lastScroll = (window as any).__KAREBATA_LAST_SCROLL_TIME__ || 0;
    if (
      now - lastScroll < 600 ||
      now < touchTrackRef.current.blockUntil ||
      touchTrackRef.current.moved ||
      !touchTrackRef.current.initiated
    ) {
      e.preventDefault();
      e.stopPropagation();
      touchTrackRef.current.initiated = false;
      return;
    }
    if (ad.actionType === "none") {
      return;
    }
    touchTrackRef.current.initiated = false;
    if (ad.actionType === "whatsapp") {
      const cleanPhone = (ad.actionTarget || "").replace(/[^0-9]/g, "");
      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.slice(1);
      }
      const greeting = encodeURIComponent(
        `Halo ${ad.advertiserName}, saya melihat promo "${ad.title}" di aplikasi KarebaTa. Saya tertarik untuk info lebih lanjut.`
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

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const initialLetter = ad.advertiserName ? ad.advertiserName.trim().charAt(0).toUpperCase() : "S";

  const isVideo =
    ad.mediaType === "video" ||
    Boolean(ad.videoUrl) ||
    (ad.imageUrl &&
      (ad.imageUrl.startsWith("data:video") ||
        ad.imageUrl.includes(".mp4") ||
        ad.imageUrl.includes(".webm") ||
        ad.imageUrl.includes("video")));

  const mediaSource = ad.videoUrl || ad.imageUrl;

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
    <article
      id={`sponsor-ad-${ad.id}`}
      className="w-full bg-gradient-to-b from-amber-50/40 via-white to-white border-y border-amber-200/70 sm:border sm:border-amber-200/80 sm:rounded-2xl sm:mb-5 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* HEADER SPONSOR */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Advertiser */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-600 to-amber-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs border border-amber-300">
            {initialLetter}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-sm text-neutral-900 truncate">
                {ad.advertiserName}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500/15 to-yellow-500/20 text-amber-900 border border-amber-300/80">
                {isVideo && <VideoIcon className="w-2.5 h-2.5 text-amber-700 inline" />}
                <span>{ad.badgeText || (isVideo ? "Video Sponsor" : "Iklan Bersponsor")}</span>
              </span>
            </div>

            {ad.location && (
              <p className="text-[11px] text-neutral-500 flex items-center gap-1 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                <span className="truncate">{ad.location}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MEDIA BANNER: VIDEO ATAU POSTER FOTO SESUAI RASIO ASLI (VERTIKAL & HORIZONTAL TIDAK TERPOTONG) */}
      {mediaSource && (
        <div
          className={`w-full relative bg-neutral-950 overflow-hidden group flex items-center justify-center ${
            ad.actionType !== "none" ? "cursor-pointer" : ""
          }`}
          onClick={ad.actionType !== "none" ? handleActionClick : undefined}
        >
          {isVideo ? (
            <div className="relative w-full flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={mediaSource}
                poster={ad.thumbnailUrl}
                playsInline
                loop
                autoPlay
                muted={isMuted}
                className="w-full h-auto max-h-[85vh] object-contain bg-black block mx-auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Tombol Kontrol Suara & Putar Video di Pojok Bawah */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 border border-white/20"
                  aria-label={isMuted ? "Bunyikan Suara" : "Matikan Suara"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                <button
                  type="button"
                  onClick={toggleVideoPlayback}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition shadow-md cursor-pointer active:scale-95 border border-white/20"
                  aria-label={isPlaying ? "Jeda Video" : "Putar Video"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
                </button>
              </div>

              {/* Label Video Promo Pojok Kiri Atas */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/20 shadow-xs">
                  <VideoIcon className="w-3 h-3 text-emerald-400" />
                  <span>Video Promosi</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="relative w-full flex items-center justify-center bg-neutral-950">
              <img
                src={mediaSource}
                alt={ad.title}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-auto max-h-[85vh] object-contain block mx-auto bg-neutral-950 transition duration-300"
              />
              {ad.actionType !== "none" && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-xs font-bold drop-shadow">
                    Ketuk untuk membuka promosi &rarr;
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* BODY PROMO & CALL TO ACTION */}
      <div className="p-4 space-y-3 bg-white">
        <div>
          <h3 className="font-bold text-base text-neutral-900 leading-snug">
            {ad.title}
          </h3>
          <p className="text-xs text-neutral-700 mt-1 leading-relaxed whitespace-pre-line">
            {ad.description}
          </p>
        </div>

        {/* TOMBOL AKSI UTAMA (CTA) */}
        <div className="pt-1 flex items-center justify-between gap-3">
          {ad.actionType !== "none" && (
            <button
              type="button"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={handleActionClick}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer ${
                ad.actionType === "whatsapp"
                  ? "bg-[#25D366] hover:bg-[#20ba59] text-white shadow-emerald-900/20"
                  : "bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/20"
              }`}
            >
              {ad.actionType === "whatsapp" ? (
                <MessageCircle className="w-4 h-4" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>{ad.actionButtonText || (ad.actionType === "whatsapp" ? "Hubungi WhatsApp Toko" : "Kunjungi Website")}</span>
            </button>
          )}

          {onOpenHelp && (
            <button
              type="button"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => {
                const now = Date.now();
                const lastScroll = (window as any).__KAREBATA_LAST_SCROLL_TIME__ || 0;
                if (
                  now - lastScroll < 600 ||
                  now < touchTrackRef.current.blockUntil ||
                  touchTrackRef.current.moved ||
                  !touchTrackRef.current.initiated
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  touchTrackRef.current.initiated = false;
                  return;
                }
                touchTrackRef.current.initiated = false;
                onOpenHelp();
              }}
              className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3 py-2.5 rounded-xl transition cursor-pointer shrink-0"
              aria-label="Mau Pasang Iklan? Hubungi Admin"
            >
              Mau Pasang Iklan?
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
