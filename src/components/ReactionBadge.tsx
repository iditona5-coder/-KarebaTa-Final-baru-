import React from "react";

interface ReactionBadgeProps {
  postId?: string;
  totalLikes: number;
  reactions?: Record<string, number>;
  className?: string;
}

/**
 * ReactionBadge:
 * Menampilkan tumpukan emoji respon warga (misal [ ❤️ ][ 😆 ][ 🥲 ]) beserta total angkanya
 * Bersih, ringan, dan tanpa gelembung pop-up rincian (pop-up rincian eksklusif di bar profil atas).
 */
export const ReactionBadge: React.FC<ReactionBadgeProps> = ({
  postId = "badge",
  totalLikes,
  reactions,
  className = "",
}) => {
  if (totalLikes <= 0) return null;

  // Hitung rincian reaksi dan pastikan total sesuai
  const recObj: Record<string, number> = { ...(reactions || {}) };
  const explicitCount = Object.values(recObj).reduce((a, b) => a + b, 0);
  if (totalLikes > explicitCount) {
    recObj["❤️"] = (recObj["❤️"] || 0) + (totalLikes - explicitCount);
  }

  // Urutkan emoji dari yang paling banyak dipilih
  const sortedBreakdown = Object.entries(recObj)
    .filter(([_, cnt]) => cnt > 0)
    .sort((a, b) => b[1] - a[1]);

  const topEmojis = sortedBreakdown.length > 0 ? sortedBreakdown.slice(0, 3).map(([em]) => em) : ["❤️"];

  return (
    <div
      id={`reaction-summary-${postId}`}
      className={`inline-flex items-center gap-1.5 py-0.5 select-none ${className}`}
      aria-label={`${totalLikes} reaksi warga`}
    >
      {/* Tumpukan Emoji Terbanyak Berdampingan */}
      <div className="flex items-center -space-x-1 shrink-0">
        {topEmojis.map((em) => (
          <span
            key={em}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white border border-neutral-200 text-[11px] shadow-2xs leading-none select-none"
          >
            {em}
          </span>
        ))}
      </div>

      {/* Total Angka Reaksi */}
      <span className="font-semibold text-neutral-600 text-[11.5px] leading-none select-none">
        {totalLikes.toLocaleString("id-ID")}
      </span>
    </div>
  );
};
