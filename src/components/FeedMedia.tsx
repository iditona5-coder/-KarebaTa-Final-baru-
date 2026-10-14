import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Loader2,
  Video,
  MapPin,
  Clock,
  RefreshCw,
} from "lucide-react";
import { extractVideoThumbnail } from "../utils/thumbnail";
import { isMediaCached, markMediaCached, preloadImage } from "../utils/mediaPreloader";
import { normalizeMediaUrl } from "../services/imagekit";
import { getLocalVideoBlob } from "../utils/localMediaCache";

export interface MediaAuthorInfo {
  avatar?: string;
  initials?: string;
  name?: string;
  username?: string;
  email?: string;
  location?: string;
  time?: string;
  description?: string;
}

interface FeedMediaProps {
  src: string;
  thumbnail?: string;
  alt?: string;
  description?: string;
  mediaType?: "image" | "video";
  className?: string;
  author?: MediaAuthorInfo;
}

export const FeedMedia: React.FC<FeedMediaProps> = ({
  src,
  thumbnail,
  alt = "Konten media",
  description,
  mediaType,
  className = "",
  author,
}) => {
  // Tentukan apakah tipe media adalah video
  const isVideo =
    mediaType === "video" ||
    src.endsWith(".mp4") ||
    src.endsWith(".webm") ||
    src.endsWith(".mov") ||
    src.startsWith("data:video/") ||
    src.includes("video") ||
    src.includes(".mp4");

  // Orientasi media
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sumber URL video aktif (dinormalisasi dengan ?tr=orig-true jika ImageKit agar tidak 403)
  const [activeVideoSrc, setActiveVideoSrc] = useState(() => normalizeMediaUrl(src, isVideo));

  useEffect(() => {
    const normalized = normalizeMediaUrl(src, isVideo);
    setActiveVideoSrc(normalized);
    setHasVideoError(false);

    // Jika URL blob lokal yang mungkin telah kedaluwarsa setelah reload, cari di IndexedDB lokal
    if (isVideo && src && src.startsWith("blob:")) {
      const keysToTry = [src, alt || "", description || "", author?.username || ""].filter(Boolean);
      (async () => {
        for (const k of keysToTry) {
          const cachedBlob = await getLocalVideoBlob(k);
          if (cachedBlob) {
            const freshUrl = URL.createObjectURL(cachedBlob);
            setActiveVideoSrc(freshUrl);
            setHasVideoError(false);
            break;
          }
        }
      })();
    }
  }, [src, isVideo, alt, description, author?.username]);

  // Fullscreen video state
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const [fsCurrentTime, setFsCurrentTime] = useState(0);
  const [fsDuration, setFsDuration] = useState(0);
  const [fsIsPlaying, setFsIsPlaying] = useState(true);
  const [fsIsMuted, setFsIsMuted] = useState(false);

  // Status kesiapan gambar di memori GPU (mencegah tirai terbuka setengah atau loncatan layout)
  const [isImageReady, setIsImageReady] = useState(() => isMediaCached(src));

  useEffect(() => {
    if (!isVideo && src) {
      if (isMediaCached(src)) {
        setIsImageReady(true);
      } else {
        preloadImage(src).then(() => {
          setIsImageReady(true);
        });
      }
    }
  }, [isVideo, src]);

  // Poster / Thumbnail khusus video agar tidak blank di HP / browser
  const [posterUrl, setPosterUrl] = useState<string | undefined>(thumbnail);

  useEffect(() => {
    if (thumbnail) {
      setPosterUrl(thumbnail);
      return;
    }
    if (isVideo && src) {
      let isCancelled = false;
      extractVideoThumbnail(src).then((extracted) => {
        if (!isCancelled && extracted) {
          setPosterUrl(extracted);
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [thumbnail, isVideo, src]);

  // Helper aman untuk memutar (play) dan menjeda (pause) video tanpa error Promise browser
  const safePlay = (video: HTMLVideoElement | null) => {
    if (!video) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === "AbortError" || err.name === "NotAllowedError") {
          return;
        }
        console.warn("Video playback safely handled:", err);
      });
    }
  };

  const safePause = (video: HTMLVideoElement | null) => {
    if (!video) return;
    try {
      if (!video.paused) {
        video.pause();
      }
    } catch {
      // Abaikan jika sudah dalam kondisi pause
    }
  };

  // Efek: Berhenti berjalan (pause) otomatis ketika media di-scroll keluar pandangan
  useEffect(() => {
    if (!isVideo) return;

    const currentVideo = videoRef.current;
    if (!currentVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && currentVideo && !currentVideo.paused) {
            safePause(currentVideo);
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(currentVideo);

    return () => {
      observer.disconnect();
    };
  }, [isVideo]);

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight, duration } = e.currentTarget;
    if (duration) {
      setFsDuration(duration);
    }
    if (videoWidth && videoHeight) {
      if (videoHeight >= videoWidth) {
        setOrientation("vertical");
      } else {
        setOrientation("horizontal");
      }
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    markMediaCached(src);
    setIsImageReady(true);
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      if (naturalHeight >= naturalWidth) {
        setOrientation("vertical");
      } else {
        setOrientation("horizontal");
      }
    }
  };

  // Proteksi anti-play/anti-click saat scrolling pada perangkat sentuh (touchscreen) & mouse
  const pointerStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingMediaRef = useRef(false);
  const blockClickUntilRef = useRef(0);

  const handleMediaPointerDown = (e: React.PointerEvent) => {
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDraggingMediaRef.current = false;
  };

  const handleMediaPointerMove = (e: React.PointerEvent) => {
    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 6 || dy > 6) {
        isDraggingMediaRef.current = true;
      }
    }
  };

  const handleMediaPointerUp = (e: React.PointerEvent) => {
    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      const duration = Date.now() - pointerStartPosRef.current.time;
      pointerStartPosRef.current = null;
      if (dx > 6 || dy > 6 || duration > 350) {
        isDraggingMediaRef.current = true;
        blockClickUntilRef.current = Date.now() + 400;
        setTimeout(() => {
          isDraggingMediaRef.current = false;
        }, 400);
        return;
      }
    }
    isDraggingMediaRef.current = false;
  };

  const handleMediaPointerCancel = () => {
    pointerStartPosRef.current = null;
    isDraggingMediaRef.current = true;
    blockClickUntilRef.current = Date.now() + 400;
    setTimeout(() => {
      isDraggingMediaRef.current = false;
    }, 400);
  };

  const toggleVideoPlay = () => {
    if (isDraggingMediaRef.current || Date.now() < blockClickUntilRef.current) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      safePlay(videoRef.current);
    } else {
      safePause(videoRef.current);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingMediaRef.current || Date.now() < blockClickUntilRef.current) return;
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // =========================================================================
  // SISTEM BUKA FULL SCREEN DENGAN DETEKSI TAP KETAT
  // Mencegah 100% fullscreen terbuka tidak sengaja saat pengguna sedang scrolling
  // =========================================================================
  const openFullscreen = () => {
    if (isDraggingMediaRef.current || Date.now() < blockClickUntilRef.current) return;
    if (videoRef.current) {
      if (!videoRef.current.paused) {
        safePause(videoRef.current);
      }
      setFsCurrentTime(videoRef.current.currentTime || 0);
      if (videoRef.current.duration) {
        setFsDuration(videoRef.current.duration);
      }
    }
    setFsIsMuted(false);
    setFsIsPlaying(true);
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    if (fullscreenVideoRef.current && videoRef.current) {
      videoRef.current.currentTime = fullscreenVideoRef.current.currentTime;
      safePause(fullscreenVideoRef.current);
    }
    setIsFullscreen(false);
  };

  // Lock body scroll saat fullscreen aktif
  useEffect(() => {
    if (!isFullscreen) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Sinkronkan video saat fullscreen terbuka
  useEffect(() => {
    if (isFullscreen && isVideo && fullscreenVideoRef.current && videoRef.current) {
      fullscreenVideoRef.current.currentTime = videoRef.current.currentTime || 0;
      if (fsIsPlaying) {
        safePlay(fullscreenVideoRef.current);
      }
    }
  }, [isFullscreen, isVideo]);

  // Tombol Full Screen: Membuka layar penuh saat ditekan
  const handleFsBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openFullscreen();
  };

  // Format Waktu mm:ss untuk durasi video
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render Modal Layar Penuh (Custom Fullscreen Viewer)
  const renderFullscreenModal = () => {
    if (!isFullscreen || typeof document === "undefined") return null;

    const authorDisplayName = author?.name || (author?.username ? `@${author.username.replace(/^@/, '')}` : "Warga Kareba");

    return createPortal(
      <div
        id="karebata-fullscreen-modal"
        className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between overflow-hidden select-none animate-fade-in overscroll-none"
        style={{
          overscrollBehavior: "none",
          WebkitOverflowScrolling: "auto",
          touchAction: "none",
        }}
      >
        {/* Header Layar Penuh: Info Penulis, Lokasi & Waktu Bersih */}
        <header className="px-4 py-3.5 bg-gradient-to-b from-black/85 via-black/50 to-transparent flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            {author?.avatar ? (
              <img
                src={author.avatar}
                alt={authorDisplayName}
                className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/20 shadow-xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-700/90 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/20 shadow-xs">
                {author?.initials || authorDisplayName[0]?.toUpperCase() || "K"}
              </div>
            )}
            <div className="min-w-0">
              {/* Baris Atas: Nama Pengguna & Waktu di Sebelah Kanannya */}
              <div className="flex items-center gap-1.5 flex-nowrap">
                <p className="font-bold text-sm text-white truncate leading-tight">{authorDisplayName}</p>
                {author?.time && (
                  <>
                    <span className="text-white/40 text-xs shrink-0">•</span>
                    <span className="flex items-center gap-1 text-[11px] text-neutral-300 font-normal shrink-0">
                      <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span>{author.time}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Baris Bawah: Lokasi */}
              {(author?.location || "Kareba'Ta") && (
                <div className="flex items-center gap-1 text-[11px] text-yellow-300 font-medium mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span className="truncate">{author?.location || "Kareba'Ta"}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={closeFullscreen}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0"
            aria-label="Tutup Layar Penuh"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Media Tengah: Gambar atau Video */}
        <div
          className="flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden p-2 cursor-pointer"
          onClick={closeFullscreen}
        >
          {isVideo ? (
            <video
              ref={fullscreenVideoRef}
              src={src}
              poster={posterUrl || thumbnail}
              playsInline
              loop
              muted={fsIsMuted}
              className="max-w-full max-h-full object-contain pointer-events-auto fullscreen-video-element"
              onClick={(e) => {
                e.stopPropagation();
                if (!fullscreenVideoRef.current) return;
                if (fullscreenVideoRef.current.paused) {
                  safePlay(fullscreenVideoRef.current);
                  setFsIsPlaying(true);
                } else {
                  safePause(fullscreenVideoRef.current);
                  setFsIsPlaying(false);
                }
              }}
              onTimeUpdate={() => {
                if (fullscreenVideoRef.current) {
                  setFsCurrentTime(fullscreenVideoRef.current.currentTime);
                }
              }}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration) {
                  setFsDuration(e.currentTarget.duration);
                }
              }}
            />
          ) : (
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-w-full max-h-full object-contain drop-shadow-md select-none pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Kontrol Bawah Video (Hanya tampil jika video) */}
        {isVideo && (
          <footer className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 shrink-0">
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!fullscreenVideoRef.current) return;
                  if (fullscreenVideoRef.current.paused) {
                    safePlay(fullscreenVideoRef.current);
                    setFsIsPlaying(true);
                  } else {
                    safePause(fullscreenVideoRef.current);
                    setFsIsPlaying(false);
                  }
                }}
                className="text-white hover:text-emerald-400 transition cursor-pointer p-1"
                aria-label={fsIsPlaying ? "Jeda" : "Putar"}
              >
                {fsIsPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={fsDuration || 100}
                  value={fsCurrentTime}
                  step={0.1}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setFsCurrentTime(newTime);
                    if (fullscreenVideoRef.current) {
                      fullscreenVideoRef.current.currentTime = newTime;
                    }
                  }}
                  className="flex-1 accent-emerald-500 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-neutral-300 font-mono shrink-0">
                  {formatTime(fsCurrentTime)} / {formatTime(fsDuration)}
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!fullscreenVideoRef.current) return;
                  const newMute = !fullscreenVideoRef.current.muted;
                  fullscreenVideoRef.current.muted = newMute;
                  setFsIsMuted(newMute);
                }}
                className="text-white hover:text-emerald-400 transition cursor-pointer p-1"
                aria-label={fsIsMuted ? "Aktifkan Suara" : "Bisukan"}
              >
                {fsIsMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </footer>
        )}
      </div>,
      document.body
    );
  };

  // =========================================================================
  // 1. KONTEN VIDEO INLINE (Langsung Tampil Instan Seperti Alur FB)
  // =========================================================================
  if (isVideo) {
    return (
      <>
        <div
          className={`w-full relative overflow-hidden bg-neutral-950 flex items-center justify-center select-none feed-media-wrapper ${
            orientation === "vertical" ? "aspect-[4/5] min-h-[320px] max-h-[560px]" : "aspect-[16/10] min-h-[260px] max-h-[560px]"
          } ${className}`}
          style={{ touchAction: "pan-y" }}
          onClick={toggleVideoPlay}
          onPointerDown={handleMediaPointerDown}
          onPointerMove={handleMediaPointerMove}
          onPointerUp={handleMediaPointerUp}
          onPointerCancel={handleMediaPointerCancel}
        >
          <video
            ref={videoRef}
            src={src}
            poster={posterUrl || thumbnail}
            preload="auto"
            className="w-full h-full object-cover object-center cursor-pointer block pointer-events-none"
            style={{ touchAction: "pan-y" }}
            playsInline
            loop
            muted={isMuted}
            onLoadedMetadata={handleVideoMetadata}
            onLoadedData={() => {
              setIsBuffering(false);
            }}
            onError={() => {
              setIsBuffering(false);
              setHasVideoError(true);
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setHasVideoError(false);
              setIsPlaying(true);
            }}
            onCanPlay={() => {
              setIsBuffering(false);
              setHasVideoError(false);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Tampilan pesan bila video rusak atau URL blob temporer */}
          {hasVideoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-4 text-center z-20 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-2 border border-white/10">
                <Video className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-xs font-semibold text-neutral-200">Video tidak dapat dimuat</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 max-w-[240px]">
                URL video telah kedaluwarsa atau berkas belum selesai diunggah.
              </p>
            </div>
          )}

          {/* Indikator Loading Tajeng cina HANYA jika pengguna sedang memutar dan jaringan lambat (buffering) */}
          {isBuffering && isPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xs z-20 pointer-events-none">
              <div className="flex flex-col items-center gap-2 bg-black/60 px-4 py-2.5 rounded-2xl border border-white/15 shadow-lg">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="text-white text-xs font-semibold tracking-wide flex items-center gap-1">
                  Tajeng cina...
                </span>
              </div>
            </div>
          )}

          {/* Kontrol Play/Pause Overlay di tengah */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isPlaying && !isBuffering && (
              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-2xs flex items-center justify-center text-white shadow-xl pointer-events-auto cursor-pointer transition transform hover:scale-110 active:scale-95 border border-white/20">
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </div>
            )}
          </div>

          {/* Tombol Audio Mute / Unmute Inline di Bawah Kanan */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition z-10 cursor-pointer shadow-md pointer-events-auto"
            aria-label={isMuted ? "Aktifkan suara" : "Bisukan"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Tombol Icon Layar Penuh di Atas Kiri */}
          <button
            id="open-video-fullscreen-btn"
            type="button"
            onClick={handleFsBtnClick}
            className="absolute top-3 left-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow-md z-10 active:scale-95 flex items-center justify-center cursor-pointer pointer-events-auto"
            aria-label="Layar Penuh"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Fullscreen */}
        {renderFullscreenModal()}
      </>
    );
  }

  // =========================================================================
  // 2. KONTEN FOTO INLINE (Langsung Tampil Instan Seperti Alur FB)
  // =========================================================================
  return (
    <>
      <div
        className={`w-full relative overflow-hidden bg-neutral-900 select-none feed-media-wrapper ${
          orientation === "vertical" ? "aspect-[4/5] min-h-[320px] max-h-[560px]" : "aspect-[16/10] min-h-[260px] max-h-[560px]"
        } ${className}`}
        style={{ touchAction: "pan-y" }}
        onPointerDown={handleMediaPointerDown}
        onPointerMove={handleMediaPointerMove}
        onPointerUp={handleMediaPointerUp}
        onPointerCancel={handleMediaPointerCancel}
        onClick={openFullscreen}
      >
        {/* Placeholder skeleton halus jika sedang decode perdana di jaringan lambat */}
        {!isImageReady && (
          <div className="absolute inset-0 bg-neutral-800/80 animate-pulse pointer-events-none" />
        )}

        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onLoad={handleImageLoad}
          className={`w-full h-full object-cover object-center block select-none pointer-events-none transition-opacity duration-150 ${
            isImageReady ? "opacity-100" : "opacity-0"
          }`}
          style={{ WebkitTouchCallout: "none", touchAction: "pan-y" }}
        />

        {/* Tombol Icon Layar Penuh di Atas Kiri */}
        <button
          id="open-photo-fullscreen-btn"
          type="button"
          onClick={handleFsBtnClick}
          className="absolute top-3 left-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition shadow-md z-10 active:scale-95 flex items-center justify-center cursor-pointer pointer-events-auto"
          aria-label="Layar Penuh"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Modal Fullscreen */}
      {renderFullscreenModal()}
    </>
  );
};
