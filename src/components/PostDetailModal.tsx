import React, { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Share2,
  Flag,
  Bookmark,
  Heart,
  Trash2,
  Eye,
  MoreHorizontal,
  Link2,
} from "lucide-react";
import { PostItem, FeedItem, ReactionType } from "../types";
import { FeedMedia } from "./FeedMedia";
import { ShareBar } from "./ShareBar";
import { ReactionButton } from "./ReactionButton";
import { ReactionBadge } from "./ReactionBadge";

interface PostDetailModalProps {
  post: PostItem | null;
  feedItem?: FeedItem | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  onReport?: (id: string, user: string) => void;
  onShare?: (postId: string) => void;
  isSaved?: boolean;
  onToggleSave?: (postId: string) => void;
  isLiked?: boolean;
  likeCount?: number;
  userReaction?: ReactionType | null;
  reactions?: Record<string, number>;
  onReact?: (postId: string, reaction: ReactionType | null) => void;
  onToggleLike?: (id: string) => void;
  views?: number;
  userName?: string;
  initial?: string;
  commentsCount?: number;
  onOpenComments?: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  feedItem,
  onClose,
  onShowToast,
  isOwner,
  onDelete,
  onReport,
  onShare,
  isSaved = false,
  onToggleSave,
  isLiked = false,
  likeCount = 0,
  userReaction,
  reactions,
  onReact,
  onToggleLike,
  views,
  userName = "Kamu",
  initial = "K",
  commentsCount = 0,
  onOpenComments,
}) => {
  if (!post) return null;

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const postViews = views ?? feedItem?.views ?? post.views ?? 0;

  const isVid =
    post.mediaType === "video" ||
    post.img?.startsWith("data:video") ||
    post.img?.includes(".mp4");

  const authorInit = isOwner
    ? initial
    : (post.user ? post.user.trim().replace(/^@/, "")[0] : post.init || "W").toUpperCase();

  const authorName = isOwner ? userName : (post.user || "warga");
  const postText = post.caption || post.title || "Kabar Warga";
  const postLocation = post.loc || feedItem?.location;
  const postTime = post.createdAt || feedItem?.time || "Baru saja";

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex justify-center overflow-hidden overscroll-none select-none animate-fade-in"
      style={{ overscrollBehavior: "none" }}
    >
      <div
        id="post-fullscreen-modal"
        className="w-full h-full max-w-md bg-white flex flex-col relative overflow-hidden"
      >
        {/* Sticky Header Navigasi (Bersih tanpa icon X) */}
        <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shadow-2xs shrink-0">
          <button
            id="close-post-fullscreen-btn"
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-neutral-800 hover:text-[#00632B] transition active:scale-95 cursor-pointer font-bold text-sm"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-800" />
            <span>Kabar Warga</span>
          </button>
        </header>

        {/* Konten Postingan: TAMPILAN PERSIS SAMA SEPERTI DI FEED */}
        <div
          className="flex-1 bg-white overflow-y-auto overscroll-contain"
          style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          <article
            id={`feed-post-${post.id}`}
            className="w-full bg-white space-y-3 pt-3.5 pb-6"
          >
          {/* Post Header: Nama & Waktu tetap satu baris, tidak turun ke bawah */}
          <div className="px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Ikon Profil: Selalu Huruf Pertama Nama Pengguna */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00632B] to-[#0A8742] ring-2 ring-emerald-600/20 ring-offset-1 ring-offset-white flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0 select-none">
                {isOwner
                  ? initial
                  : ((post.user || "").replace(/^@/, "").trim()[0] || authorInit || "K").toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                  <span className="text-[14px] font-bold text-neutral-900 tracking-[-0.01em] truncate max-w-[150px] sm:max-w-[200px]">
                    {authorName.startsWith("@") ? authorName : `@${authorName}`}
                  </span>
                  <span className="text-[11px] text-neutral-300 shrink-0 select-none">·</span>
                  <span className="text-[12px] text-neutral-400 font-medium shrink-0 whitespace-nowrap">
                    {postTime}
                  </span>
                </div>
                {postLocation && (
                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-yellow-500 shrink-0 inline" />
                    <span className="truncate">{postLocation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Icon Titik 3 di Atas Sudut Kanan Postingan */}
            <div className="relative">
              <button
                id={`detail-menu-btn-${post.id}`}
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition cursor-pointer"
                aria-label="Opsi postingan"
              >
                <MoreHorizontal className="w-5 h-5 text-neutral-600" />
              </button>

              {/* Dropdown Menu Titik 3 */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-9 z-40 w-52 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                  >
                    {/* 1. Opsi Simpan Kabar */}
                    {onToggleSave && (
                      <button
                        id={`menu-detail-save-btn-${post.id}`}
                        type="button"
                        onClick={() => {
                          onToggleSave(post.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-50 transition cursor-pointer group"
                      >
                        <Bookmark
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isSaved
                              ? "fill-[#00632B] text-[#00632B]"
                              : "text-neutral-600"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold leading-tight ${isSaved ? "text-[#00632B]" : "text-neutral-800"}`}>
                            {isSaved ? "Hapus dari Simpanan" : "Simpan Kabar"}
                          </p>
                          <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                            {isSaved ? "Tersimpan di koleksi Anda" : "Simpan untuk dibaca nanti"}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* 2. Opsi Laporkan Kabar atau Hapus Kabar */}
                    {isOwner && onDelete ? (
                      <button
                        id={`menu-detail-delete-btn-${post.id}`}
                        type="button"
                        onClick={() => {
                          onDelete(post.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-rose-50 transition cursor-pointer group text-rose-600"
                      >
                        <Trash2 className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-rose-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight text-rose-600">
                            Hapus Kabar
                          </p>
                          <p className="text-[10px] text-rose-400 leading-tight mt-0.5">
                            Hapus postingan Anda
                          </p>
                        </div>
                      </button>
                    ) : !isOwner && onReport ? (
                      <button
                        id={`menu-detail-report-btn-${post.id}`}
                        type="button"
                        onClick={() => {
                          onReport(post.id, post.user || "kabar_warga");
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-rose-50 transition cursor-pointer group text-rose-600"
                      >
                        <Flag className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-rose-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold leading-tight text-rose-600">
                            Laporkan Kabar
                          </p>
                          <p className="text-[10px] text-rose-400 leading-tight mt-0.5">
                            Laporkan jika melanggar
                          </p>
                        </div>
                      </button>
                    ) : null}

                    <div className="my-1 border-t border-neutral-100" />

                    {/* 3. Salin Tautan */}
                    <button
                      id={`menu-detail-copy-btn-${post.id}`}
                      type="button"
                      onClick={() => {
                        if (navigator?.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
                        }
                        if (onShare) onShare(post.id);
                        if (onShowToast) onShowToast("Tautan kabar berhasil disalin");
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-neutral-50 transition cursor-pointer group"
                    >
                      <Link2 className="w-4 h-4 shrink-0 text-neutral-600 transition-transform group-hover:scale-110" />
                      <span className="text-xs font-medium text-neutral-700">Salin Tautan</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Media Foto/Video: Vertikal rasio 4:5 dipotong atas bawah, Horizontal rasio asli */}
          <div id={`detail-post-media-${post.id}`} className="w-full">
            <FeedMedia
              src={post.img}
              thumbnail={post.thumbnail}
              alt={postText}
              description={postText}
              mediaType={isVid ? "video" : "image"}
              author={{
                name: isOwner ? userName : (post.name || post.user || "Kawan Warga Kareba"),
                username: isOwner ? userName : (post.user || "kamu"),
                email: post.email || "iditona5@gmail.com",
                location: postLocation || "Kawasan Sekitar",
                time: postTime,
                initials: authorInit,
                avatar: post.avatar,
                description: postText,
              }}
            />
          </div>

          {/* Post Content / Deskripsi di bawah media - Hanya menampilkan selengkapnya jika teks benar-benar panjang/terpotong */}
          <div className="px-4">
            {(() => {
              const isLong = postText.length > 110 || postText.split("\n").length > 2;
              return (
                <div
                  id={`detail-post-desc-container-${post.id}`}
                  onClick={() => {
                    if (isLong) {
                      setIsExpanded((prev) => !prev);
                    }
                  }}
                  className={`select-none ${isLong ? "cursor-pointer group" : ""}`}
                >
                  <h3
                    className={`text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug transition-all ${
                      isLong && !isExpanded ? "line-clamp-2" : ""
                    }`}
                  >
                    {postText}
                  </h3>
                  {isLong && (
                    <span className="text-xs font-semibold text-[#00632B] hover:text-[#004f22] mt-1 inline-block">
                      {isExpanded ? "Tampilkan lebih sedikit" : "selengkapnya"}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Baris Ringkasan Reaksi (Emoji & Total) - Dapat Diketuk untuk Melihat Rincian Angka per Emoji */}
          {likeCount > 0 && (
            <div className="px-4 pb-1.5 flex items-center justify-between text-xs text-neutral-500">
              <ReactionBadge
                postId={post.id}
                totalLikes={likeCount}
                reactions={reactions}
              />
            </div>
          )}

          {/* Post Actions: Suka / Reaksi, Bagikan, Laporkan / Hapus (Persis seperti di feed, bersih tanpa icon X) */}
          <div className="px-4 flex items-center gap-6 text-xs font-semibold text-neutral-600">
            {onReact ? (
              <ReactionButton
                postId={post.id}
                userReaction={userReaction}
                isLiked={isLiked}
                onReact={onReact}
                variant="detail"
              />
            ) : onToggleLike ? (
              <ReactionButton
                postId={post.id}
                userReaction={userReaction}
                isLiked={isLiked}
                onReact={(pid) => onToggleLike(pid)}
                variant="detail"
              />
            ) : null}

            <button
              id={`share-detail-btn-${post.id}`}
              type="button"
              onClick={() => setIsShareOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 py-1 transition cursor-pointer ${
                isShareOpen ? "text-emerald-600 font-bold" : "hover:text-emerald-600 text-neutral-600"
              }`}
              aria-label="Bagikan"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan</span>
            </button>

            {/* Ikon Tayangan / Dilihat (Fitur Analitik) - Posisi di ujung kanan bar aksi */}
            <div
              className="flex items-center gap-1.5 py-1 text-neutral-500 select-none ml-auto sm:ml-0"
              aria-label={`${postViews.toLocaleString("id-ID")} kali dilihat`}
            >
              <Eye className="w-4 h-4 text-neutral-400" />
              <span>{postViews ? postViews.toLocaleString("id-ID") : 0} dilihat</span>
            </div>
          </div>

          {/* Bar Bagikan Interaktif (FB, WA, Salin) - Persis seperti di Feed */}
          {isShareOpen && (
            <div className="mx-4 mt-2.5 px-3 py-1 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between animate-fade-in">
              <ShareBar
                newsUrl={window.location.href}
                title={postText}
                onShared={() => {
                  if (onShare) onShare(post.id);
                }}
                onShowToast={onShowToast}
              />
            </div>
          )}
        </article>
      </div>
    </div>
  </div>
);
};
