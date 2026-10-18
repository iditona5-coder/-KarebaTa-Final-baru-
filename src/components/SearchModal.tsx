import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  SearchX,
  X,
  MapPin,
  User,
  Newspaper,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
  Heart,
  Eye,
  Video,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { FeedItem, PostItem } from "../types";

export type SearchFilterCategory = "all" | "account" | "location" | "news";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed: FeedItem[];
  posts: PostItem[];
  query?: string;
  setQuery?: (q: string) => void;
  activeCategory?: SearchFilterCategory;
  onSelectCategory?: (category: SearchFilterCategory) => void;
  onOpenPostDetail?: (post: PostItem | FeedItem) => void;
  onDeletePost?: (id: string, title?: string, img?: string) => void;
  isMyPost?: (post: FeedItem | PostItem) => boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  feed,
  posts,
  query: externalQuery,
  setQuery: externalSetQuery,
  activeCategory: externalCategory,
  onSelectCategory: externalSetCategory,
  onOpenPostDetail,
  onDeletePost,
  isMyPost,
}) => {
  const [internalQuery, setInternalQuery] = useState("");
  const [internalCategory, setInternalCategory] = useState<SearchFilterCategory>("all");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const setQuery = (val: string) => {
    // Jika mengetik baru, reset drill-down akun atau lokasi terpilih
    setSelectedAccount(null);
    setSelectedLocation(null);
    if (externalSetQuery) {
      externalSetQuery(val);
    } else {
      setInternalQuery(val);
    }
  };

  const activeCategory = externalCategory !== undefined ? externalCategory : internalCategory;
  const setActiveCategory = (cat: SearchFilterCategory) => {
    setSelectedAccount(null);
    setSelectedLocation(null);
    if (externalSetCategory) {
      externalSetCategory(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  // Keyboard navigation escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset drill-down saat modal ditutup atau dibuka kembali
  useEffect(() => {
    if (!isOpen) {
      setSelectedAccount(null);
      setSelectedLocation(null);
    }
  }, [isOpen]);

  const rawCleanQuery = query.trim().toLowerCase();
  const searchAccountQuery = rawCleanQuery.replace(/^@+/, "");
  const searchLocationQuery = rawCleanQuery.replace(/^lokasi:\s*/i, "");
  const searchNewsQuery = rawCleanQuery.replace(/^berita:\s*/i, "");

  // Gabungkan seluruh postingan dari feed dan posts secara unik
  const allAvailablePosts = useMemo(() => {
    const map = new Map<string, FeedItem>();
    feed.forEach((item) => {
      if (!item.isHidden) {
        map.set(item.id, item);
      }
    });
    posts.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, {
          id: item.id,
          user: item.user || "Warga",
          init: item.init || (item.user ? item.user[0].toUpperCase() : "W"),
          name: item.name || item.user || "Warga",
          email: item.email || "",
          time: item.createdAt || "Baru saja",
          text: item.caption || item.title || "",
          img: item.img || "",
          thumbnail: item.thumbnail,
          mediaType: item.mediaType || "image",
          like: 0,
          views: item.views || 0,
          location: item.loc || "Kawasan Sekitar",
          comments: [],
        });
      }
    });
    return Array.from(map.values());
  }, [feed, posts]);

  // 1. HASIL: DAFTAR NAMA AKUN WARGA (Menghitung berapa banyak postingan milik akun tersebut)
  const matchedAccounts = useMemo(() => {
    const map = new Map<string, { user: string; name: string; init: string; postCount: number }>();

    allAvailablePosts.forEach((item) => {
      const cleanUser = (item.user || "").trim().replace(/^@+/, "");
      const cleanName = (item.name || "").trim();
      const u = cleanUser.toLowerCase();
      const n = cleanName.toLowerCase();

      const isMatch =
        !searchAccountQuery ||
        u.includes(searchAccountQuery) ||
        n.includes(searchAccountQuery);

      if (isMatch && cleanUser) {
        const existing = map.get(cleanUser);
        if (existing) {
          existing.postCount += 1;
        } else {
          map.set(cleanUser, {
            user: cleanUser,
            name: cleanName || cleanUser,
            init: item.init || cleanUser.charAt(0).toUpperCase() || "W",
            postCount: 1,
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.postCount - a.postCount);
  }, [allAvailablePosts, searchAccountQuery]);

  // 2. HASIL: DAFTAR LOKASI
  const matchedLocations = useMemo(() => {
    const locMap = new Map<string, number>();

    allAvailablePosts.forEach((item) => {
      if (item.location) {
        const loc = item.location.trim();
        const l = loc.toLowerCase();
        const isMatch = !searchLocationQuery || l.includes(searchLocationQuery);
        if (isMatch) {
          locMap.set(loc, (locMap.get(loc) || 0) + 1);
        }
      }
    });

    return Array.from(locMap.entries())
      .map(([loc, count]) => ({ loc, count }))
      .sort((a, b) => b.count - a.count);
  }, [allAvailablePosts, searchLocationQuery]);

  // 3. HASIL: POSTINGAN BERITA & KABAR WARGA
  const matchedPosts = useMemo(() => {
    // Jika sedang memilih akun tertentu secara spesifik
    if (selectedAccount) {
      const cleanSelected = selectedAccount.toLowerCase().replace(/^@+/, "");
      return allAvailablePosts.filter((item) => {
        const u = (item.user || "").toLowerCase().replace(/^@+/, "");
        const n = (item.name || "").toLowerCase();
        return u === cleanSelected || n === cleanSelected;
      });
    }

    // Jika sedang memilih lokasi tertentu secara spesifik
    if (selectedLocation) {
      const cleanSelected = selectedLocation.toLowerCase();
      return allAvailablePosts.filter((item) => {
        return (item.location || "").toLowerCase().includes(cleanSelected);
      });
    }

    // Jika query berita kosong
    if (!searchNewsQuery) {
      return activeCategory === "news" ? allAvailablePosts : [];
    }

    return allAvailablePosts.filter((item) => {
      const t = (item.text || "").toLowerCase();
      const l = (item.location || "").toLowerCase();
      const u = (item.user || "").toLowerCase().replace(/^@+/, "");
      const n = (item.name || "").toLowerCase();

      return (
        t.includes(searchNewsQuery) ||
        l.includes(searchNewsQuery) ||
        u.includes(searchNewsQuery) ||
        n.includes(searchNewsQuery)
      );
    });
  }, [allAvailablePosts, searchNewsQuery, selectedAccount, selectedLocation, activeCategory]);

  const showAccounts =
    !selectedAccount &&
    !selectedLocation &&
    (activeCategory === "all" || activeCategory === "account");

  const showLocations =
    !selectedAccount &&
    !selectedLocation &&
    (activeCategory === "all" || activeCategory === "location");

  const showPosts =
    Boolean(selectedAccount) ||
    Boolean(selectedLocation) ||
    activeCategory === "all" ||
    activeCategory === "news";

  const hasAnyResult =
    (showAccounts && matchedAccounts.length > 0) ||
    (showLocations && matchedLocations.length > 0) ||
    (showPosts && matchedPosts.length > 0);

  if (!isOpen) return null;

  return (
    <div
      id="search-page-overlay"
      className="fixed inset-x-0 bottom-0 top-[88px] sm:top-[92px] z-40 bg-white flex flex-col max-w-md mx-auto shadow-2xl animate-fade-in overflow-hidden"
    >
      {/* Konten Halaman Pencarian */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/60 pb-20">
        {/* BANNER FILTER AKTIF JIKA MEMILIH AKUN / LOKASI TERTENTU */}
        {(selectedAccount || selectedLocation) && (
          <div className="bg-white p-3 rounded-2xl border border-[#00632B]/30 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              {selectedAccount ? (
                <div className="w-8 h-8 rounded-full bg-[#00632B] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate">
                  {selectedAccount ? `Postingan @${selectedAccount.replace(/^@+/, "")}` : `Lokasi: ${selectedLocation}`}
                </p>
                <p className="text-[11px] text-[#00632B] font-semibold">
                  Ditemukan {matchedPosts.length} kabar di halaman pencarian
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAccount(null);
                setSelectedLocation(null);
              }}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
            >
              Tampilkan Semua
            </button>
          </div>
        )}
        {/* BILAH KONTROL HASIL PENCARIAN & TOMBOL HAPUS/BERSIHKAN PENCARIAN */}
        {(query.trim() !== "" || selectedAccount || selectedLocation) && (
          <div className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#00632B] flex items-center justify-center shrink-0">
                <Search className="w-3.5 h-3.5 text-[#00632B]" />
              </div>
              <p className="text-xs text-neutral-600 truncate">
                Mencari: <span className="font-bold text-neutral-900">&ldquo;{query || selectedAccount || selectedLocation}&rdquo;</span>
              </p>
            </div>
            <button
              id="clear-all-search-btn"
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedAccount(null);
                setSelectedLocation(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 active:scale-95"
              aria-label="Hapus semua pencarian"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hapus Pencarian</span>
            </button>
          </div>
        )}

        {/* JIKA QUERY MASIH KOSONG & BELUM MEMILIH DRILL-DOWN */}
        {query.trim() === "" && !selectedAccount && !selectedLocation ? (
          <div className="space-y-4">
            {/* Kartu Petunjuk Pencarian Cepat */}
            <section className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <Search className="w-4 h-4 text-[#00632B]" />
                <h3 className="font-bold text-neutral-800 text-xs">Pencarian Halaman Tersedia:</h3>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                Ketik kata kunci apa saja di atas. Seluruh hasil pencarian akan langsung muncul secara eksklusif di halaman ini tanpa mengubah tampilan beranda.
              </p>

              {/* Saran Cepat Berdasarkan Kategori */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveCategory("account")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeCategory === "account"
                      ? "bg-[#00632B]/10 border-[#00632B] text-[#00632B]"
                      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                  }`}
                >
                  <User className="w-4 h-4 mb-1 text-[#00632B]" />
                  <span className="block text-[11px] font-bold">Akun Warga</span>
                  <span className="block text-[10px] text-neutral-400">Cari profil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory("location")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeCategory === "location"
                      ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                  }`}
                >
                  <MapPin className="w-4 h-4 mb-1 text-yellow-500" />
                  <span className="block text-[11px] font-bold">Lokasi</span>
                  <span className="block text-[10px] text-neutral-400">Cari tempat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory("news")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeCategory === "news"
                      ? "bg-emerald-50 border-emerald-500 text-[#00632B]"
                      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700"
                  }`}
                >
                  <Newspaper className="w-4 h-4 mb-1 text-emerald-600" />
                  <span className="block text-[11px] font-bold">Berita</span>
                  <span className="block text-[10px] text-neutral-400">Cari kabar</span>
                </button>
              </div>
            </section>

            {/* Lokasi Populer di Aplikasi */}
            {matchedLocations.length > 0 && (
              <section className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Jelajahi Lokasi Warga</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchedLocations.slice(0, 8).map((locItem) => (
                    <button
                      key={locItem.loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(locItem.loc);
                        setSelectedAccount(null);
                      }}
                      className="px-2.5 py-1 bg-neutral-100 hover:bg-yellow-50 hover:border-yellow-300 border border-neutral-200/80 rounded-full text-[11px] font-medium text-neutral-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-2.5 h-2.5 text-yellow-500 shrink-0" />
                      <span>{locItem.loc}</span>
                      <span className="text-[9px] text-neutral-400">({locItem.count})</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Akun Warga Aktif */}
            {matchedAccounts.length > 0 && (
              <section className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <User className="w-3.5 h-3.5 text-[#00632B]" />
                  <span>Akun Warga yang Pernah Berbagi Kabar</span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {matchedAccounts.slice(0, 5).map((acc) => (
                    <div
                      key={acc.user}
                      onClick={() => {
                        setSelectedAccount(acc.user);
                        setSelectedLocation(null);
                      }}
                      className="py-2 flex items-center justify-between hover:bg-neutral-50 px-1 rounded-xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {acc.init}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 group-hover:text-[#00632B] transition truncate">
                            @{acc.user}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">{acc.name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-[#00632B]/10 text-[#00632B] px-2 py-0.5 rounded-full shrink-0">
                        {acc.postCount} postingan
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* SAAT USER MENGETIK / MEMILIH FILTER: HASIL MUNCUL LANGSUNG DI SINI */
          <div className="space-y-4">
            {!hasAnyResult ? (
              <div className="py-12 px-4 text-center bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
                  <SearchX className="w-7 h-7 text-neutral-500" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Tidak ada hasil untuk &ldquo;{query}&rdquo;
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    Hasil pencarian tidak ditemukan di halaman pencarian. Beranda tetap aman dan tidak terpengaruh.
                  </p>
                </div>

                {activeCategory !== "all" && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("all")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Cari di semua kategori</span>
                  </button>
                )}

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-left text-xs text-neutral-600 space-y-1.5 max-w-xs mx-auto">
                  <p className="font-semibold text-neutral-800">Saran Pencarian:</p>
                  <ul className="list-disc list-inside space-y-1 text-neutral-500 text-[11px]">
                    <li>Periksa kembali ejaan kata kunci Anda</li>
                    <li>Gunakan kata kunci lebih umum (misal: <em>Pantai</em>, <em>Talise</em>, <em>Warga</em>)</li>
                    <li>Gunakan tombol kategori di atas untuk mempersempit pencarian</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00632B]/10 text-[#00632B] hover:bg-[#00632B]/20 rounded-full text-xs font-semibold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hapus Ketikan & Ulangi</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. KELOMPOK NAMA AKUN WARGA */}
                {showAccounts && matchedAccounts.length > 0 && (
                  <section className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        <User className="w-3.5 h-3.5 text-[#00632B]" />
                        <span>Akun Warga Cocok ({matchedAccounts.length})</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">Klik untuk melihat postingannya</span>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {matchedAccounts.slice(0, 6).map((acc) => (
                        <div
                          key={acc.user}
                          onClick={() => {
                            setSelectedAccount(acc.user);
                            setSelectedLocation(null);
                          }}
                          className="py-2.5 px-1.5 flex items-center justify-between hover:bg-neutral-50 rounded-xl transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] border border-[#E5A000] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {acc.init}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 group-hover:text-[#00632B] transition truncate">
                                @{acc.user}
                              </p>
                              <p className="text-[11px] text-neutral-500 truncate">{acc.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-semibold bg-[#00632B]/10 text-[#00632B] px-2 py-0.5 rounded-full whitespace-nowrap">
                              {acc.postCount} postingan
                            </span>
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. KELOMPOK LOKASI */}
                {showLocations && matchedLocations.length > 0 && (
                  <section className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Lokasi Cocok ({matchedLocations.length})</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">Klik untuk melihat kabar di lokasi ini</span>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {matchedLocations.slice(0, 6).map((locItem) => (
                        <div
                          key={locItem.loc}
                          onClick={() => {
                            setSelectedLocation(locItem.loc);
                            setSelectedAccount(null);
                          }}
                          className="py-2.5 px-1.5 flex items-center justify-between hover:bg-neutral-50 rounded-xl transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 group-hover:text-yellow-600 transition truncate">
                                {locItem.loc}
                              </p>
                              <p className="text-[11px] text-neutral-500 truncate">
                                Semua kabar warga di sekitar {locItem.loc}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-[10px] font-semibold bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {locItem.count} kabar
                            </span>
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. KELOMPOK POSTINGAN BERITA & KABAR WARGA */}
                {showPosts && matchedPosts.length > 0 && (
                  <section className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        <Newspaper className="w-3.5 h-3.5 text-[#00632B]" />
                        <span>Kabar Berita Cocok ({matchedPosts.length})</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">Klik kartu untuk melihat rincian penuh</span>
                    </div>

                    <div className="space-y-2.5">
                      {matchedPosts.map((post) => {
                        const isVideo =
                          post.mediaType === "video" ||
                          (post.img && (post.img.includes(".mp4") || post.img.startsWith("data:video")));

                        return (
                          <article
                            key={post.id}
                            onClick={() => {
                              if (onOpenPostDetail) {
                                onOpenPostDetail(post);
                              }
                            }}
                            className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-2xs hover:shadow-xs hover:border-[#00632B]/40 transition cursor-pointer flex gap-3 group animate-fade-in"
                          >
                            {/* Thumbnail Media */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                              {post.thumbnail || post.img ? (
                                <img
                                  src={post.thumbnail || post.img}
                                  alt={post.text || "Kabar Warga"}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                  <Newspaper className="w-6 h-6" />
                                </div>
                              )}
                              {isVideo && (
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-xs">
                                    <Video className="w-3 h-3 text-emerald-600 fill-emerald-600 ml-0.5" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Konten & Rincian */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-1">
                                  <span className="font-bold text-neutral-900 truncate max-w-[120px]">
                                    @{post.user?.replace(/^@+/, "")}
                                  </span>
                                  <span>•</span>
                                  <span className="shrink-0 text-[10px] text-neutral-400">{post.time}</span>
                                </div>

                                <p className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-snug group-hover:text-[#00632B] transition">
                                  {post.text || "Momen spesial hari ini"}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 pt-1 border-t border-neutral-100">
                                {post.location ? (
                                  <span className="flex items-center gap-0.5 text-neutral-500 font-medium truncate max-w-[140px]">
                                    <MapPin className="w-3 h-3 text-yellow-500 shrink-0" />
                                    <span className="truncate">{post.location}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-400">Kawasan Sekitar</span>
                                )}

                                <div className="flex items-center gap-2.5 shrink-0 text-[10px] text-neutral-500 font-medium">
                                  <span className="flex items-center gap-0.5">
                                    <Heart className="w-3 h-3 text-red-500" />
                                    <span>{post.like || 0}</span>
                                  </span>
                                  <span className="flex items-center gap-0.5">
                                    <Eye className="w-3 h-3 text-neutral-400" />
                                    <span>{(post.views || 0).toLocaleString("id-ID")}</span>
                                  </span>
                                  {isMyPost && isMyPost(post) && onDeletePost && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeletePost(post.id, post.text, post.img);
                                      }}
                                      className="p-1 px-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition cursor-pointer flex items-center gap-1 border border-rose-200/60 active:scale-95"
                                      title="Hapus kabar ini"
                                      aria-label="Hapus postingan"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span className="text-[10px] font-bold">Hapus</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
