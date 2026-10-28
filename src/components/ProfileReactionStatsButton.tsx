import React, { useState, useRef, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { EMOJI_REACTIONS } from "../types";

interface ProfileReactionStatsButtonProps {
  totalLikes: number;
  reactions: Record<string, number>;
  onScrollToMyPosts: () => void;
}

export const ProfileReactionStatsButton: React.FC<ProfileReactionStatsButtonProps> = ({
  totalLikes,
  reactions,
  onScrollToMyPosts,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup pop-up jika pengguna mengetuk di luar area
  useEffect(() => {
    if (!showBreakdown) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowBreakdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showBreakdown]);

  // Urutkan emoji reaksi dari yang paling banyak didapatkan
  const sortedBreakdown = Object.entries(reactions)
    .filter(([_, cnt]) => cnt > 0)
    .sort((a, b) => b[1] - a[1]);

  const topEmojis = sortedBreakdown.length > 0 ? sortedBreakdown.slice(0, 3).map(([em]) => em) : ["❤️"];

  return (
    <div ref={containerRef} className="relative flex-1 flex flex-col items-center justify-center">
      <button
        id="profile-reactions-stat-btn"
        type="button"
        onClick={() => {
          if (totalLikes > 0) {
            setShowBreakdown((prev) => !prev);
          } else {
            onScrollToMyPosts();
          }
        }}
        className="w-full flex flex-col items-center justify-center py-1 hover:bg-neutral-200/50 rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
        aria-label="Total reaksi kabar Anda (klik untuk melihat rincian)"
      >
        {/* Tampilan Icon / Tumpukan Emoji di Baris Atas */}
        {totalLikes > 0 ? (
          <div className="flex items-center -space-x-1 mb-1 shrink-0">
            {topEmojis.map((em) => (
              <span
                key={em}
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-neutral-200 text-[11px] shadow-2xs leading-none"
              >
                {em}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-neutral-700 mb-1" aria-label="Icon Suka">
            <Heart className="w-[clamp(18px,5vw,22px)] h-[clamp(18px,5vw,22px)] text-neutral-700" />
          </div>
        )}

        {/* Angka Total Reaksi */}
        <p className="font-bold text-[clamp(15px,4.2vw,17.5px)] text-neutral-900 leading-tight">
          {totalLikes > 0
            ? totalLikes >= 1000
              ? `${(totalLikes / 1000).toFixed(1)}k`
              : totalLikes.toLocaleString("id-ID")
            : 0}
        </p>
      </button>

      {/* POP-UP GELEMBUNG RINCIAN REAKSI DARI WARGA */}
      {showBreakdown && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white/95 backdrop-blur-md border border-neutral-200/90 shadow-2xl rounded-2xl p-3 min-w-[210px] sm:min-w-[240px] animate-in fade-in zoom-in-95 duration-150 select-none text-left"
          style={{ boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Pop-up */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-100">
            <div>
              <p className="text-[11px] font-bold text-neutral-900 leading-tight">
                Reaksi Pada Kabar Anda
              </p>
              <p className="text-[9.5px] text-neutral-400">
                Total {totalLikes.toLocaleString("id-ID")} respon warga
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBreakdown(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              aria-label="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Daftar Rincian Emoji & Angkanya */}
          <div className="space-y-1.5">
            {sortedBreakdown.map(([emoji, count]) => {
              const info = EMOJI_REACTIONS.find((r) => r.type === emoji);
              return (
                <div
                  key={emoji}
                  className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-neutral-50 border border-neutral-200/70"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none drop-shadow-2xs">{emoji}</span>
                    <span className="text-xs font-semibold text-neutral-700">
                      {info ? info.label : "Suka"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 font-mono">
                    {count.toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tombol Jalan Pintas Menuju Kabar Saya */}
          <button
            type="button"
            onClick={() => {
              setShowBreakdown(false);
              onScrollToMyPosts();
            }}
            className="mt-2.5 w-full py-1.5 bg-[#00632B]/10 hover:bg-[#00632B]/20 text-[#00632B] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Lihat Kabar Saya</span>
            <span>&darr;</span>
          </button>
        </div>
      )}
    </div>
  );
};
