import React, { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import { ReactionType, EMOJI_REACTIONS } from "../types";

interface ReactionButtonProps {
  postId: string;
  userReaction?: ReactionType | null;
  isLiked?: boolean;
  onReact: (postId: string, reaction: ReactionType | null) => void;
  className?: string;
  variant?: "feed" | "detail";
}

export const ReactionButton: React.FC<ReactionButtonProps> = ({
  postId,
  userReaction,
  isLiked = false,
  onReact,
  className = "",
  variant = "feed",
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showPicker]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowPicker(true);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
    }, 320);
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Jika bukan long-press, ini adalah quick tap biasa
    if (!isLongPressRef.current && !showPicker) {
      if (userReaction || isLiked) {
        // Batalkan like / reaksi
        onReact(postId, null);
      } else {
        // Beri reaksi standar ❤️ Suka
        onReact(postId, "❤️");
      }
    }
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSelectReaction = (reaction: ReactionType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPicker(false);
    // Jika memilih reaksi yang sama persis yang sedang aktif, batalkan reaksi
    if (userReaction === reaction) {
      onReact(postId, null);
    } else {
      onReact(postId, reaction);
    }
  };

  // Tentukan label dan gaya tampilan tombol utama
  const activeReactionInfo = userReaction
    ? EMOJI_REACTIONS.find((r) => r.type === userReaction)
    : isLiked
    ? EMOJI_REACTIONS.find((r) => r.type === "❤️")
    : null;

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* GELEMBUNG PILIHAN REAKSI EMOJI (LONG-PRESS / HOVER POP-UP) */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-neutral-200/90 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
          role="toolbar"
          aria-label="Pilih Reaksi Emoji"
          onClick={(e) => e.stopPropagation()}
        >
          {EMOJI_REACTIONS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={(e) => handleSelectReaction(item.type, e)}
              onMouseEnter={() => setHoveredReaction(item.label)}
              onMouseLeave={() => setHoveredReaction(null)}
              className="relative p-1 rounded-full hover:scale-135 active:scale-110 transition-transform duration-150 flex items-center justify-center cursor-pointer group focus:outline-none"
              title={item.label}
              aria-label={item.label}
            >
              {/* Tooltip Nama Reaksi di Atas Emoji */}
              {hoveredReaction === item.label && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-neutral-900/90 text-white text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none animate-in fade-in">
                  {item.label}
                </span>
              )}
              <span className="text-2xl sm:text-3xl leading-none select-none drop-shadow-2xs">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* TOMBOL UTAMA SUKA / REAKSI */}
      <button
        id={`reaction-btn-${postId}`}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPicker(true);
        }}
        className={`flex items-center gap-1.5 py-1.5 min-h-[40px] cursor-pointer transition select-none group ${
          activeReactionInfo
            ? `${activeReactionInfo.color} font-bold`
            : "hover:text-red-500 text-neutral-600"
        } ${className}`}
        aria-label={activeReactionInfo ? activeReactionInfo.label : "Suka"}
      >
        {activeReactionInfo ? (
          activeReactionInfo.type === "❤️" ? (
            <Heart
              className={`${
                variant === "detail"
                  ? "w-4 h-4"
                  : "w-[clamp(18px,4.8vw,21px)] h-[clamp(18px,4.8vw,21px)]"
              } fill-red-500 text-red-500 transition-transform active:scale-125`}
            />
          ) : (
            <span
              className={`${
                variant === "detail" ? "text-base" : "text-[clamp(18px,4.8vw,21px)]"
              } leading-none transition-transform group-active:scale-125 select-none`}
            >
              {activeReactionInfo.type}
            </span>
          )
        ) : (
          <Heart
            className={`${
              variant === "detail"
                ? "w-4 h-4"
                : "w-[clamp(18px,4.8vw,21px)] h-[clamp(18px,4.8vw,21px)]"
            } text-neutral-500 group-hover:text-red-500 transition-transform active:scale-125`}
          />
        )}
        <span className="whitespace-nowrap font-bold">
          {activeReactionInfo ? activeReactionInfo.label : "Suka"}
        </span>
      </button>
    </div>
  );
};
