import React, { useState, useRef, useEffect } from "react";
import { Heart } from "lucide-react";
import { ReactionType, EMOJI_REACTIONS } from "../types";
import { isScrollInteractionBlocked } from "../utils/scrollGuard";

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number; scrollY: number } | null>(null);
  const pointerMovedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside or scroll
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    const handleScrollClose = () => {
      setShowPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScrollClose, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScrollClose);
    };
  }, [showPicker]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPressRef.current = false;
    pointerMovedRef.current = isScrollInteractionBlocked();
    const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
    pointerStartRef.current = { x: e.clientX, y: e.clientY, scrollY };

    if (pointerMovedRef.current) return;

    timerRef.current = setTimeout(() => {
      if (pointerMovedRef.current || isScrollInteractionBlocked()) return;
      isLongPressRef.current = true;
      setShowPicker(true);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {}
      }
    }, 320);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
    const sdy = Math.abs(scrollY - pointerStartRef.current.scrollY);
    if (dx > 6 || dy > 6 || sdy > 2) {
      pointerMovedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    let moved = pointerMovedRef.current;
    if (pointerStartRef.current) {
      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      const scrollY = typeof window !== "undefined" ? window.scrollY || window.pageYOffset || 0 : 0;
      const sdy = Math.abs(scrollY - pointerStartRef.current.scrollY);
      if (dx > 6 || dy > 6 || sdy > 2) {
        moved = true;
      }
    }
    pointerStartRef.current = null;
    pointerMovedRef.current = false;

    if (moved || isScrollInteractionBlocked()) {
      return;
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
    pointerStartRef.current = null;
    pointerMovedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSelectReaction = (reaction: ReactionType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isScrollInteractionBlocked()) return;
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
      {/* GELEMBUNG PILIHAN REAKSI EMOJI (COMPACT HORIZONTAL BAR) */}
      {showPicker && (
        <div
          className="absolute bottom-full left-0 mb-1.5 z-50 w-max max-w-[calc(100vw-24px)] flex flex-row items-center flex-nowrap gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 bg-white/95 backdrop-blur-md rounded-full border border-neutral-200/90 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.16),0_2px_6px_-1px_rgba(0,0,0,0.06)] select-none"
          role="toolbar"
          aria-label="Pilih Reaksi Emoji"
          onClick={(e) => e.stopPropagation()}
        >
          {EMOJI_REACTIONS.map((item) => {
            const isSelected = userReaction === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={(e) => handleSelectReaction(item.type, e)}
                className={`shrink-0 w-[clamp(30px,8vw,36px)] h-[clamp(30px,8vw,36px)] rounded-full flex items-center justify-center cursor-pointer touch-manipulation transition-transform duration-150 hover:scale-[1.18] active:scale-110 focus:outline-none ${
                  isSelected
                    ? `${item.activeBg} ring-1 ring-neutral-200`
                    : "hover:bg-neutral-100/80"
                }`}
                aria-label={item.label}
              >
                <span className="text-[clamp(18px,4.8vw,22px)] leading-none select-none">
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* TOMBOL UTAMA SUKA / REAKSI */}
      <button
        id={`reaction-btn-${postId}`}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isScrollInteractionBlocked()) {
            setShowPicker(true);
          }
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
