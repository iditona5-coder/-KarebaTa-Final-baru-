import { useState, useEffect, useRef, useMemo, useCallback, Fragment } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MapPin,
  Camera as CameraIcon,
  Image as ImageIcon,
  CheckCircle2,
  Check,
  Bookmark,
  X,
  Trash2,
  Search,
  Flag,
  ChevronRight,
  ChevronUp,
  PenLine,
  Video,
  Play,
  ArrowLeft,
  LogIn,
  LogOut,
  User as UserIcon,
  Newspaper,
  SlidersHorizontal,
  Eye,
  HelpCircle,
  Megaphone,
  AlertTriangle,
  ShieldCheck,
  MoreHorizontal,
  Link2,
  Clock,
  Plus,
} from "lucide-react";
import { PostDetailModal } from "./components/PostDetailModal";
import { FeedMedia } from "./components/FeedMedia";
import { FeedItem, PostItem, ReportItem, HelpSettings, DEFAULT_HELP_SETTINGS, SponsorAd, AdSettings, DEFAULT_AD_SETTINGS } from "./types";
import { KarebaTaLogo, KarebaPinIcon } from "./components/KarebaTaLogo";
import { SearchModal, SearchFilterCategory } from "./components/SearchModal";
import { CommentActions } from "./components/CommentActions";
import { ShareBar } from "./components/ShareBar";
import { HelpContactModal } from "./components/HelpContactModal";
import { SponsorAdCard } from "./components/SponsorAdCard";
import { SponsorPopupModal } from "./components/SponsorPopupModal";
import {
  extractVideoThumbnail,
  getVideoDuration,
  formatDuration,
  MAX_VIDEO_DURATION_SECONDS,
} from "./utils/thumbnail";
import { compressImageFile } from "./utils/compressor";
import { uploadToImageKit, deleteFromImageKit } from "./services/imagekit";
import { checkContentModeration } from "./utils/contentModeration";
import {
  savePostToFirestore,
  listenToFirestorePosts,
  fetchLatestFirestorePosts,
  deletePostFromFirestore,
  togglePostLikeInFirestore,
  incrementPostViewInFirestore,
  incrementPostShareInFirestore,
  togglePostSaveInFirestore,
  addCommentToFirestore,
  updatePostCommentsInFirestore,
  listenToFirestoreBulletins,
  submitReportToFirestore,
  subscribeToAuth,
  logoutUser,
  saveUserProfile,
  getUserProfile,
  checkRegisteredUser,
  saveRegisteredUserProfile,
  listenToHelpSettings,
  listenToAdminAppConfig,
  listenToBannedUsers,
  checkIfUserBanned,
  BannedUser,
  listenToAdSettings,
  auth,
  User,
  isUserAdmin,
  PRIMARY_ADMIN_EMAIL
} from "./services/firebase";
import { RunningTextBar, BulletinItem } from "./components/RunningTextBar";
import { CardCarousel } from "./components/CardCarousel";
import { PullToRefresh } from "./components/PullToRefresh";
import { AdminDashboard } from "./components/AdminDashboard";
import { preloadFeedMedia } from "./utils/mediaPreloader";
import { LoginModal } from "./components/LoginModal";
import { LoginPage } from "./components/LoginPage";
import { SetupUsernamePage } from "./components/SetupUsernamePage";
import { SplashScreen } from "./components/SplashScreen";

export default function KarebaFeedFinal() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        if (sessionStorage.getItem("karebata_splash_shown") === "true") {
          return false;
        }
        sessionStorage.setItem("karebata_splash_shown", "true");
        return true;
      }
    } catch {}
    return false;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingUploadAction, setPendingUploadAction] = useState<"camera" | "gallery" | null>(null);
  const [loginRedirectMessage, setLoginRedirectMessage] = useState<string | null>(null);

  const [userName, setUserName] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") {
        const directCached =
          localStorage.getItem("karebata_username") ||
          localStorage.getItem("karebata_last_registered_username");
        if (directCached && directCached.trim() && directCached !== "warga_kareba") {
          return directCached.trim().slice(0, 13);
        }
        const activeUid = localStorage.getItem("karebata_active_uid");
        const activeEmail = (localStorage.getItem("karebata_active_email") || "").toLowerCase();
        if (activeUid) {
          const cached = localStorage.getItem(`karebata_custom_username_${activeUid}`);
          if (cached && cached.trim() && cached !== "warga_kareba") return cached.trim().slice(0, 13);
        }
        if (activeEmail) {
          const cached = localStorage.getItem(`karebata_registered_${activeEmail}`);
          if (cached && cached.trim() && cached !== "warga_kareba") return cached.trim().slice(0, 13);
        }
      }
    } catch {}
    return "";
  });
  const userEmail = currentUser?.email || "";
  // Nama pengguna selalu bersumber dari ketikan user (maks 13 huruf), BUKAN alamat email
  const userDisplayName = userName;
  const initial = (userName.trim()[0] || currentUser?.displayName?.[0] || "W").toUpperCase();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const currentUserRef = useRef<User | null>(currentUser);
  currentUserRef.current = currentUser;
  const userNameRef = useRef<string>(userName);
  userNameRef.current = userName;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<"image" | "video">("image");
  const [selectedVideoDuration, setSelectedVideoDuration] = useState<number | null>(null);
  const [videoDurationAlert, setVideoDurationAlert] = useState<{ isOpen: boolean; duration: number } | null>(null);
  const [description, setDescription] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);

  // Status suka (Like) tersimpan di perangkat agar tidak berkedip / hilang saat Firestore menyinkronkan
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("karebata_liked_posts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Postingan yang disembunyikan oleh pengguna (misal konten yang baru saja dilaporkan karena vulgar)
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("karebata_hidden_posts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const likedPostIdsRef = useRef(likedPostIds);
  useEffect(() => {
    likedPostIdsRef.current = likedPostIds;
    try {
      localStorage.setItem("karebata_liked_posts", JSON.stringify(likedPostIds));
    } catch (e) {
      console.warn("Gagal menyimpan liked posts:", e);
    }
  }, [likedPostIds]);

  // Papan Teks Berjalan (Kabar Kilat & Warta Terkini + Info Iklan)
  const [bulletins, setBulletins] = useState<BulletinItem[]>([
    {
      id: "b-promo-1",
      category: "PASANG IKLAN",
      text: "📢 Promosikan Usaha & UMKM Anda di Kareba'Ta! Tarif mulai Rp 25.000 (3 hari) & Rp 50.000 / minggu tayang terus-menerus tanpa batas. Klik untuk chat WhatsApp Admin!",
      location: "Layanan Iklan",
      time: "Aktif",
    },
    {
      id: "b-promo-2",
      category: "IKLAN VIDEO",
      text: "🎬 Tersedia slot Iklan Video & Pop-up tampil di layar utama warga langsung terhubung ke WhatsApp jualan Anda! Hubungi WA Admin: 085351037179.",
      location: "Slot Terbatas",
      time: "Aktif",
    },
    {
      id: "b-1",
      category: "LALU LINTAS",
      text: "Arus lalu lintas pesisir dan jalur protokol terpantau lancar dan nyaman dilalui sore ini.",
      location: "Kawasan Pesisir",
      time: "Terkini",
    },
    {
      id: "b-promo-3",
      category: "PROMO UMKM",
      text: "✨ Mau produk atau jasa Anda laris dilihat ribuan warga sekitar setiap hari? Pasang iklan sekarang juga di Kareba'Ta!",
      location: "Kemitraan Usaha",
      time: "Terkini",
    },
    {
      id: "b-3",
      category: "PRAKIRAAN CUACA",
      text: "BMKG Wilayah: Suhu 26°C - 31°C, hembusan angin sepoi-sepoi dan potensi gerimis ringan di lereng perbukitan.",
      location: "Kawasan Sekitar",
      time: "30 mnt lalu",
    },
  ]);

  // Modals state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpSettings, setHelpSettings] = useState<HelpSettings>(DEFAULT_HELP_SETTINGS);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchFilterCategory>("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeDetailPost, setActiveDetailPost] = useState<PostItem | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [highlightSource, setHighlightSource] = useState<"card" | "search" | "new_upload" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const uploadSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const helpTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success">("idle");
  const [uploadingItem, setUploadingItem] = useState<{
    title: string;
    thumbnail?: string;
    mediaType?: "image" | "video";
  } | null>(null);
  const [lastUploadedPost, setLastUploadedPost] = useState<{
    id: string;
    title: string;
    img?: string;
    thumbnail?: string;
    mediaType?: "image" | "video";
  } | null>(null);
  const [postToDelete, setPostToDelete] = useState<{ id: string; title?: string; img?: string } | null>(null);
  const [reportPostData, setReportPostData] = useState<{ id: string; user: string; text?: string } | null>(null);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reportSuccessInfo, setReportSuccessInfo] = useState<{ targetUser: string; postId: string } | null>(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  // Deteksi rute Dashboard Admin terpisah (/admin atau #/admin atau #admin)
  const isDedicatedAdminRoute = () => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path === "/admin" || path.startsWith("/admin/") || hash === "#admin" || hash === "#/admin";
  };

  const [viewMode, setViewMode] = useState<"login" | "set_name" | "feed" | "admin">(() => {
    if (isDedicatedAdminRoute()) return "admin";
    try {
      if (typeof window !== "undefined") {
        const isSessionActive = sessionStorage.getItem("karebata_session_active") === "true";
        // Hanya izinkan langsung ke feed jika masih berada dalam sesi aktif (misal refresh halaman)
        if (isSessionActive) {
          const isLoggedIn = localStorage.getItem("karebata_is_logged_in") === "true";
          const cachedName = localStorage.getItem("karebata_username") || localStorage.getItem("karebata_last_registered_username");
          if (isLoggedIn && cachedName && cachedName !== "warga_kareba") {
            return "feed";
          }
        }
      }
    } catch {}
    return "login";
  });

  // Pantau perpindahan rute URL (/admin, #/admin, #feed, #login)
  useEffect(() => {
    const handleRouteChange = () => {
      if (isDedicatedAdminRoute()) {
        setViewMode("admin");
        return;
      }
      try {
        sessionStorage.removeItem("karebata_admin_pin_verified");
        sessionStorage.removeItem("karebata_admin_passcode_verified");
      } catch {}
      if (window.location.hash === "#feed") {
        const isSessionActive = typeof window !== "undefined" && sessionStorage.getItem("karebata_session_active") === "true";
        const existingName = userName || (typeof window !== "undefined" && (localStorage.getItem("karebata_username") || localStorage.getItem("karebata_last_registered_username")));
        if (isSessionActive && currentUser && existingName && existingName !== "warga_kareba") {
          if (!userName && existingName) setUserName(existingName.slice(0, 13));
          setViewMode("feed");
        } else if (isSessionActive && currentUser && !existingName) {
          setViewMode("set_name");
        } else {
          setViewMode("login");
        }
      } else if (window.location.hash === "#login") {
        setViewMode("login");
      }
    };
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, [currentUser, userName]);

  // Berlangganan pengumuman kilat secara real-time dari Firestore
  useEffect(() => {
    const unsubBulletins = listenToFirestoreBulletins((remoteBulletins) => {
      if (remoteBulletins && remoteBulletins.length > 0) {
        setBulletins(remoteBulletins);
      }
    });
    return () => unsubBulletins();
  }, []);

  // Berlangganan status autentikasi Google Firebase
  useEffect(() => {
    const unsubAuth = subscribeToAuth(async (user) => {
      const isSessionActive = typeof window !== "undefined" && sessionStorage.getItem("karebata_session_active") === "true";

      if (user) {
        // Jika aplikasi baru dibuka dari luar (bukan reload di sesi aktif yang sama),
        // pengguna wajib menekan tombol login terlebih dahulu.
        if (!isSessionActive) {
          setCurrentUser(null);
          setViewMode((prev) => (prev === "admin" ? "admin" : "login"));
          return;
        }

        setCurrentUser(user);
        try {
          localStorage.setItem("karebata_is_logged_in", "true");
          localStorage.setItem("karebata_active_uid", user.uid);
          if (user.email) {
            localStorage.setItem("karebata_active_email", user.email.toLowerCase());
          }
          sessionStorage.setItem("karebata_session_active", "true");
          sessionStorage.setItem("karebata_active_session", "true");
        } catch {}

        try {
          // Cari nama pengguna dari Firestore & cache lokal secara komprehensif
          const res = await checkRegisteredUser(user.email, user.uid);
          
          const localCached =
            localStorage.getItem("karebata_username") ||
            localStorage.getItem("karebata_last_registered_username") ||
            (user.email ? localStorage.getItem(`karebata_registered_${user.email.toLowerCase()}`) : null) ||
            localStorage.getItem(`karebata_custom_username_${user.uid}`);

          let resolvedUsername = "";
          if (res.isRegistered && res.username && res.username.trim() && res.username.trim() !== "warga_kareba") {
            resolvedUsername = res.username.trim().slice(0, 13);
          } else if (localCached && localCached.trim() && localCached !== "warga_kareba") {
            resolvedUsername = localCached.trim().slice(0, 13);
          } else if (userName && userName.trim() && userName !== "warga_kareba") {
            resolvedUsername = userName.trim().slice(0, 13);
          } else if (user.displayName && user.displayName.trim()) {
            resolvedUsername = user.displayName.trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 13);
          } else if (user.email) {
            resolvedUsername = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 13);
          }

          if (resolvedUsername) {
            setUserName(resolvedUsername);
            try {
              localStorage.setItem("karebata_username", resolvedUsername);
              localStorage.setItem("karebata_last_registered_username", resolvedUsername);
              localStorage.setItem(`karebata_custom_username_${user.uid}`, resolvedUsername);
              if (user.email) {
                localStorage.setItem(`karebata_registered_${user.email.toLowerCase()}`, resolvedUsername);
              }
              sessionStorage.setItem("karebata_session_active", "true");
              sessionStorage.setItem("karebata_active_session", "true");
            } catch {}
            // Tetap di feed dan jangan pernah terlempar ke halaman edit nama saat penyegaran
            setViewMode((prev) => (prev === "admin" ? "admin" : "feed"));
          } else {
            // Hanya jika benar-benar akun baru tanpa nama sama sekali dan bukan sedang di feed
            setViewMode((prev) => (prev === "admin" ? "admin" : prev === "feed" ? "feed" : "set_name"));
          }
        } catch {
          // Fallback aman saat jaringan Firestore sibuk: gunakan nama yang ada di memori/storage lokal
          const fallbackCached = 
            localStorage.getItem("karebata_username") ||
            localStorage.getItem("karebata_last_registered_username") ||
            userName ||
            (user.displayName ? user.displayName.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 13) : "Warga");
          const clean = String(fallbackCached).trim().slice(0, 13);
          setUserName(clean);
          setViewMode((prev) => (prev === "admin" ? "admin" : "feed"));
        }
      } else {
        // User null: jika status lokal masih login (sedang pemulihan token saat refresh), jangan langsung hapus
        const wasLoggedIn = typeof window !== "undefined" && localStorage.getItem("karebata_is_logged_in") === "true";
        if (!wasLoggedIn) {
          setCurrentUser(null);
          setUserName("");
          setViewMode((prev) => (prev === "admin" ? "admin" : "login"));
        }
      }
    });
    return () => unsubAuth();
  }, [userName]);

  // Berlangganan data Akun Warga yang Ditangguhkan / Diblokir secara real-time
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  useEffect(() => {
    const unsubBanned = listenToBannedUsers((items) => {
      setBannedUsers(items);
    });
    return () => unsubBanned();
  }, []);

  // Berlangganan data Pengaturan Iklan Bersponsor secara real-time
  const [adSettings, setAdSettings] = useState<AdSettings>(DEFAULT_AD_SETTINGS);
  const [activePopupAd, setActivePopupAd] = useState<SponsorAd | null>(null);

  useEffect(() => {
    const unsubAds = listenToAdSettings((settings) => {
      setAdSettings(settings);
    });
    return () => unsubAds();
  }, []);

  // Penanganan Iklan Pop-up Otomatis saat Pengguna Membuka Beranda
  useEffect(() => {
    if (!adSettings.isEnabled) return;
    if (adSettings.popupEnabled === false) return;
    const now = Date.now();
    const activeAds = adSettings.ads.filter(
      (a) => a.isActive && (!a.expiresAt || a.expiresAt > now)
    );
    if (activeAds.length === 0) return;

    // Filter iklan yang memiliki format popup atau both, atau default jika belum disetel spesifik
    const popupAds = activeAds.filter(
      (a) => a.displayFormat === "popup" || a.displayFormat === "both" || !a.displayFormat
    );
    if (popupAds.length === 0) return;

    // Cek apakah iklan pop-up sudah pernah ditampilkan di sesi saat ini
    const isShown = typeof window !== "undefined" && sessionStorage.getItem("karebata_popup_ad_shown");
    if (!isShown && viewMode === "feed" && !activePopupAd && !showSplash) {
      const delay = Math.max(1, adSettings.popupDelaySeconds || 2) * 1000;
      const timer = setTimeout(() => {
        const randomAd = popupAds[Math.floor(Math.random() * popupAds.length)];
        setActivePopupAd(randomAd);
        try {
          sessionStorage.setItem("karebata_popup_ad_shown", "true");
        } catch {}
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [adSettings, viewMode, showSplash, activePopupAd]);

  // Window helper untuk memicu atau menguji tampilan pop-up ad secara instan (misal dari Admin Dashboard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__KAREBATA_TRIGGER_POPUP_AD__ = (targetAd?: SponsorAd) => {
        if (targetAd) {
          setActivePopupAd(targetAd);
        } else {
          const activeAds = adSettings.ads.filter((a) => a.isActive);
          const popupAds = activeAds.filter(
            (a) => a.displayFormat === "popup" || a.displayFormat === "both" || !a.displayFormat
          );
          if (popupAds.length > 0) {
            setActivePopupAd(popupAds[0]);
          } else if (activeAds.length > 0) {
            setActivePopupAd(activeAds[0]);
          } else {
            showToast("Belum ada iklan aktif yang dapat ditampilkan sebagai pop-up.");
          }
        }
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).__KAREBATA_TRIGGER_POPUP_AD__;
      }
    };
  }, [adSettings]);

  // Periksa status penangguhan akun pengguna saat ini
  const currentBanStatus = useMemo(() => {
    return checkIfUserBanned(bannedUsers, {
      email: currentUser?.email,
      userName,
      uid: currentUser?.uid,
    });
  }, [bannedUsers, currentUser, userName]);

  // Handler klik kamera di header (harus login terlebih dahulu)
  const handleCameraClick = () => {
    if (currentBanStatus.isBanned) {
      showToast("Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.");
      return;
    }
    if (!currentUser) {
      setLoginRedirectMessage("Masuk dengan Akun Google untuk mengambil foto & membagikan kabar warga.");
      setPendingUploadAction("camera");
      setIsLoginModalOpen(true);
      return;
    }
    openCamera();
  };

  // Handler klik galeri/media di header (harus login terlebih dahulu)
    // Handler klik kartu Ebbu kareba (Buat reel / kabar warga)
  const handleEbbuKarebaClick = () => {
    if (currentBanStatus.isBanned) {
      showToast("Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.");
      return;
    }
    if (!currentUser) {
      setLoginRedirectMessage("Masuk dengan Akun Google untuk membuat kabar atau video reel warga.");
      setPendingUploadAction("gallery");
      setIsLoginModalOpen(true);
      return;
    }
    openCustomGallery();
  };

  const handleGalleryClick = () => {
    if (currentBanStatus.isBanned) {
      showToast("Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.");
      return;
    }
    if (!currentUser) {
      setLoginRedirectMessage("Masuk dengan Akun Google untuk memilih foto atau video dari galeri.");
      setPendingUploadAction("gallery");
      setIsLoginModalOpen(true);
      return;
    }
    openCustomGallery();
  };

  // Callback saat user berhasil login Google:
  // - Pengguna lama (email/akun sudah pernah terdaftar): tidak perlu ngetik nama lagi, langsung masuk beranda!
  // - Pengguna baru (email/akun belum pernah terdaftar): WAJIB masuk halaman ngetik nama terlebih dahulu, baru muncul aplikasi!
  const handleLoginSuccess = async (loggedInUser?: User | null) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("karebata_is_logged_in", "true");
      sessionStorage.setItem("karebata_active_session", "true");
      sessionStorage.setItem("karebata_session_active", "true");
      localStorage.removeItem("kareba_guest_mode");
      sessionStorage.removeItem("kareba_guest_mode");
    }
    setIsLoginModalOpen(false);
    setLoginRedirectMessage(null);

    const activeUser = loggedInUser || currentUser || auth.currentUser;
    if (activeUser) {
      setCurrentUser(activeUser);
    }

    if (!activeUser) {
      return;
    }

    const email = activeUser.email || "";
    const uid = activeUser.uid || "";

    try {
      // Periksa status pendaftaran akun Google ini di database
      const checkRes = await checkRegisteredUser(email, uid);

      if (checkRes.isRegistered && checkRes.username && checkRes.username.trim() && checkRes.username.trim() !== "warga_kareba") {
        // 1. AKUN SUDAH TERDAFTAR SEBELUMNYA: CUKUP LOGIN SAJA, LANGSUNG KE FEED!
        const clean = checkRes.username.trim().slice(0, 13);
        setUserName(clean);
        try {
          localStorage.setItem("karebata_username", clean);
          localStorage.setItem("karebata_last_registered_username", clean);
          localStorage.setItem("karebata_active_uid", uid);
          if (email) localStorage.setItem("karebata_active_email", email.toLowerCase());
        } catch {}
        setViewMode("feed");
        showToast(`Selamat datang kembali, @${clean}!`);
      } else {
        // Cek fallback lokal sebelum mengarahkan ke form nama
        const localFallback =
          localStorage.getItem("karebata_username") ||
          localStorage.getItem("karebata_last_registered_username") ||
          (email ? localStorage.getItem(`karebata_registered_${email.toLowerCase()}`) : null) ||
          localStorage.getItem(`karebata_custom_username_${uid}`);
        if (localFallback && localFallback.trim() && localFallback !== "warga_kareba") {
          const clean = localFallback.trim().slice(0, 13);
          setUserName(clean);
          setViewMode("feed");
          showToast(`Selamat datang kembali, @${clean}!`);
        } else {
          // 2. AKUN BARU ATAU BELUM PERNAH ISI NAMA PENGGUNA: WAJIB MASUK HALAMAN PENGETIKAN NAMA
          setUserName("");
          setViewMode("set_name");
        }
      }
    } catch {
      const fallbackCached = 
        localStorage.getItem("karebata_username") ||
        localStorage.getItem("karebata_last_registered_username") ||
        localStorage.getItem(`karebata_registered_${email.toLowerCase()}`) ||
        localStorage.getItem(`karebata_custom_username_${uid}`);
      if (fallbackCached && fallbackCached.trim() && fallbackCached !== "warga_kareba") {
        const clean = fallbackCached.trim().slice(0, 13);
        setUserName(clean);
        try {
          localStorage.setItem("karebata_username", clean);
          localStorage.setItem("karebata_last_registered_username", clean);
          localStorage.setItem("karebata_active_uid", uid);
          if (email) localStorage.setItem("karebata_active_email", email.toLowerCase());
        } catch {}
        setViewMode("feed");
        showToast(`Selamat datang kembali, @${clean}!`);
      } else {
        setUserName("");
        setViewMode("set_name");
      }
    }
  };

  // Callback simpan nama pengguna baru dari halaman pengetikan nama
  const handleSaveUsername = (typedUsername: string) => {
    const cleanName = typedUsername.trim().replace(/^@/, "").slice(0, 13);
    if (!cleanName) return;

    if (typeof window !== "undefined") {
      sessionStorage.setItem("karebata_active_session", "true");
      sessionStorage.setItem("karebata_session_active", "true");
    }

    setUserName(cleanName);
    try {
      localStorage.setItem("karebata_username", cleanName);
      localStorage.setItem("karebata_last_registered_username", cleanName);
      localStorage.setItem("karebata_is_logged_in", "true");
      if (currentUser?.uid) {
        localStorage.setItem("karebata_active_uid", currentUser.uid);
        localStorage.setItem(`karebata_custom_username_${currentUser.uid}`, cleanName);
      }
      if (currentUser?.email) {
        localStorage.setItem("karebata_active_email", currentUser.email.toLowerCase());
        localStorage.setItem(`karebata_registered_${currentUser.email.toLowerCase()}`, cleanName);
      }
    } catch {}

    if (currentUser?.uid) {
      saveRegisteredUserProfile(currentUser.uid, cleanName, currentUser.email).catch(() => {});
    }

    // Perbarui postingan lokal agar langsung memakai nama yang diketik
    const cleanInitial = (cleanName[0] || "W").toUpperCase();
    setFeed((prev) =>
      prev.map((item) =>
        isMyPost(item)
          ? { ...item, user: cleanName, name: cleanName, init: cleanInitial, avatar: undefined }
          : item
      )
    );
    setPosts((prev) =>
      prev.map((p) =>
        isMyPost(p)
          ? { ...p, user: cleanName, name: cleanName, init: cleanInitial }
          : p
      )
    );

    // SETELAH SIMPAN NAMA -> BARU MUNCUL HALAMAN APLIKASI (BERANDA)!
    setViewMode("feed");
    showToast(`Nama pengguna berhasil disetel: @${cleanName}`);

    const action = pendingUploadAction;
    setPendingUploadAction(null);
    if (action === "camera") {
      setTimeout(() => {
        openCamera();
      }, 400);
    } else if (action === "gallery") {
      setTimeout(() => {
        openCustomGallery();
      }, 400);
    }
  };


  // Handler logout pengguna
  const handleLogout = async () => {
    const ok = await logoutUser();
    if (ok) {
      setCurrentUser(null);
      setUserName("");
      setPosts([]);
      sessionStorage.removeItem("kareba_guest_mode");
      sessionStorage.removeItem("karebata_active_session");
      sessionStorage.removeItem("karebata_session_active");
      localStorage.removeItem("kareba_guest_mode");
      localStorage.removeItem("karebata_is_logged_in");
      setViewMode("login");
      showToast("Berhasil keluar dari akun. Sesi diamankan.");
    }
  };

  // Fungsi Tarik Layar ke Bawah untuk Memperbarui (Pull-to-Refresh)
  const handlePullRefresh = async () => {
    try {
      // 1. Tarik postingan paling mutakhir langsung dari server Firestore
      const freshRemote = await fetchLatestFirestorePosts();
      const deletedIds = new Set<string>();
      try {
        const stored = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
        if (Array.isArray(stored)) stored.forEach((id: string) => deletedIds.add(id));
      } catch {}

      if (freshRemote && freshRemote.length > 0) {
        const cleanRemote = freshRemote.filter((p) => !isDummyMedia(p) && !deletedIds.has(p.id));
        const remoteIds = new Set(cleanRemote.map((p) => p.id));
        const now = Date.now();
        setFeed((prevFeed) => {
          const prevMap = new Map(prevFeed.map((p) => [p.id, p]));
          const currentUid = (currentUser?.email || currentUser?.uid || userName || "").toLowerCase();
          const updated = cleanRemote.map((r) => {
            const prev = prevMap.get(r.id);
            const isLiked =
              likedPostIdsRef.current.includes(r.id) ||
              (currentUid && r.likedBy && r.likedBy.some((u: string) => u.toLowerCase() === currentUid)) ||
              Boolean(prev?.isLiked);
            return {
              ...r,
              isLiked: Boolean(isLiked),
            };
          });
          const localOnly = prevFeed.filter((p) => {
            if (remoteIds.has(p.id) || isDummyMedia(p) || deletedIds.has(p.id)) return false;
            const ts = Number(p.createdAtTimestamp) || 0;
            return ts > 0 && now - ts < 60000;
          });
          const combined = [...updated, ...localOnly];
          combined.sort((a: any, b: any) => (Number(b.createdAtTimestamp) || 0) - (Number(a.createdAtTimestamp) || 0));
          return combined;
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 2. Sinkronisasi status feed yang ada tanpa menambahkan akun atau teks palsu
    setFeed((prev) =>
      prev.filter((f) => !isDummyMedia(f))
    );
    showToast("Kabar terkini berhasil diperbarui!");
  };

  // Helper untuk mengecek apakah suatu postingan adalah milik akun sendiri:
  // - Pada postingan sendiri: HANYA kita yang melihat icon X (Hapus), dan TIDAK melihat icon Laporkan.
  // - Pada postingan orang lain: kita melihat icon Laporkan, dan TIDAK melihat icon X (Hapus).
  const isMyPost = (item: { isMyPost?: boolean; user?: string; email?: string; authorUid?: string }) => {
    const user = currentUserRef.current || currentUser;
    const name = (userNameRef.current || userName || "").trim().toLowerCase();
    if (!user && !name) return false;
    const myUid = (user?.uid || "").trim();
    const myEmail = (user?.email || "").trim().toLowerCase();

    // 1. Cek kecocokan UID unik akun Google (paling presisi antar akun)
    if (myUid && item.authorUid && item.authorUid.trim() === myUid) {
      return true;
    }

    // 2. Cek kecocokan alamat email akun Google
    if (myEmail && item.email && item.email.trim().toLowerCase() === myEmail) {
      return true;
    }

    // 3. Cek kecocokan username / nama akun
    if (name && item.user && item.user.trim().toLowerCase() === name) {
      return true;
    }

    return false;
  };

  // In-app interactive states to avoid window.prompt / alert in iframe
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [newUserNameInput, setNewUserNameInput] = useState("");
  const [activeCommentItem, setActiveCommentItem] = useState<FeedItem | null>(null);
  const [commentInputText, setCommentInputText] = useState("");
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);

  const handleProfileAvatarClick = () => {
    setNewUserNameInput(userName);
    setIsEditProfileOpen(true);
  };

  // Quick stats state: like, komentar, dan bagikan bernilai nol sebelum ada interaksi
  const [stats, setStats] = useState({
    likes: 0,
    komentar: 0,
    bagikan: 0,
  });

  // FUNGSI GALERI CUSTOM - TIDAK PAKAI TAMPILAN BROWSER
  const openCustomGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVid = file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|3gp|avi)$/i.test(file.name);
      
      if (isVid) {
        setIsExtractingThumbnail(true);
        try {
          // Validasi durasi video: batas maksimal 60 detik (1 menit) sangat pas untuk kabar warga
          const dur = await getVideoDuration(file);
          if (dur > MAX_VIDEO_DURATION_SECONDS) {
            setIsExtractingThumbnail(false);
            setVideoDurationAlert({ isOpen: true, duration: dur });
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          setSelectedFile(file);
          setSelectedVideoDuration(dur);
          const url = URL.createObjectURL(file);
          setSelectedImage(url);
          setSelectedMediaType("video");
          const thumb = await extractVideoThumbnail(file);
          setSelectedThumbnail(thumb);
        } catch {
          setSelectedThumbnail(null);
        } finally {
          setIsExtractingThumbnail(false);
        }
      } else {
        setSelectedFile(file);
        setSelectedVideoDuration(null);
        setSelectedMediaType("image");
        setSelectedThumbnail(null);
        // Kompres otomatis gambar: hemat gudang ImageKit & kencang meski sinyal lelet
        const compressedUrl = await compressImageFile(file);
        setSelectedImage(compressedUrl);
      }
    }
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedThumb = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
      setSelectedThumbnail(compressedThumb);
    }
  };

  // FUNGSI KAMERA BAWAAN HP LANGSUNG
  const openCamera = () => {
    // Membuka kamera bawaan HP langsung (native camera)
    cameraInputRef.current?.click();
  };

  const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedMediaType("image");
      setSelectedThumbnail(null);
      // Kompres otomatis hasil jepretan kamera: hemat kuota, super cepat, hemat ImageKit
      const compressedUrl = await compressImageFile(file);
      setSelectedImage(compressedUrl);
      showToast("Foto berhasil diambil dan dioptimalkan!");
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // State postingan disimpan (Bookmark)
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("karebata_saved_posts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Helper pemeriksa apakah suatu postingan adalah media dummy bawaan lama
  const isDummyMedia = (item: any) => {
    if (!item) return true;
    const id = String(item.id || "");
    const img = String(item.img || item.imageUrl || item.thumbnail || "");
    const text = String(item.text || item.title || item.caption || "");
    const user = String(item.user || item.name || "");

    // Cek ID dummy bawaan lama
    const legacyDummyIds = new Set([
      "post-1", "post-2", "post-3", "post-4", "post-5",
      "post-video-1", "post-video-2",
      "feed-1", "feed-2", "feed-3", "feed-4", "feed-5",
      "feed-sample-1", "feed-sample-2",
      "ad-kopi-1", "ad-rental-1"
    ]);
    if (
      legacyDummyIds.has(id) ||
      id.startsWith("feed-sample-") ||
      id.startsWith("ad-kopi-") ||
      id.startsWith("ad-rental-")
    ) {
      return true;
    }
    // Cek URL gambar dummy placeholder bawaan lama
    if (img.includes("unsplash.com") || img.includes("commondatastorage.googleapis.com")) {
      return true;
    }
    // Cek teks placeholder lama & bersihkan semua unsur 'Dumai'
    if (
      text.includes("Pesona Pesisir Bahari") ||
      text.includes("Jembatan Utama Kota") ||
      text.includes("Kuliner Tradisional") ||
      text.includes("Pantai Indah") ||
      text.includes("Pemandangan pegunungan hijau") ||
      text.includes("Selamat datang di Kareba'Ta! Wadah digital") ||
      text.includes("Senja hari ini, tenang banget") ||
      text.toLowerCase().includes("dumai") ||
      user.toLowerCase().includes("dumai")
    ) {
      return true;
    }
    return false;
  };

  // State untuk "Postingan Kamu" (Carousel Kabar Kamu - tersimpan permanen di memori lokal, bersih tanpa dummy)
  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const storedDeleted: string[] = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
      const deletedSet = new Set(storedDeleted);
      const stored = localStorage.getItem("karebata_user_posts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((p) => !isDummyMedia(p) && !deletedSet.has(p.id));
      }
    } catch {}
    return [];
  });

  // State untuk Feed Vertikal (tersimpan permanen di memori lokal & Firestore, bersih tanpa postingan dummy)
  const [feed, setFeed] = useState<FeedItem[]>(() => {
    try {
      const storedDeleted: string[] = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
      const deletedSet = new Set(storedDeleted);
      const stored = localStorage.getItem("karebata_local_feed");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((f) => !isDummyMedia(f) && !deletedSet.has(f.id));
      }
    } catch {}
    return [];
  });

  // Simpan secara otomatis setiap perubahan feed & posts ke localStorage agar tidak pernah hilang saat aplikasi dimuat ulang
  useEffect(() => {
    try {
      localStorage.setItem("karebata_user_posts", JSON.stringify(posts));
    } catch {}
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem("karebata_local_feed", JSON.stringify(feed));
    } catch {}
  }, [feed]);

  // Sinkronkan postingan milik pengguna dari feed ke dalam daftar 'Kabar Kamu' agar tidak pernah hilang
  useEffect(() => {
    let deletedIds = new Set<string>();
    try {
      const stored = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
      if (Array.isArray(stored)) stored.forEach((id: string) => deletedIds.add(id));
    } catch {}

    if (feed.length > 0) {
      setPosts((prev) => {
        const cleanPrev = prev.filter((p) => !deletedIds.has(p.id) && !isDummyMedia(p));
        const myFeedPosts: PostItem[] = feed
          .filter((f) => isMyPost(f) && !isDummyMedia(f) && !deletedIds.has(f.id))
          .map((f) => ({
            id: f.id,
            title: f.text || "Kabar Kamu",
            loc: f.location || "Wilayah Sekitar",
            img: f.img || "",
            thumbnail: f.thumbnail,
            mediaType: f.mediaType || "image",
            caption: f.text || "",
            createdAt: f.time || "Baru saja",
            name: f.name || f.user || "Warga",
            email: f.email || "",
            user: f.user || "warga",
            init: f.init || initial,
            isMyPost: true,
          }));
        if (myFeedPosts.length === 0) return cleanPrev;
        const prevIds = new Set(cleanPrev.map((p) => p.id));
        const missing = myFeedPosts.filter((p) => !prevIds.has(p.id));
        if (missing.length === 0) return cleanPrev;
        return [...missing, ...cleanPrev];
      });
    } else {
      setPosts((prev) => prev.filter((p) => !deletedIds.has(p.id) && !isDummyMedia(p)));
    }
  }, [feed, currentUser, userName, userEmail]);

  // Otomatis gulir ke form unggah saat media dipilih agar tombol posting terlihat penuh dan tidak terpotong
  useEffect(() => {
    if (selectedImage) {
      const timer = setTimeout(() => {
        const composer = document.getElementById("media-post-composer-card");
        if (composer) {
          composer.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [selectedImage]);

  // Total suka/love yang didapatkan oleh postingan kabar milik pengguna sendiri
  // (Jika pengguna menyukai kabar orang lain, angka love di profil sendiri TIDAK akan bertambah)
  const myTotalLikes = useMemo(() => {
    return feed
      .filter((item) => isMyPost(item))
      .reduce((sum, item) => sum + (item.like || 0), 0);
  }, [feed, userName, userEmail, currentUser]);

  // Total berapa kali postingan kabar milik pengguna sendiri dibagikan
  // (Jika pengguna membagikan kabar orang lain, angka bagikan di profil sendiri TIDAK akan bertambah)
  const myTotalShares = useMemo(() => {
    return feed
      .filter((item) => isMyPost(item))
      .reduce((sum, item) => sum + (item.shares || 0), 0);
  }, [feed, userName, userEmail, currentUser]);

  // Total berapa kali postingan kabar milik pengguna sendiri disimpan (bookmark)
  // (Jika pengguna menyimpan kabar orang lain, angka simpan di profil sendiri TIDAK akan bertambah)
  const myTotalSaves = useMemo(() => {
    return feed
      .filter((item) => isMyPost(item))
      .reduce((sum, item) => sum + (item.saves || 0), 0);
  }, [feed, userName, userEmail, currentUser]);

  // Handler saat sebuah kabar dibagikan (menambahkan hitungan share pada postingan tersebut)
  // Angka bagikan di profil atas HANYA bertambah jika postingan yang dibagikan adalah milik Anda sendiri
  const handlePostShared = (postId: string) => {
    setFeed((prev) =>
      prev.map((item) =>
        item.id === postId
          ? { ...item, shares: (item.shares || 0) + 1 }
          : item
      )
    );
    setPosts((prev) =>
      prev.map((item) =>
        item.id === postId
          ? { ...item, shares: (item.shares || 0) + 1 }
          : item
      )
    );
    // Simpan ke Firestore
    incrementPostShareInFirestore(postId);
  };

  // Handler untuk menyimpan / membatalkan simpan sebuah kabar (Bookmark)
  // - Menambahkan / menghapus dari daftar tersimpan milik pengguna (savedPostIds)
  // - Menambahkan / mengurangi jumlah saves pada postingan tersebut
  // - Angka Simpan di profil atas HANYA bertambah jika kabar yang disimpan adalah milik Anda sendiri!
  const handleToggleSave = (postId: string) => {
    const isCurrentlySaved = savedPostIds.includes(postId);
    const willBeSaved = !isCurrentlySaved;

    setSavedPostIds((prev) => {
      const next = prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem("karebata_saved_posts", JSON.stringify(next));
      } catch {
        // Abaikan jika penyimpanan terbatas
      }
      return next;
    });

    showToast(isCurrentlySaved ? "Dihapus dari kabar tersimpan" : "Kabar berhasil disimpan!");

    // Update saves count di feed
    setFeed((prev) =>
      prev.map((item) => {
        if (item.id === postId) {
          const cur = item.saves || 0;
          return {
            ...item,
            saves: willBeSaved ? cur + 1 : Math.max(0, cur - 1),
          };
        }
        return item;
      })
    );

    // Update saves count di posts jika ada
    setPosts((prev) =>
      prev.map((item) => {
        if (item.id === postId) {
          const cur = item.saves || 0;
          return {
            ...item,
            saves: willBeSaved ? cur + 1 : Math.max(0, cur - 1),
          };
        }
        return item;
      })
    );

    // Simpan ke Firestore
    togglePostSaveInFirestore(postId, willBeSaved ? 1 : -1);
  };

  // Beranda selalu menampilkan seluruh kabar warga asli (pencarian tampil eksklusif di Halaman Pencarian)
  const displayFeed = useMemo(() => {
    return feed.filter((item) => !item.isHidden && !hiddenPostIds.includes(item.id));
  }, [feed, hiddenPostIds]);

  // Helper untuk menggulirkan layar langsung tertuju ke media postingan di feed
  const scrollToFeedMedia = (postId: string) => {
    // Cari elemen media langsung dari postingan di feed
    const mediaEl =
      document.getElementById(`feed-post-media-${postId}`) ||
      document.getElementById(`feed-post-${postId}`) ||
      document.getElementById("feed-vertical-container");

    if (mediaEl) {
      const headerEl = document.getElementById("karebata-feed-header");
      const headerH = headerEl ? headerEl.offsetHeight + 10 : 65;
      const rect = mediaEl.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetTop = rect.top + scrollTop - headerH;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    }
  };

  // Deteksi jarak scroll untuk memunculkan tombol kembali ke atas ketika terscroll jauh (> 350px)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Matikan 100% semua menu dan gestur bawaan browser (Context Menu, Long-press Popup, Drag Ghosting)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return; // Izinkan hanya pada input formulir untuk keperluan paste/ketik
      }
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  // Sinkronisasi postingan real-time dari Firestore proyek pribadi
  useEffect(() => {
    const unsubscribe = listenToFirestorePosts((remotePosts) => {
      const deletedIds = new Set<string>();
      try {
        const stored = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
        if (Array.isArray(stored)) stored.forEach((id: string) => deletedIds.add(id));
      } catch {}

      const remoteList = (remotePosts || []).filter((p) => !isDummyMedia(p) && !deletedIds.has(p.id));
      const remoteIds = new Set(remoteList.map((p) => p.id));
      const now = Date.now();

      setFeed((prevFeed) => {
        const prevMap = new Map(prevFeed.map((p) => [p.id, p]));
        const currentUid = (currentUserRef.current?.email || currentUserRef.current?.uid || userNameRef.current || "").toLowerCase();

        const updatedRemote = remoteList.map((r) => {
          const prev = prevMap.get(r.id);
          const isLiked =
            likedPostIdsRef.current.includes(r.id) ||
            (currentUid && r.likedBy && r.likedBy.some((u: string) => u.toLowerCase() === currentUid)) ||
            Boolean(prev?.isLiked);
          return {
            ...r,
            isLiked: Boolean(isLiked),
          };
        });

        // Pertahankan HANYA postingan lokal baru yang dibuat kurang dari 60 detik lalu dan belum tersinkron (JANGAN BANGKITKAN POSTINGAN LAMA YANG DIHAPUS)
        const localOnly = prevFeed.filter((p) => {
          if (remoteIds.has(p.id)) return false;
          if (isDummyMedia(p)) return false;
          if (deletedIds.has(p.id)) return false;
          const ts = Number(p.createdAtTimestamp) || 0;
          return ts > 0 && now - ts < 60000;
        });

        // Otomatis sinkronkan postingan lokal baru warga ke Firestore cloud
        if (localOnly.length > 0) {
          localOnly.forEach((localItem) => {
            const matchingPost: PostItem = {
              id: localItem.id,
              title: localItem.text || "Kabar Warga",
              loc: localItem.location || "Wilayah Sekitar",
              img: localItem.img,
              thumbnail: localItem.thumbnail,
              mediaType: localItem.mediaType || "image",
              caption: localItem.text || "",
              createdAt: localItem.time || "Baru saja",
              name: localItem.name || localItem.user || "Warga",
              email: localItem.email || "",
              user: localItem.user || "warga",
              init: localItem.init || "W",
              isMyPost: true,
              createdAtTimestamp: Number(localItem.createdAtTimestamp) || Date.now(),
            };
            savePostToFirestore(localItem, matchingPost).catch(() => {});
          });
        }

        const combined = [...updatedRemote, ...localOnly];
        combined.sort((a: any, b: any) => (Number(b.createdAtTimestamp) || 0) - (Number(a.createdAtTimestamp) || 0));
        return combined;
      });

      // Sinkronkan juga daftar "Kabar Kamu" (carousel atas)
      setPosts((prevPosts) => {
        const remoteUserPosts: PostItem[] = remoteList
          .filter((p) => isMyPost(p) && !deletedIds.has(p.id))
          .map((p) => ({
            id: p.id,
            title: p.text || "Kabar Kamu",
            loc: p.location || "Wilayah Sekitar",
            img: p.img,
            thumbnail: p.thumbnail,
            mediaType: p.mediaType || "image",
            caption: p.text || "",
            createdAt: p.time || "Baru saja",
            name: p.name || p.user || "Warga",
            email: p.email || "",
            user: p.user || "warga",
            init: p.init || (p.user ? p.user[0].toUpperCase() : "W"),
            isMyPost: true,
            createdAtTimestamp: Number(p.createdAtTimestamp) || Date.now(),
          }));

        const remoteUserIds = new Set(remoteUserPosts.map((p) => p.id));
        const localUserPosts = prevPosts.filter((p) => {
          if (remoteUserIds.has(p.id)) return false;
          if (!isMyPost(p)) return false;
          if (isDummyMedia(p)) return false;
          if (deletedIds.has(p.id)) return false;
          const ts = Number(p.createdAtTimestamp) || 0;
          return ts > 0 && now - ts < 60000;
        });

        const combinedPosts = [...remoteUserPosts, ...localUserPosts];
        combinedPosts.sort((a: any, b: any) => (Number(b.createdAtTimestamp) || 0) - (Number(a.createdAtTimestamp) || 0));
        return combinedPosts;
      });
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Berlangganan data Pengaturan WhatsApp Admin & Bantuan Warga secara real-time
  useEffect(() => {
    const unsubHelp = listenToHelpSettings((settings) => {
      setHelpSettings(settings);
    });

    const unsubConfig = listenToAdminAppConfig((cfg) => {
      setHelpSettings((prev) => ({
        ...prev,
        whatsappNumber: cfg.adminWhatsapp || prev.whatsappNumber,
        workingHours: cfg.adminWorkingHours || prev.workingHours,
      }));
    });

    return () => {
      unsubHelp();
      unsubConfig();
    };
  }, []);

  // Preload cerdas media beranda (gambar & video poster) ke memori GPU browser
  // sehingga saat pengguna menggulir (scroll), media sudah 100% matang tanpa kedipan tirai atau muncul setengah
  useEffect(() => {
    const mediaUrls: (string | undefined)[] = [];
    feed.forEach((f) => {
      if (f.img) mediaUrls.push(f.img);
      if (f.thumbnail) mediaUrls.push(f.thumbnail);
    });
    if (adSettings?.ads) {
      adSettings.ads.forEach((ad) => {
        if (ad.imageUrl) mediaUrls.push(ad.imageUrl);
      });
    }
    if (mediaUrls.length > 0) {
      preloadFeedMedia(mediaUrls);
    }
  }, [feed, adSettings]);

  // Fungsi untuk naik kembali ke media di atas dengan animasi halus
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Kunci scroll layar latar belakang saat modal/pencarian/pop-up aktif agar beranda belakang tidak ikut tergulir
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      isSearchOpen ||
      isHelpOpen ||
      isEditProfileOpen ||
      reportPostData ||
      postToDelete ||
      activeCommentItem ||
      activeDetailPost ||
      activePopupAd ||
      isLoginModalOpen ||
      videoDurationAlert?.isOpen
    );

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [
    isSearchOpen,
    isHelpOpen,
    isEditProfileOpen,
    reportPostData,
    postToDelete,
    activeCommentItem,
    activeDetailPost,
    activePopupAd,
    isLoginModalOpen,
    videoDurationAlert,
  ]);

  // Efek penandaan postingan ketika kata pencarian cocok
  useEffect(() => {
    if (!isSearchOpen || !searchQuery.trim()) {
      setHighlightedPostId(null);
      setHighlightSource(null);
      return;
    }

    if (displayFeed.length > 0) {
      setHighlightedPostId(displayFeed[0].id);
      setHighlightSource("search");
    } else {
      setHighlightedPostId(null);
    }
  }, [searchQuery, isSearchOpen, displayFeed]);

  // Lacak postingan yang sudah dihitung tayangannya (view) dalam sesi ini agar tidak dihitung berulang-ulang
  const viewedPostIdsRef = useRef<Set<string>>(new Set());

  const handleRegisterView = useCallback((postId: string) => {
    if (!postId || viewedPostIdsRef.current.has(postId)) return;
    viewedPostIdsRef.current.add(postId);

    // Update optimis di state lokal feed agar angka di layar pengguna langsung bertambah seketika
    setFeed((prevFeed) =>
      prevFeed.map((item) =>
        item.id === postId
          ? { ...item, views: (item.views || 0) + 1 }
          : item
      )
    );

    // Simpan penambahan tayangan ke basis data Firestore
    incrementPostViewInFirestore(postId);
  }, []);

  // Daftarkan pengamat scroll (IntersectionObserver) untuk menghitung tayangan secara otomatis saat kabar terlihat di layar
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute("data-post-id");
            if (postId) {
              handleRegisterView(postId);
            }
          }
        });
      },
      {
        threshold: 0.35, // Terhitung tayang saat minimal 35% postingan masuk ke layar HP
      }
    );

    const postElements = document.querySelectorAll("[data-post-id]");
    postElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [displayFeed, handleRegisterView]);

  // Fungsi ketika klik salah satu kartu kabar kamu atau kartu tersimpan: memunculkan tampilan layar penuh (full screen)
  const handleOpenCardInFeed = (p: PostItem) => {
    if (p.id) {
      handleRegisterView(p.id);
    }
    // Cari postingan yang sesuai di dalam daftar feed
    let target = feed.find((f) => f.id === p.id || (p.img && f.img === p.img));
    const isOwner = isMyPost(p) || (target ? isMyPost(target) : false);

    if (!target) {
      // Jika belum ada di feed warga, sisipkan langsung agar bisa dilihat
      target = {
        id: p.id,
        user: p.user || "warga",
        init: p.init || (p.user ? p.user[0].toUpperCase() : "W"),
        name: p.name || p.user || "Warga",
        email: p.email,
        avatar: p.avatar,
        time: p.createdAt || "Baru saja",
        text: p.caption || p.title || "Kabar Warga",
        img: p.img,
        thumbnail: p.thumbnail,
        mediaType: p.mediaType || "image",
        like: 0,
        isLiked: false,
        location: p.loc,
        comments: [],
        isMyPost: isOwner,
      };
      setFeed((prev) => [target!, ...prev]);
    }

    // Buka tampilan LAYAR PENUH (FULL SCREEN) persis seperti di feed
    const fullText = p.caption || target.text || p.title || "Kabar Warga";
    setActiveDetailPost({
      id: target.id,
      title: fullText,
      caption: fullText,
      loc: p.loc || target.location || "Sulawesi Tengah",
      img: p.img || target.img,
      thumbnail: p.thumbnail || target.thumbnail,
      mediaType: p.mediaType || target.mediaType || "image",
      createdAt: p.createdAt || target.time || "Baru saja",
      name: target.name || p.name || target.user || p.user || "Warga",
      email: target.email || p.email,
      user: target.user || p.user || "warga",
      init: ((target.user || p.user || "W").trim().replace(/^@/, "")[0] || "W").toUpperCase(),
      avatar: target.avatar || p.avatar,
      isMyPost: isOwner,
    });
  };

  // State untuk melipat / membuka deskripsi panjang yang dipotong
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const toggleExpandPost = (id: string) => {
    const isCurrentlyExpanded = !!expandedPosts[id];

    setExpandedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    // Jika sedang melipat kembali ke deskripsi terpotong:
    // Pastikan posisi layar tetap pas di postingan ini agar tidak melompat ke postingan lain
    if (isCurrentlyExpanded) {
      setTimeout(() => {
        const targetPost = document.getElementById(`post-card-${id}`);
        if (!targetPost) return;

        const header = document.getElementById("karebata-feed-header");
        const headerH = header ? header.offsetHeight : 54;
        const rect = targetPost.getBoundingClientRect();

        // Jika bagian atas postingan terdorong ke atas melebihi header saat teks mengkerut,
        // kembalikan pandangan layar tepat pas di postingan tersebut di bawah header
        if (rect.top < headerH) {
          const targetY = window.scrollY + rect.top - headerH;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: "smooth",
          });
        }
      }, 40);
    }
  };

  // Toggle Like pada feed (sinkron dengan counter like di atas)
  const handleToggleLike = (id: string) => {
    const targetItem = feed.find((item) => item.id === id);
    if (!targetItem) return;

    const newLiked = !targetItem.isLiked;

    // Perbarui daftar ID postingan yang disukai (tersimpan di localStorage)
    setLikedPostIds((prev) => {
      if (newLiked) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter((item) => item !== id);
      }
    });

    setFeed((prevFeed) =>
      prevFeed.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isLiked: newLiked,
            like: newLiked ? item.like + 1 : Math.max(0, item.like - 1),
          };
        }
        return item;
      })
    );

    // Sinkronkan ke database Firestore proyek pribadi
    const updatedCount = newLiked ? targetItem.like + 1 : Math.max(0, targetItem.like - 1);
    const userIdentifier = currentUser?.email || currentUser?.uid || userName || "warga_kareba";
    togglePostLikeInFirestore(id, updatedCount, userIdentifier, newLiked);
  };

  // State untuk menampilkan baris kartu kecil postingan tersimpan saat icon tersimpan diklik
  const [showSavedSection, setShowSavedSection] = useState(false);

  // Kompilasi kartu tersimpan dari koleksi postingan horizontal dan feed (otomatis hilang jika postingan dihapus oleh admin)
  const savedItems: PostItem[] = useMemo(() => {
    let deletedIds = new Set<string>();
    try {
      const stored = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
      if (Array.isArray(stored)) stored.forEach((id: string) => deletedIds.add(id));
    } catch {}

    return savedPostIds
      .filter((id) => !deletedIds.has(id))
      .map((id) => {
        const foundFeed = feed.find((f) => f.id === id && !deletedIds.has(f.id));
        if (foundFeed) {
          return {
            id: foundFeed.id,
            title: foundFeed.text,
            loc: foundFeed.location || "Kawasan Sekitar",
            img: foundFeed.img || "",
            thumbnail: foundFeed.thumbnail,
            mediaType: foundFeed.mediaType,
            caption: foundFeed.text,
            createdAt: foundFeed.time,
            name: foundFeed.name,
            user: foundFeed.user,
            email: foundFeed.email,
            init: foundFeed.init,
            avatar: foundFeed.avatar,
            isMyPost: isMyPost(foundFeed),
          };
        }
        const foundPost = posts.find((p) => p.id === id && !deletedIds.has(p.id));
        if (foundPost) return foundPost;
        return null;
      })
      .filter((item): item is PostItem => item !== null);
  }, [savedPostIds, feed, posts]);

  // Handler Like pada Komentar
  const handleLikeComment = (commentId: string) => {
    if (!activeCommentItem) return;
    setFeed((prevFeed) =>
      prevFeed.map((item) => {
        if (item.id === activeCommentItem.id) {
          return {
            ...item,
            comments: (item.comments || []).map((comm) => {
              if (comm.id === commentId) {
                const currentLikes = comm.likes ?? 0;
                const isNowLiked = !comm.isLiked;
                return {
                  ...comm,
                  isLiked: isNowLiked,
                  likes: isNowLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
                };
              }
              return comm;
            }),
          };
        }
        return item;
      })
    );
    const updatedComments = (activeCommentItem.comments || []).map((comm) => {
      if (comm.id === commentId) {
        const currentLikes = comm.likes ?? 0;
        const isNowLiked = !comm.isLiked;
        return {
          ...comm,
          isLiked: isNowLiked,
          likes: isNowLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
        };
      }
      return comm;
    });

    setActiveCommentItem((prev) =>
      prev
        ? {
            ...prev,
            comments: updatedComments,
          }
        : null
    );

    updatePostCommentsInFirestore(activeCommentItem.id, updatedComments);
  };

  // Handler Balas Komentar
  const handleReplyComment = (commentUser: string) => {
    setCommentInputText(`@${commentUser} `);
    const inputEl = document.getElementById("comment-input-field");
    if (inputEl) {
      inputEl.focus();
    }
  };

  // Handler Hapus Komentar (hanya pemilik komentar)
  const handleDeleteComment = (commentId: string) => {
    if (!activeCommentItem) return;
    const remainingComments = (activeCommentItem.comments || []).filter((comm) => comm.id !== commentId);

    setFeed((prevFeed) =>
      prevFeed.map((item) => {
        if (item.id === activeCommentItem.id) {
          return {
            ...item,
            comments: remainingComments,
          };
        }
        return item;
      })
    );
    setActiveCommentItem((prev) =>
      prev
        ? {
            ...prev,
            comments: remainingComments,
          }
        : null
    );
    setStats((prev) => ({
      ...prev,
      komentar: Math.max(0, prev.komentar - 1),
    }));
    showToast("Komentar berhasil dihapus");

    // Simpan perubahan ke Firestore
    updatePostCommentsInFirestore(activeCommentItem.id, remainingComments);
  };

  // Handler Kirim Komentar Baru (Wajib Login Google)
  const handleSubmitComment = () => {
    if (currentBanStatus.isBanned) {
      showToast("Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.");
      return;
    }
    if (!currentUser) {
      setLoginRedirectMessage("Masuk dengan Akun Google terlebih dahulu untuk mengirim komentar.");
      setIsLoginModalOpen(true);
      return;
    }
    if (!commentInputText.trim() || !activeCommentItem) return;
    const text = commentInputText.trim();

    // Filter Kata Jorok / Asusila / Makian pada komentar (100% Gratis)
    const commentCheck = checkContentModeration(text);
    if (!commentCheck.isClean) {
      showToast(`Komentar ditolak: Mengandung kata tidak pantas ("${commentCheck.flaggedWord}"). Mohon gunakan bahasa yang santun.`);
      return;
    }

    const newComment = {
      id: `c-${Date.now()}`,
      user: userName,
      text: text,
      time: "Baru saja",
      likes: 0,
      isLiked: false,
    };

    setFeed((prev) =>
      prev.map((item) =>
        item.id === activeCommentItem.id
          ? {
              ...item,
              comments: [...(item.comments || []), newComment],
            }
          : item
      )
    );
    setActiveCommentItem((prev) =>
      prev
        ? {
            ...prev,
            comments: [...(prev.comments || []), newComment],
          }
        : null
    );
    setCommentInputText("");
    setStats((prev) => ({ ...prev, komentar: prev.komentar + 1 }));
    showToast("Komentar terkirim!");

    // Simpan komentar ke Firestore database
    addCommentToFirestore(activeCommentItem.id, newComment);
  };

  // Deteksi kata jorok / asusila / kasar secara real-time pada form postingan (100% Gratis)
  const moderationWarning = useMemo(() => {
    if (!description.trim() && !selectedLocation.trim()) return null;
    const descCheck = checkContentModeration(description);
    if (!descCheck.isClean) {
      return descCheck;
    }
    const locCheck = checkContentModeration(selectedLocation);
    if (!locCheck.isClean) {
      return locCheck;
    }
    return null;
  }, [description, selectedLocation]);

  // Cek apakah ketiga syarat (media, deskripsi minimal 99 huruf, lokasi) sudah terisi lengkap dan bersih dari kata terlarang
  const isPublishReady =
    Boolean(selectedImage) &&
    description.trim().length >= 99 &&
    selectedLocation.trim().length > 0 &&
    !moderationWarning;

  // Fungsi Posting Baru ke Feed & Postingan Kamu
  const handleCreatePost = () => {
    if (currentBanStatus.isBanned) {
      showToast("Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.");
      return;
    }
    if (!currentUser) {
      setLoginRedirectMessage("Silakan masuk dengan Akun Google terlebih dahulu untuk menerbitkan kabar.");
      setIsLoginModalOpen(true);
      return;
    }
    if (!selectedImage) {
      showToast("Pilih foto atau video terlebih dahulu!");
      return;
    }
    if (description.trim().length < 99) {
      showToast(`Deskripsi kabar minimal 99 huruf baru bisa dibagikan! (Saat ini: ${description.trim().length} huruf)`);
      return;
    }
    if (!selectedLocation.trim()) {
      showToast("Isi lokasi kabar terlebih dahulu!");
      return;
    }

    // Pos pemeriksaan moderasi kata jorok, porno, dan kasar (100% Gratis)
    if (moderationWarning && !moderationWarning.isClean) {
      showToast(`Ditolak: ${moderationWarning.reason} Terdeteksi: "${moderationWarning.flaggedWord}".`);
      return;
    }
    const checkDesc = checkContentModeration(description);
    if (!checkDesc.isClean) {
      showToast(`Ditolak: ${checkDesc.reason} Dilarang menggunakan kata "${checkDesc.flaggedWord}".`);
      return;
    }
    const checkLoc = checkContentModeration(selectedLocation);
    if (!checkLoc.isClean) {
      showToast(`Ditolak: Lokasi mengandung kata tidak pantas ("${checkLoc.flaggedWord}").`);
      return;
    }

    // Ambil snapshot data form saat tombol diklik
    const mediaToUpload = selectedFile || selectedImage;
    const initialMediaUrl = selectedImage;
    const initialThumbnailUrl = selectedThumbnail || (selectedMediaType === "image" ? selectedImage : undefined);
    const currentMediaType = selectedMediaType;
    const finalDesc = description.trim().slice(0, 500);
    const finalLoc = selectedLocation.trim().slice(0, 30);
    const postTitle = finalDesc.split("\n")[0].slice(0, 24) || "Momen Spesial";
    const feedId = `kareba-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const postId = feedId;

    // LANGSUNG KOSONGKAN FORM (Media, Deskripsi, dan Lokasi HILANG SEKETIKA agar bisa langsung posting lagi)
    setSelectedImage(null);
    setSelectedFile(null);
    setSelectedThumbnail(null);
    setSelectedVideoDuration(null);
    setDescription("");
    setSelectedLocation("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }

    setUploadingItem({
      title: postTitle,
      thumbnail: initialThumbnailUrl || (typeof initialMediaUrl === "string" ? initialMediaUrl : undefined),
      mediaType: currentMediaType,
    });
    setUploadStatus("uploading");

    // PROSES UPLOAD DI LATAR BELAKANG (Indikator di bawah papan tombol)
    setUploadingCount((prev) => prev + 1);

    (async () => {
      let finalMediaUrl = initialMediaUrl;
      let finalThumbnailUrl = initialThumbnailUrl;
      let uploadedFileId: string | undefined;
      let uploadedThumbFileId: string | undefined;

      try {
        // Unggah media utama ke ImageKit CDN
        const uploadRes = await uploadToImageKit(
          mediaToUpload,
          `kareba_${Date.now()}.${currentMediaType === "video" ? "mp4" : "jpg"}`
        );
        if (uploadRes && uploadRes.url) {
          finalMediaUrl = uploadRes.url;
          uploadedFileId = uploadRes.fileId;
          if (!finalThumbnailUrl && uploadRes.thumbnailUrl) {
            finalThumbnailUrl = uploadRes.thumbnailUrl;
          }
        }

        // Jika video memiliki cover thumbnail terpisah
        if (currentMediaType === "video" && initialThumbnailUrl && initialThumbnailUrl.startsWith("data:")) {
          const thumbRes = await uploadToImageKit(
            initialThumbnailUrl,
            `thumb_${Date.now()}.jpg`
          );
          if (thumbRes && thumbRes.url) {
            finalThumbnailUrl = thumbRes.url;
            uploadedThumbFileId = thumbRes.fileId;
          }
        }
      } catch (err) {
        console.warn("Gagal unggah ke ImageKit, menggunakan cache lokal:", err);
      }

      // KABAR BARU MUNCUL DI FEED & KABAR KAMU SETELAH PROSES UNGGAH 100% SELESAI
      const newFeedItem: FeedItem = {
        id: feedId,
        user: userName,
        init: initial,
        name: userName,
        authorUid: currentUser?.uid || "",
        email: currentUser?.email || "",
        avatar: undefined,
        time: "Baru saja",
        text: finalDesc || "Momen spesial hari ini 📸",
        img: finalMediaUrl,
        thumbnail: finalThumbnailUrl,
        fileId: uploadedFileId,
        thumbFileId: uploadedThumbFileId,
        mediaType: currentMediaType,
        like: 0,
        isLiked: false,
        location: finalLoc || undefined,
        comments: [],
        isMyPost: true,
        createdAtTimestamp: Date.now(),
      };

      const newPostItem: PostItem = {
        id: postId,
        title: postTitle,
        loc: finalLoc || "Sulawesi Tengah",
        img: finalMediaUrl,
        thumbnail: finalThumbnailUrl,
        fileId: uploadedFileId,
        thumbFileId: uploadedThumbFileId,
        mediaType: currentMediaType,
        caption: finalDesc,
        createdAt: "Baru saja",
        name: userName,
        authorUid: currentUser?.uid || "",
        email: currentUser?.email || "",
        user: userName,
        init: initial,
        isMyPost: true,
        createdAtTimestamp: Date.now(),
      };

      setFeed((prev) => [newFeedItem, ...prev]);
      setPosts((prev) => [newPostItem, ...prev]);

      // Tambahkan juga ke papan teks berjalan secara instan setelah selesai
      const newBulletin: BulletinItem = {
        id: `b-${Date.now()}`,
        category: "KABAR BARU",
        text: `@${userName}: ${postTitle} — ${finalDesc.slice(0, 90)}`,
        location: finalLoc || "Kawasan Sekitar",
        time: "Baru saja",
      };
      setBulletins((prev) => [newBulletin, ...prev]);

      // Auto-scroll carousel Kabar Kamu ke paling depan agar kartu langsung kelihatan
      setTimeout(() => {
        carouselRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      }, 100);

      // Simpan ke Firestore proyek pribadi di cloud agar langsung tersinkron ke semua HP
      await savePostToFirestore(newFeedItem, newPostItem);

      // Hentikan status loading di bawah tombol
      setUploadingCount((prev) => Math.max(0, prev - 1));
      setUploadStatus("idle");
      setUploadingItem(null);

      // Set kartu notifikasi kabar berhasil diunggah (otomatis hilang setelah 3.5 detik)
      if (uploadSuccessTimeoutRef.current) {
        clearTimeout(uploadSuccessTimeoutRef.current);
      }
      setLastUploadedPost({
        id: feedId,
        title: postTitle,
        img: finalMediaUrl,
        thumbnail: finalThumbnailUrl,
        mediaType: currentMediaType,
      });

      uploadSuccessTimeoutRef.current = setTimeout(() => {
        setLastUploadedPost(null);
      }, 3500);

      // Beri efek highlight pada kabar baru di feed
      setHighlightedPostId(feedId);
      setHighlightSource("new_upload");

      // Scroll halus layar ke postingan yang baru saja berhasil diunggah
      setTimeout(() => {
        const newPostElement = document.getElementById(`feed-post-${feedId}`);
        if (newPostElement) {
          newPostElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

      // Hilangkan status highlight setelah 8 detik
      setTimeout(() => {
        setHighlightedPostId((cur) => (cur === feedId ? null : cur));
      }, 8000);
    })();
  };

  // Bagikan post
  const handleShare = (text: string, postId?: string) => {
    if (navigator.share) {
      navigator
        .share({
          title: "Kareba'Ta",
          text: text,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} - Dibagikan dari Kareba'Ta`);
      showToast("Tautan kabar berhasil disalin!");
    }
    if (postId) {
      handlePostShared(postId);
    }
  };

  // Laporkan postingan - Membuka modal pelaporan interaktif ala aplikasi modern
  const handleReportPost = (postId: string, user: string, text?: string) => {
    setReportPostData({ id: postId, user, text });
    setReportReason("");
    setReportDetails("");
    setReportSuccessInfo(null);
  };

  const handleUnhidePost = (postId: string) => {
    setHiddenPostIds((prev) => {
      const updated = prev.filter((id) => id !== postId);
      try {
        localStorage.setItem("karebata_hidden_posts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Gagal simpan hidden posts:", e);
      }
      return updated;
    });
    showToast("Postingan kembali ditampilkan di linimasa Anda");
  };

  const handleConfirmReport = () => {
    if (!reportPostData) return;
    if (!reportReason) {
      showToast("Pilih salah satu alasan pelaporan terlebih dahulu.");
      return;
    }
    const targetUser = reportPostData.user;
    const reportedPostId = reportPostData.id;
    const reportItem: ReportItem = {
      id: `rep-${Date.now()}`,
      postId: reportedPostId,
      targetUser: reportPostData.user,
      postText: reportPostData.text || "",
      reason: reportReason,
      details: reportDetails,
      reporterName: userName || "Warga",
      status: "pending",
      createdAt: Date.now(),
      timeString: "Baru saja",
    };
    submitReportToFirestore(reportItem);

    // Langsung sembunyikan postingan dari layar pelapor seketika (seperti di Instagram / Facebook)
    setHiddenPostIds((prev) => {
      const updated = Array.from(new Set([...prev, reportedPostId]));
      try {
        localStorage.setItem("karebata_hidden_posts", JSON.stringify(updated));
      } catch (e) {
        console.warn("Gagal simpan hidden posts:", e);
      }
      return updated;
    });

    // Pindah ke tampilan konfirmasi sukses pelaporan
    setReportSuccessInfo({ targetUser, postId: reportedPostId });
  };

  // FUNGSI PENGHAPUSAN SINKRON: Menghapus berita dari Feed DAN Kartu Kabar Kamu sekaligus
  const handleExecuteDeletePost = (
    targetId: string,
    mediaUrl?: string,
    fileId?: string,
    thumbFileId?: string
  ) => {
    // 1. Temukan postingan target untuk menyinkronkan ID dan URL medianya
    const feedMatch = feed.find((f) => f.id === targetId || (mediaUrl && f.img === mediaUrl));
    const postMatch = posts.find((p) => p.id === targetId || (mediaUrl && p.img === mediaUrl));
    const targetMedia = mediaUrl || feedMatch?.img || postMatch?.img;
    const allMatchingIds = new Set<string>([targetId]);
    if (feedMatch) allMatchingIds.add(feedMatch.id);
    if (postMatch) allMatchingIds.add(postMatch.id);

    // Tandai permanen di daftar deleted posts agar tidak pernah muncul lagi dari sinkronisasi apapun
    try {
      const storedDeleted: string[] = JSON.parse(localStorage.getItem("karebata_deleted_posts") || "[]");
      allMatchingIds.forEach((id) => {
        if (!storedDeleted.includes(id)) storedDeleted.push(id);
      });
      localStorage.setItem("karebata_deleted_posts", JSON.stringify(storedDeleted));
    } catch {}

    // 2. Hapus seketika dari daftar Feed Beranda & sync langsung ke memori lokal
    setFeed((prev) => {
      const updated = prev.filter((item) => !allMatchingIds.has(item.id) && (!targetMedia || item.img !== targetMedia));
      try {
        localStorage.setItem("karebata_local_feed", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 3. Hapus seketika dari deretan Kartu Kabar Kamu & sync langsung ke memori lokal
    setPosts((prev) => {
      const updated = prev.filter((item) => !allMatchingIds.has(item.id) && (!targetMedia || item.img !== targetMedia));
      try {
        localStorage.setItem("karebata_user_posts", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Hapus seketika dari daftar postingan tersimpan (Bookmarks) & sync langsung ke memori lokal
    setSavedPostIds((prev) => {
      const updated = prev.filter((id) => !allMatchingIds.has(id));
      try {
        localStorage.setItem("karebata_saved_posts", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 5. Tutup modal detail layar penuh jika postingan yang dihapus sedang terbuka
    if (
      activeDetailPost &&
      (allMatchingIds.has(activeDetailPost.id) || (targetMedia && activeDetailPost.img === targetMedia))
    ) {
      setActiveDetailPost(null);
    }

    // 6. Hapus dari Firestore permanen
    allMatchingIds.forEach((id) => {
      deletePostFromFirestore(id);
    });

    // 7. Hapus file gambar/video dari penyimpanan ImageKit CDN
    const targetFileId = fileId || feedMatch?.fileId || postMatch?.fileId;
    if (targetFileId) {
      deleteFromImageKit(targetFileId);
    }
    const targetThumbFileId = thumbFileId || feedMatch?.thumbFileId || postMatch?.thumbFileId;
    if (targetThumbFileId) {
      deleteFromImageKit(targetThumbFileId);
    }

    setPostToDelete(null);
    showToast("Postingan berhasil dihapus permanen dari semua penyimpanan");
  };

  // JIKA SEDANG MEMBUKA HALAMAN DASBOR ADMIN TERPISAH
  if (viewMode === "admin") {
    return (
      <>
        {showSplash && <SplashScreen durationMs={2500} onFinish={() => setShowSplash(false)} />}
        <AdminDashboard
          feedPosts={feed}
          onBackToFeed={() => {
            if (typeof window !== "undefined") {
              try {
                sessionStorage.removeItem("karebata_admin_pin_verified");
                sessionStorage.removeItem("karebata_admin_passcode_verified");
                window.history.pushState(null, "", "/");
              } catch {}
              window.location.hash = "";
            }
            setViewMode("feed");
          }}
          onPostDeleted={(postId, mediaUrl, fileId, thumbFileId) => {
            handleExecuteDeletePost(postId, mediaUrl, fileId, thumbFileId);
          }}
          onPreviewPost={(post) => {
            setActiveDetailPost({
              id: post.id,
              title: post.location || "Kabar Warga",
              loc: post.location || "Wilayah Sekitar",
              img: post.img,
              thumbnail: post.thumbnail,
              mediaType: post.mediaType,
              caption: post.text,
              createdAt: post.time,
              name: post.name,
              email: post.email,
              user: post.user,
              init: post.init,
              views: post.views,
              isMyPost: isMyPost(post),
            });
          }}
        />
        {activeDetailPost && (
          <PostDetailModal
            post={activeDetailPost}
            views={feed.find((f) => f.id === activeDetailPost.id)?.views || activeDetailPost.views || 0}
            onClose={() => setActiveDetailPost(null)}
            onShowToast={showToast}
            isOwner={activeDetailPost ? isMyPost(activeDetailPost) : false}
            isSaved={Boolean(activeDetailPost && savedPostIds.includes(activeDetailPost.id))}
            onToggleSave={handleToggleSave}
            onShare={handlePostShared}
            onDelete={(id) => {
              setPostToDelete({ id, title: activeDetailPost?.title, img: activeDetailPost?.img });
              setActiveDetailPost(null);
            }}
            onReport={(id, user) => {
              handleReportPost(id, user, activeDetailPost?.title || activeDetailPost?.caption);
              setActiveDetailPost(null);
            }}
          />
        )}
      </>
    );
  }

  // JIKA BELUM LOGIN: WAJIB MASUK HALAMAN LOGIN TERLEBIH DAHULU (TIDAK ADA HALAMAN PENGUNJUNG TANPA LOGIN)
  if (viewMode === "login" || (!currentUser && typeof window !== "undefined" && !localStorage.getItem("karebata_is_logged_in"))) {
    return (
      <>
        {showSplash && <SplashScreen durationMs={2500} onFinish={() => setShowSplash(false)} />}
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          initialMessage={loginRedirectMessage}
        />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-neutral-700 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-[#E5A000]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // JIKA SETELAH LOGIN GOOGLE: HANYA MASUK KE HALAMAN NGETIK NAMA JIKA AKUN BARU DAN BELUM MEMILIKI NAMA
  if (viewMode === "set_name") {
    return (
      <>
        {showSplash && <SplashScreen durationMs={2500} onFinish={() => setShowSplash(false)} />}
        <SetupUsernamePage
          currentUser={currentUser}
          initialValue={userName && userName !== "warga_kareba" ? userName : ""}
          onSaveUsername={handleSaveUsername}
          onLogout={handleLogout}
        />
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-neutral-700 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-[#E5A000]" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full bg-neutral-100 text-neutral-900 flex justify-center selection:bg-[#00632B] selection:text-white min-h-screen">
      {showSplash && <SplashScreen durationMs={2500} onFinish={() => setShowSplash(false)} />}
      <div id="karebata-feed-app" className={`w-full max-w-md bg-white relative font-sans shadow-sm flex flex-col min-h-screen ${selectedImage ? "pb-36" : displayFeed.length === 0 ? "pb-28" : "pb-16"}`}>
        {/* INPUT TERSEMBUNYI - INI KUNCINYA, TIDAK KELIHATAN */}
        <input
          id="custom-file-input"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          id="custom-thumbnail-input"
          ref={thumbnailInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleThumbnailSelect}
        />
        <input
          id="native-camera-input"
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCameraCapture}
        />

        {/* NOTIFIKASI TOAST MELAYANG UNTUK PESAN CEPAT */}
        {toastMessage && (
          <div
            id="status-toast"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-[calc(100%-32px)] bg-neutral-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-neutral-700 animate-fade-in pointer-events-none select-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* APP HEADER & PAPAN TEKS BERJALAN DI BAWAH BAR - Menempel Kokoh di Atas (Fixed Top) */}
        <div
          id="sticky-header-container"
          className="fixed top-0 left-0 right-0 z-40 bg-white w-full max-w-md mx-auto shadow-xs border-b border-neutral-100 overflow-hidden"
        >
          <header
            id="karebata-feed-header"
            dir="ltr"
            className="bg-white border-b border-neutral-200 px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between transition-all duration-150 min-h-[52px] w-full"
          >
            {isSearchOpen ? (
              /* SAAT PENCARIAN AKTIF: LOGO, ICON KAMERA, DAN ICON MEDIA HILANG, TAMPIL BAR PENCARIAN BERSIH */
              <div className="w-full flex items-center gap-2 py-0.5 animate-fade-in">
                <div className="flex-1 flex items-center gap-2 bg-neutral-100 rounded-full px-3.5 py-1.5 border border-neutral-300 focus-within:border-[#00632B] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00632B]/20 transition">
                  <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                  <input
                    id="header-search-input"
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berita, lokasi, atau nama akun..."
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setHighlightedPostId(null);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-200 transition cursor-pointer"
                      aria-label="Hapus ketikan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  id="search-header-cancel-btn"
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchCategory("all");
                    setSearchQuery("");
                    setHighlightedPostId(null);
                  }}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-2 py-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer shrink-0"
                >
                  Batal
                </button>
              </div>
            ) : (
              /* SAAT PENCARIAN TIDAK AKTIF: LOGO DI KIRI, ICON PENCARIAN, KAMERA, DAN MEDIA DI KANAN DENGAN RUANG LEGA */
              <>
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="flex items-center text-left hover:opacity-85 active:scale-95 transition cursor-pointer shrink-0"
                  aria-label="Kembali ke media paling atas"
                >
                  <KarebaTaLogo compact={true} />
                </button>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
                  <button
                    id="header-search-trigger"
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(true);
                    }}
                    className="w-[clamp(36px,9.5vw,40px)] h-[clamp(36px,9.5vw,40px)] text-neutral-800 hover:text-[#00632B] hover:bg-neutral-100 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
                    aria-label="Cari"
                  >
                    <Search className="w-[clamp(20px,5.5vw,23px)] h-[clamp(20px,5.5vw,23px)]" strokeWidth={2.2} />
                  </button>
                  <button
                    id="header-camera-btn"
                    type="button"
                    onClick={handleCameraClick}
                    className="w-[clamp(36px,9.5vw,40px)] h-[clamp(36px,9.5vw,40px)] text-neutral-800 hover:text-[#00632B] hover:bg-neutral-100 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
                    aria-label="Buka Kamera"
                  >
                    <CameraIcon className="w-[clamp(20px,5.5vw,23px)] h-[clamp(20px,5.5vw,23px)]" strokeWidth={2.2} />
                  </button>
                  <button
                    id="header-gallery-btn"
                    type="button"
                    onClick={handleGalleryClick}
                    className="w-[clamp(36px,9.5vw,40px)] h-[clamp(36px,9.5vw,40px)] text-neutral-800 hover:text-[#00632B] hover:bg-neutral-100 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center cursor-pointer"
                    aria-label="Pilih Foto atau Video dari Galeri"
                  >
                    <ImageIcon className="w-[clamp(20px,5.5vw,23px)] h-[clamp(20px,5.5vw,23px)]" strokeWidth={2.2} />
                  </button>
                </div>
              </>
            )}
          </header>

          {/* Papan Teks Berjalan di Bawah Bar */}
          {!isSearchOpen && (
            <RunningTextBar
              announcements={bulletins}
              onItemClick={(text) => {
                const lower = text.toLowerCase();
                if (
                  lower.includes("iklan") ||
                  lower.includes("promo") ||
                  lower.includes("umkm") ||
                  lower.includes("tarif") ||
                  lower.includes("whatsapp") ||
                  lower.includes("pasang")
                ) {
                  // Langsung buka modal Bantuan / Hubungi WhatsApp Admin untuk pasang iklan
                  setIsHelpOpen(true);
                } else {
                  showToast(text);
                }
              }}
            />
          )}

          {/* PAPAN HORIZONTAL STATUS UNGGAH MEDIA (ALA FACEBOOK) - DI BAWAH PAPAN TEKS BERJALAN */}
          {uploadStatus === "uploading" && (
            <div
              id="fb-style-upload-bar"
              className="w-full bg-white border-t border-neutral-200/90 px-3.5 py-2 flex items-center gap-3 shadow-2xs animate-fade-in select-none"
            >
              {/* Thumbnail Media yang Sedang Diunggah */}
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                {uploadingItem?.mediaType === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                    <Video className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : uploadingItem?.thumbnail ? (
                  <img
                    src={uploadingItem.thumbnail}
                    alt={uploadingItem.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-neutral-400" />
                )}
                {/* Mini Spinner di overlay thumbnail */}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              </div>

              {/* Progress Bar & Keterangan Horizontal Ala FB */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-neutral-800 truncate">
                    {uploadingItem?.title || "Mengunggah kiriman..."}
                  </span>
                  <span className="text-[11px] font-semibold text-[#00632B] shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00632B] animate-ping" />
                    Mengunggah...
                  </span>
                </div>

                {/* Garis Progres Berjalan Horizontal Ala FB */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mt-1.5 border border-neutral-200/60 relative">
                  <div className="h-full bg-gradient-to-r from-[#00632B] via-emerald-400 to-[#00632B] rounded-full w-full animate-pulse" />
                </div>
              </div>
            </div>
          )}

          {/* PAPAN KABAR BERHASIL DIUNGGAH ALA FACEBOOK - DI BAWAH PAPAN TEKS BERJALAN */}
          {lastUploadedPost && (
            <div
              id="fb-style-upload-success-bar"
              className="w-full bg-emerald-50/90 border-t border-emerald-200 px-3.5 py-2 flex items-center gap-3 shadow-2xs animate-fade-in select-none"
            >
              {/* Thumbnail Media Berhasil Diunggah */}
              <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-emerald-300 bg-white flex items-center justify-center shadow-2xs">
                {lastUploadedPost.mediaType === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white">
                    <Video className="w-4 h-4 text-emerald-400" />
                  </div>
                ) : lastUploadedPost.img ? (
                  <img
                    src={lastUploadedPost.thumbnail || lastUploadedPost.img}
                    alt={lastUploadedPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-[#00632B]" />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#00632B] rounded-full p-0.5 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Teks Berhasil */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-[#00632B]">
                  <span>Berita berhasil diunggah</span>
                </div>
                <p className="text-[11px] font-medium text-neutral-700 truncate mt-0.5">
                  {lastUploadedPost.title}
                </p>
              </div>

              {/* Tombol Aksi */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (uploadSuccessTimeoutRef.current) {
                      clearTimeout(uploadSuccessTimeoutRef.current);
                    }
                    const target = feed.find((f) => f.id === lastUploadedPost.id) || posts.find((p) => p.id === lastUploadedPost.id);
                    if (target) {
                      handleOpenCardInFeed(target as any);
                    }
                    setLastUploadedPost(null);
                  }}
                  className="px-2.5 py-1 bg-[#00632B] hover:bg-[#004f22] text-white text-[11px] font-bold rounded-lg transition active:scale-95 shadow-2xs cursor-pointer"
                >
                  Lihat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (uploadSuccessTimeoutRef.current) {
                      clearTimeout(uploadSuccessTimeoutRef.current);
                    }
                    setLastUploadedPost(null);
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition cursor-pointer"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Spacer Pengganti Ruang Header Fixed agar feed tidak tertutup bar */}
        <div
          className={`${
            isSearchOpen
              ? uploadStatus === "uploading" || lastUploadedPost
                ? "h-[108px]"
                : "h-[54px]"
              : uploadStatus === "uploading" || lastUploadedPost
              ? "h-[144px]"
              : "h-[88px]"
          } shrink-0 transition-all duration-200`}
          style={{
            marginTop: "env(safe-area-inset-top, 0px)",
          }}
          aria-hidden="true"
        />

        {/* FITUR TARIK/GESER KE BAWAH UNTUK MEMPERBARUI (PULL-TO-REFRESH KUSTOM DENGAN KONTEN TETAP KOKOH TANPA TERGESER TURUN) */}
        <PullToRefresh onRefresh={handlePullRefresh}>
          {/* PROFIL WARGA - Jarak atas lebih lega agar icon profil tidak terlalu mepet ke papan teks berjalan */}
          <section id="profile-section" className="w-full pt-6 pb-4 px-4 flex items-center justify-between bg-white border-b border-neutral-100">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Foto Profil: Menampilkan foto asli akun Google atau inisial modern dengan gradien berkelas */}
            <div className="relative shrink-0">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={userName}
                  className="w-[clamp(48px,13vw,56px)] h-[clamp(48px,13vw,56px)] rounded-full object-cover ring-2 ring-emerald-600/20 ring-offset-2 ring-offset-white shadow-xs select-none"
                />
              ) : (
                <div className="w-[clamp(48px,13vw,56px)] h-[clamp(48px,13vw,56px)] rounded-full bg-gradient-to-tr from-[#00632B] via-[#007A35] to-[#0A8742] ring-2 ring-emerald-600/25 ring-offset-2 ring-offset-white flex items-center justify-center text-[clamp(20px,5.5vw,24px)] font-bold shadow-xs text-white select-none tracking-tight">
                  {initial}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 ring-2 ring-white rounded-full shadow-2xs" aria-label="Sedang Aktif" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-bold text-[clamp(16px,4.5vw,18.5px)] text-neutral-900 tracking-[-0.015em] truncate max-w-[150px] sm:max-w-[200px]">
                  {userName.startsWith("@") ? userName.replace(/^@/, "") : userName}
                </h2>
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                    isUserAdmin(currentUser?.email)
                      ? "bg-[#00632B] text-white"
                      : "bg-emerald-100 text-emerald-800"
                  } shrink-0 shadow-2xs`}
                  title={isUserAdmin(currentUser?.email) ? "Pengelola Terverifikasi" : "Warga Terdaftar"}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[clamp(13px,3.6vw,14.5px)] text-neutral-500 font-medium mt-0.5 whitespace-nowrap">
                <span className="text-neutral-500 font-medium tracking-tight">
                  @{userName.replace(/^@/, "").toLowerCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Icon Dasbor Admin HANYA Muncul di Akun Admin Khusus (iditona5@gmail.com) */}
            {isUserAdmin(currentUser?.email) && (
              <button
                id="profile-admin-dashboard-btn"
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.hash = "#admin";
                  }
                  setViewMode("admin");
                }}
                className="w-8 h-8 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition active:scale-90 cursor-pointer shadow-2xs flex items-center justify-center"
                title="Dasbor Admin"
                aria-label="Dasbor Admin"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition active:scale-95 cursor-pointer shadow-2xs"
              aria-label="Keluar akun Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </section>

        {/* PERINGATAN RESMI JIKA AKUN DITANGGUHKAN OLEH ADMIN */}
        {currentBanStatus.isBanned && (
          <div id="banned-account-alert" className="mx-4 my-3 p-4 bg-gradient-to-r from-rose-50 via-red-50 to-rose-100/80 border-2 border-rose-300 rounded-2xl shadow-sm text-rose-950 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-rose-950 leading-snug">
                  Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Fitur untuk membuat postingan kabar baru dan mengirim komentar telah dinonaktifkan sementara oleh Pengelola.
                </p>
                {currentBanStatus.banRecord?.reason && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-rose-200 rounded-lg text-xs font-semibold text-rose-900">
                    <span>Alasan:</span>
                    <span className="font-normal">{currentBanStatus.banRecord.reason}</span>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hubungi Admin via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STATS - RAPAT KANAN KIRI: ICON DI ATAS, ANGKA DI BAWAH, SEMUA ICON MONOKROM / TIDAK BERWARNA */}
        <section id="stats-section" className="w-full flex items-center justify-around py-3 border-b border-neutral-200 bg-neutral-50/70">
          <button
            type="button"
            onClick={() => {
              setShowSavedSection(false);
              const el = document.getElementById("my-posts-carousel");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 hover:bg-neutral-200/50 rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
            aria-label="Suka kabar kamu (klik untuk melihat Kabar Kamu)"
          >
            <div className="flex items-center justify-center text-neutral-700 mb-1" aria-label="Icon Suka">
              <Heart className="w-[clamp(18px,5vw,22px)] h-[clamp(18px,5vw,22px)] text-neutral-700" />
            </div>
            <p className="font-bold text-[clamp(15px,4.2vw,17.5px)] text-neutral-900 leading-tight">
              {myTotalLikes > 0
                ? (myTotalLikes >= 1000 ? `${(myTotalLikes / 1000).toFixed(1)}k` : myTotalLikes)
                : 0}
            </p>
          </button>
          <div className="w-px h-8 bg-neutral-200" />
          <div className="flex-1 flex flex-col items-center justify-center py-1 min-h-[44px]" aria-label="Total kabar kamu dibagikan">
            <div className="flex items-center justify-center text-neutral-700 mb-1" aria-label="Icon Bagikan">
              <Share2 className="w-[clamp(18px,5vw,22px)] h-[clamp(18px,5vw,22px)] text-neutral-700" />
            </div>
            <p className="font-bold text-[clamp(15px,4.2vw,17.5px)] text-neutral-900 leading-tight">
              {myTotalShares > 0
                ? (myTotalShares >= 1000 ? `${(myTotalShares / 1000).toFixed(1)}k` : myTotalShares)
                : 0}
            </p>
          </div>
          <div className="w-px h-8 bg-neutral-200" />
          <button
            type="button"
            onClick={() => {
              setShowSavedSection(true);
              const el = document.getElementById("my-posts-carousel");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 hover:bg-neutral-200/50 rounded-lg transition active:scale-95 cursor-pointer min-h-[44px]"
            aria-label="Total kabar kamu disimpan (klik untuk melihat Tersimpan)"
          >
            <div className="flex items-center justify-center text-neutral-700 mb-1" aria-label="Icon Simpan">
              <Bookmark className="w-[clamp(18px,5vw,22px)] h-[clamp(18px,5vw,22px)] text-neutral-700" />
            </div>
            <p className="font-bold text-[clamp(15px,4.2vw,17.5px)] text-neutral-900 leading-tight">
              {myTotalSaves > 0
                ? (myTotalSaves >= 1000 ? `${(myTotalSaves / 1000).toFixed(1)}k` : myTotalSaves)
                : 0}
            </p>
          </button>
        </section>

        {/* HORIZONTAL: KABAR KAMU & KABAR TERSIMPAN (SELALU MUNCUL, TIDAK PERNAH HILANG) */}
        <section id="my-posts-carousel" className="w-full py-3.5 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between mb-3 px-3">
            {/* SISI KIRI: KABAR KAMU */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSavedSection(false)}
                className="flex items-center gap-2 text-left cursor-pointer group"
                aria-label="Lihat Kabar Saya"
              >
                <h3
                  className={`font-bold text-sm transition ${
                    !showSavedSection
                      ? "text-neutral-900 font-extrabold"
                      : "text-neutral-500 group-hover:text-neutral-800"
                  }`}
                >
                  Kabar Saya
                </h3>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full transition ${
                    !showSavedSection
                      ? "bg-[#00632B]/10 text-[#00632B]"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {posts.length}
                </span>
              </button>
            </div>

            {/* SUDUT KANAN: TULISAN SIMPAN */}
            <button
              id="saved-posts-count-badge"
              type="button"
              onClick={() => setShowSavedSection((prev) => !prev)}
              className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition active:scale-95 cursor-pointer ${
                showSavedSection
                  ? "bg-[#00632B] text-white shadow-xs"
                  : "bg-emerald-50 text-[#00632B] border border-emerald-200/80 hover:bg-emerald-100/80"
              }`}
              title="Kabar Tersimpan"
              aria-label="Simpan"
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${
                  showSavedSection ? "fill-white text-white" : "fill-[#00632B] text-[#00632B]"
                }`}
              />
              <span>Simpan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  showSavedSection
                    ? "bg-white/20 text-white"
                    : "bg-[#00632B]/10 text-[#00632B]"
                }`}
              >
                {savedItems.length}
              </span>
            </button>
          </div>

          {/* KONTEN KARTU: TERSIMPAN ATAU KABAR KAMU */}
          {showSavedSection ? (
            savedItems.length === 0 ? (
              <div className="px-3">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-dashed border-[#00632B]/30 text-center animate-fade-in">
                  <Bookmark className="w-5 h-5 text-[#00632B] mx-auto mb-1.5" />
                  <p className="text-xs text-neutral-900 font-bold">Belum ada kabar yang tersimpan</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 mb-2.5">
                    Tandai kabar dengan ikon simpan di berita untuk melihatnya di sini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSavedSection(false)}
                    className="inline-flex items-center gap-1 text-xs text-[#00632B] font-bold hover:underline cursor-pointer"
                  >
                    <span>Kembali ke Kabar Saya</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <CardCarousel id="saved-posts-carousel" className="animate-fade-in">
                {savedItems.map((p) => {
                  const isVid =
                    p.mediaType === "video" ||
                    p.img?.startsWith("data:video") ||
                    p.img?.includes(".mp4") ||
                    p.img?.includes("video");

                  return (
                    <div
                      key={`saved-${p.id}`}
                      id={`saved-card-${p.id}`}
                      data-card-item="true"
                      onClick={() => {
                        if (!(window as any).__KAREBATA_IS_DRAGGING_CARD__) {
                          handleOpenCardInFeed(p);
                        }
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative w-[104px] min-w-[104px] max-w-[104px] bg-emerald-50/80 hover:bg-emerald-100/70 rounded-xl p-1.5 cursor-pointer transition-all duration-150 border border-emerald-200/80 shadow-2xs shrink-0 select-none active:scale-[0.98]"
                      style={{ WebkitTouchCallout: "none", touchAction: "pan-x pan-y" }}
                    >
                      <div className="relative overflow-hidden rounded-lg bg-neutral-100 h-[68px] w-full flex items-center justify-center select-none">
                        {isVid ? (
                          <div className="relative h-[68px] w-full bg-neutral-100 flex items-center justify-center overflow-hidden rounded-lg">
                            <img
                              src={p.thumbnail || p.img}
                              alt={p.title}
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              className="h-[68px] w-full object-cover rounded-lg pointer-events-none select-none"
                              style={{ WebkitTouchCallout: "none" }}
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none">
                              <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-xs border border-white/20">
                                <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={p.img}
                            alt={p.title}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="h-[68px] w-full object-cover rounded-lg pointer-events-none select-none"
                            style={{ WebkitTouchCallout: "none" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="absolute bottom-1 right-1 text-[8.5px] bg-black/75 px-1 py-0.2 rounded text-white backdrop-blur-xs flex items-center gap-0.5 z-10 font-medium">
                          {isVid ? (
                            <>
                              <Video className="w-2 h-2 text-emerald-400" />
                              <span>Video</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-2 h-2 text-amber-400" />
                              <span>Foto</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-[11.5px] mt-1 font-bold text-neutral-900 truncate leading-tight tracking-[-0.01em]">{p.title}</p>
                      <p className="text-[9.5px] text-neutral-500 truncate leading-tight mt-0.5">{p.loc}</p>
                    </div>
                  );
                })}
              </CardCarousel>
            )
          ) : (
            /* KARTU KABAR KAMU (TAMPIL KETIKA KARTU TERSIMPAN TIDAK AKTIF) */
            <CardCarousel id="user-posts-carousel" className="animate-fade-in">
              {/* KARTU BUAT REELS (EBBU KAREBA) - PERSIS SCREENSHOT INSTAGRAM REELS */}
              <div
                id="user-create-reel-card"
                data-card-item="true"
                onClick={() => {
                  if (!(window as any).__KAREBATA_IS_DRAGGING_CARD__) {
                    handleEbbuKarebaClick();
                  }
                }}
                onContextMenu={(e) => e.preventDefault()}
                className="relative w-[104px] min-w-[104px] max-w-[104px] h-[108px] rounded-xl p-1.5 cursor-pointer transition-all duration-150 shadow-2xs shrink-0 select-none group active:scale-[0.98] flex flex-col items-center justify-center border border-white/20 overflow-hidden"
                style={{
                  WebkitTouchCallout: "none",
                  touchAction: "pan-x pan-y",
                  background:
                    "linear-gradient(180deg, #004d21 0%, #00632B 40%, #059669 75%, #10b981 100%)",
                }}
              >
                {/* Lingkaran Putih Tengah dengan Ikon Play ▶️ */}
                <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform duration-150">
                  <Play className="w-5 h-5 text-[#00632B] fill-[#00632B] ml-0.5" />
                </div>

                {/* Teks: Ebbu kareba */}
                <span className="text-white font-bold text-[11px] leading-tight text-center drop-shadow-xs mt-2 tracking-tight">
                  Ebbu kareba
                </span>
              </div>

              {posts.length === 0 ? (
                <div
                  data-card-item="true"
                  onClick={() => {
                    if (!(window as any).__KAREBATA_IS_DRAGGING_CARD__) {
                      handleEbbuKarebaClick();
                    }
                  }}
                  className="relative w-[130px] min-w-[130px] max-w-[130px] h-[108px] bg-neutral-50 hover:bg-neutral-100 rounded-xl p-2 cursor-pointer transition-all duration-150 border border-dashed border-neutral-300 shadow-2xs shrink-0 select-none flex flex-col items-center justify-center text-center active:scale-[0.98]"
                >
                  <p className="text-[11px] font-bold text-neutral-800 leading-tight">
                    Kabar Saya Masih Kosong
                  </p>
                  <p className="text-[9.5px] text-neutral-500 mt-1 leading-snug">
                    Klik Ebbu kareba untuk bagikan momen
                  </p>
                </div>
              ) : (
                posts.map((p) => {
                  const isVid =
                    p.mediaType === "video" ||
                    p.img?.startsWith("data:video") ||
                    p.img?.includes(".mp4") ||
                    p.img?.includes("video");

                  return (
                    <div
                      key={p.id}
                      id={`user-post-card-${p.id}`}
                      data-card-item="true"
                      onClick={() => {
                        if (!(window as any).__KAREBATA_IS_DRAGGING_CARD__) {
                          handleOpenCardInFeed(p);
                        }
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative w-[104px] min-w-[104px] max-w-[104px] bg-neutral-50 hover:bg-neutral-100 rounded-xl p-1.5 cursor-pointer transition-all duration-150 border border-neutral-200 shadow-2xs shrink-0 select-none group active:scale-[0.98]"
                      style={{ WebkitTouchCallout: "none", touchAction: "pan-x pan-y" }}
                    >
                      <div className="relative overflow-hidden rounded-lg bg-neutral-100 h-[68px] w-full flex items-center justify-center select-none">
                        {isVid ? (
                          <div className="relative h-[68px] w-full bg-neutral-100 flex items-center justify-center overflow-hidden rounded-lg">
                            <img
                              src={p.thumbnail || p.img}
                              alt={p.title}
                              loading="eager"
                              decoding="async"
                              draggable={false}
                              onContextMenu={(e) => e.preventDefault()}
                              className="h-[68px] w-full object-cover rounded-lg pointer-events-none select-none"
                              style={{ WebkitTouchCallout: "none" }}
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center pointer-events-none">
                              <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-xs border border-white/20">
                                <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={p.img}
                            alt={p.title}
                            loading="eager"
                            decoding="async"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="h-[68px] w-full object-cover rounded-lg pointer-events-none select-none"
                            style={{ WebkitTouchCallout: "none" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span className="absolute bottom-1 right-1 text-[8.5px] bg-black/75 px-1 py-0.2 rounded text-white backdrop-blur-xs flex items-center gap-0.5 z-10 font-medium">
                          {isVid ? (
                            <>
                              <Video className="w-2 h-2 text-emerald-400" />
                              <span>Video</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-2 h-2 text-amber-400" />
                              <span>Foto</span>
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-[11.5px] mt-1 font-bold text-neutral-900 truncate leading-tight tracking-[-0.01em]">{p.title}</p>
                      <p className="text-[9.5px] text-neutral-500 truncate leading-tight mt-0.5">{p.loc}</p>
                    </div>
                  );
                })
              )}
            </CardCarousel>
          )}
        </section>

        {/* PEMBATAS SECTION RAPAT & GARIS ABU-ABU TERANG */}
        <div className="w-full h-[2px] bg-neutral-200" aria-hidden="true" />

        {/* FORM KABAR MEDIA - MUNCUL SAAT FOTO/VIDEO DIPILIH */}
        {selectedImage && (
          <>
            <section id="media-post-composer-card" className="w-full bg-white p-4 space-y-3">
              {/* Pratinjau Foto/Video Bersih & Sederhana */}
              <div id="composer-thumbnail-card" className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                {/* Kotak Foto / Video Terpilih (Tidak dapat diklik) */}
                <div className="relative w-20 h-20 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200 shadow-2xs select-none">
                  {selectedMediaType === "video" ? (
                    selectedThumbnail ? (
                      <img
                        src={selectedThumbnail}
                        alt="Foto terpilih"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-6 h-6 text-neutral-400" />
                      </div>
                    )
                  ) : (
                    <img
                      src={selectedImage}
                      alt="Foto terpilih"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {selectedMediaType === "video" && (
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono shadow-xs backdrop-blur-xs">
                      <Video className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{selectedVideoDuration ? formatDuration(selectedVideoDuration) : "00:00"}</span>
                    </span>
                  )}
                </div>

                {/* Keterangan & Tombol Ganti / Hapus */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-neutral-800">
                    {selectedMediaType === "video"
                      ? `Video siap dibagikan ${selectedVideoDuration ? `(${formatDuration(selectedVideoDuration)} / maks 01:00)` : "(Maks 60 dtk)"}`
                      : "Foto siap dibagikan"}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleGalleryClick}
                      className="text-xs text-[#00632B] hover:text-[#004f22] font-semibold cursor-pointer"
                    >
                      {selectedMediaType === "video" ? "Ganti Video" : "Ganti Foto"}
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      id="delete-selected-image-btn"
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setSelectedFile(null);
                        setSelectedThumbnail(null);
                        setSelectedVideoDuration(null);
                        setDescription("");
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>

              {/* Peringatan Pedoman Komunitas Bebas Asusila & Santun (100% Gratis) */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-2.5 text-xs text-emerald-950 flex items-start gap-2 select-none">
                <ShieldCheck className="w-4 h-4 text-[#00632B] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-neutral-900">Pedoman Konten Santun Kareba&apos;Ta:</span> Dilarang keras mempublikasikan pornografi, busana seksi/terbuka berlebihan, goyangan erotis, pose julur lidah sensual, serta kata jorok atau makian.
                </div>
              </div>

              {/* KETIK DESKRIPSI KABAR (BATAS 500 HURUF) */}
              <div className={`rounded-xl p-3 border transition space-y-1.5 ${
                moderationWarning
                  ? "border-red-400 bg-red-50/40"
                  : "bg-neutral-50 border-neutral-200 focus-within:border-[#00632B] focus-within:bg-white"
              }`}>
                <div className="flex items-center justify-between">
                  <label htmlFor="post-description-input" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5 text-[#00632B]" /> Deskripsi Kabar:
                  </label>
                  <span className={`text-[11px] font-semibold ${description.trim().length >= 99 ? "text-emerald-700" : "text-amber-700"}`}>
                    {description.trim().length}/500 {description.trim().length < 99 ? `(kurang ${99 - description.trim().length} huruf)` : "✓ Lolos (≥99 huruf)"}
                  </span>
                </div>
                <textarea
                  id="post-description-input"
                  value={description}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Ketik deskripsi kabar minimal 99 huruf agar dapat dibagikan... (maks. 500 huruf)"
                  className="bg-transparent w-full outline-none text-base sm:text-sm text-neutral-900 placeholder-neutral-400 resize-none"
                  autoFocus
                />

                {/* Indikator Peringatan Kata Terlarang / Jorok */}
                {moderationWarning && (
                  <div className="mt-2 p-2.5 rounded-lg bg-red-100/90 border border-red-300 text-red-900 text-xs flex items-start gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-[11px]">Terdeteksi kata dilarang: &ldquo;{moderationWarning.flaggedWord}&rdquo;</p>
                      <p className="text-[10px] text-red-700 leading-tight">{moderationWarning.reason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* KETIK LOKASI MANUAL (BATAS 30 HURUF) */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 focus-within:border-[#00632B] focus-within:bg-white transition space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="post-location-input" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500" /> Ketik Lokasi Manual:
                  </label>
                  <span className={`text-[11px] font-medium ${selectedLocation.length >= 30 ? "text-red-600 font-bold" : "text-neutral-400"}`}>
                    {selectedLocation.length}/30
                  </span>
                </div>
                <input
                  id="post-location-input"
                  type="text"
                  maxLength={30}
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value.slice(0, 30))}
                  placeholder="Ketik lokasi (contoh: Danau Tempe, Sengkang)..."
                  className="bg-transparent w-full outline-none text-base sm:text-sm text-neutral-900 placeholder-neutral-400"
                />
              </div>

              {/* Indikator Kelengkapan Syarat Posting */}
              <div className="flex items-center justify-between text-[11px] px-1 text-neutral-500">
                <span className="font-semibold text-neutral-600">Syarat Publikasi:</span>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-0.5 ${selectedImage ? "text-emerald-600 font-bold" : "text-neutral-400"}`}>
                    {selectedImage ? "✓" : "○"} Media
                  </span>
                  <span className={`flex items-center gap-0.5 ${description.trim().length >= 99 ? "text-emerald-600 font-bold" : "text-amber-600 font-medium"}`}>
                    {description.trim().length >= 99 ? "✓" : "○"} Deskripsi (≥99)
                  </span>
                  <span className={`flex items-center gap-0.5 ${selectedLocation.trim() ? "text-emerald-600 font-bold" : "text-neutral-400"}`}>
                    {selectedLocation.trim() ? "✓" : "○"} Lokasi
                  </span>
                  <span className={`flex items-center gap-0.5 ${!moderationWarning ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}`}>
                    {!moderationWarning ? "✓" : "✕"} Bahasa Santun
                  </span>
                </div>
              </div>

              {/* Tombol Publikasi Kabar - Bebas dari loading, orang bisa langsung posting lagi */}
              <div className="pt-1 pb-1">
                <button
                  id="publish-post-btn"
                  type="button"
                  disabled={!isPublishReady}
                  onClick={handleCreatePost}
                  className={`w-full py-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                    isPublishReady
                      ? "bg-[#00632B] hover:bg-[#004f22] text-white cursor-pointer shadow-md active:scale-[0.99]"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {moderationWarning
                      ? `Hapus kata terlarang: "${moderationWarning.flaggedWord}"`
                      : description.trim().length < 99
                      ? `Ketik minimal 99 huruf (kurang ${Math.max(0, 99 - description.trim().length)})`
                      : "Bagikan kabar sekarang"}
                  </span>
                </button>
              </div>

              {/* Indikator Proses Loading Upload di Bawah Papan Tombol */}
              {uploadingCount > 0 && (
                <div className="w-full mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-4 h-4 border-2 border-[#00632B] border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-bold text-neutral-900 text-xs truncate">
                        {uploadingCount > 1
                          ? `Sedang mengunggah ${uploadingCount} berita...`
                          : "Sedang mengunggah berita..."}
                      </span>
                      <span className="text-[11px] text-neutral-500 mt-0.5">
                        Formulir kosong & siap dipakai untuk posting lagi.
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#00632B] bg-white px-2 py-0.5 rounded-full border border-emerald-100 shadow-2xs shrink-0">
                    Latar Belakang
                  </span>
                </div>
              )}
            </section>
          </>
        )}

        {/* PEMBATAS SECTION RAPAT & GARIS ABU-ABU TERANG */}
        <div className="w-full h-[2px] bg-neutral-200" aria-hidden="true" />

        {/* FEED VERTIKAL WARGA - SEMUA KARTU RAPAT & DIBERI GARIS PEMBATAS ABU-ABU TERANG */}
        <section id="feed-vertical-container" className="w-full bg-white">
          <div className="w-full px-4 pt-3.5 pb-2.5 bg-white border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-bold text-sm tracking-tight text-neutral-900">
                  Kabar Warga
                </h2>
              </div>
                <button
                  id="help-kabar-warga-btn"
                  type="button"
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      helpTapRef.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        time: Date.now(),
                      };
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!helpTapRef.current || e.changedTouches.length === 0) return;
                    const touch = e.changedTouches[0];
                    const dx = Math.abs(touch.clientX - helpTapRef.current.x);
                    const dy = Math.abs(touch.clientY - helpTapRef.current.y);
                    const duration = Date.now() - helpTapRef.current.time;
                    helpTapRef.current = null;

                    // HANYA buka jika sentuhan benar-benar ketukan diam di tempat (dx & dy < 5px) dan durasi wajar tap (60-450ms)
                    // Jika jari bergerak (sedang scrolling atau mengusap feed), abaikan total!
                    if (dx < 5 && dy < 5 && duration >= 60 && duration <= 450) {
                      const lastScroll = (window as any).__KAREBATA_LAST_SCROLL_TIME__ || 0;
                      if (Date.now() - lastScroll > 350) {
                        setIsHelpOpen(true);
                      }
                    }
                  }}
                  onClick={(e) => {
                    // Hanya izinkan klik mouse di komputer desktop (bukan perangkat layar sentuh)
                    if (typeof window !== "undefined" && !("ontouchstart" in window)) {
                      setIsHelpOpen(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-950 bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 hover:from-amber-200 hover:to-yellow-200 active:from-amber-300 active:to-yellow-300 rounded-lg border border-amber-300/80 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0 ml-2"
                  aria-label="Layanan Pasang Iklan Sponsor & Promosi UMKM"
                >
                  <Megaphone className="w-3 h-3 text-amber-700" />
                  <span>Pasang Iklan</span>
                </button>
            </div>
          </div>

          <div className="w-full bg-white">
            {displayFeed.length === 0 ? (
              <div className="py-5 sm:py-6 px-4 text-center flex flex-col items-center justify-center space-y-2.5 animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shadow-2xs">
                  <Newspaper className="w-7 h-7 stroke-[1.75] text-neutral-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">Belum Ada Kabar Warga</h3>
                  <p className="text-xs text-neutral-500 max-w-xs leading-normal">
                    Aplikasi siap digunakan. Belum ada postingan warga yang diterbitkan. Jadilah yang pertama membagikan kabar!
                  </p>
                </div>
              </div>
            ) : (
              displayFeed.map((f, index) => (
              <Fragment key={f.id}>
                {index > 0 && (
                  <div
                    id={`post-divider-${index}`}
                    className="w-full h-[2px] bg-neutral-200"
                    aria-hidden="true"
                  />
                )}
                <article
                  id={`feed-post-${f.id}`}
                  data-post-id={f.id}
                  className={`w-full bg-white space-y-3 pt-3.5 pb-4 ${
                    highlightedPostId === f.id
                      ? "ring-2 ring-[#00632B] bg-[#00632B]/5 shadow-md rounded-2xl"
                      : ""
                  }`}
                >
                  {/* Penanda bahwa postingan ini baru saja diunggah */}
                  {highlightedPostId === f.id && highlightSource === "new_upload" && (
                    <div className="mx-4 px-3.5 py-2 bg-gradient-to-r from-[#00632B] to-emerald-600 text-white text-[11px] font-bold rounded-lg flex items-center justify-between shadow-xs animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Kabar Anda berhasil diterbitkan & kini aktif!</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Baru Saja</span>
                    </div>
                  )}

                  {/* Penanda bahwa postingan ini dibuka dari klik kartu */}
                  {highlightedPostId === f.id && highlightSource === "card" && (
                    <div className="mx-4 px-3 py-1.5 bg-[#00632B] text-white text-[11px] font-semibold rounded-lg flex items-center justify-between shadow-xs animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kabar dari kartu yang Anda buka</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Kabar Warga</span>
                    </div>
                  )}

                  {/* Penanda temuan pencarian langsung di media kabar */}
                  {highlightedPostId === f.id && highlightSource === "search" && (
                    <div className="mx-4 px-3 py-1.5 bg-[#00632B] text-white text-[11px] font-semibold rounded-lg flex items-center justify-between shadow-xs animate-pulse">
                      <div className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span>Kabar berhasil ditemukan</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Kabar Warga</span>
                    </div>
                  )}
                {/* Post Header: Nama & Waktu tetap satu baris, tidak turun ke bawah */}
                <div className="px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Foto Profil Penulis Kabar */}
                    {f.avatar ? (
                      <img
                        src={f.avatar}
                        alt={f.user}
                        className="w-[clamp(44px,12vw,52px)] h-[clamp(44px,12vw,52px)] min-w-[clamp(44px,12vw,52px)] min-h-[clamp(44px,12vw,52px)] rounded-full object-cover shrink-0 ring-2 ring-emerald-600/25 ring-offset-1 ring-offset-white shadow-xs select-none"
                      />
                    ) : (
                      <div className="w-[clamp(44px,12vw,52px)] h-[clamp(44px,12vw,52px)] min-w-[clamp(44px,12vw,52px)] min-h-[clamp(44px,12vw,52px)] rounded-full bg-gradient-to-tr from-[#00632B] to-[#0A8742] ring-2 ring-emerald-600/25 ring-offset-1 ring-offset-white flex items-center justify-center text-[clamp(18px,5vw,22px)] font-bold text-white shadow-xs shrink-0 select-none">
                        {(f.user.trim().replace(/^@/, "")[0] || f.init || "W").toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const targetUser = f.user;
                            setSearchCategory("account");
                            setSearchQuery(`@${targetUser.replace(/^@/, "")}`);
                            setIsSearchOpen(true);
                          }}
                          className="text-[clamp(15px,4.2vw,17.5px)] font-bold text-neutral-900 tracking-[-0.01em] truncate max-w-[150px] sm:max-w-[220px] hover:text-[#00632B] transition-colors cursor-pointer text-left"
                          aria-label={`Lihat hanya postingan @${f.user}`}
                        >
                          {f.user.startsWith("@") ? f.user : `@${f.user}`}
                        </button>
                        <span className="text-neutral-300 text-[10px] shrink-0 select-none">·</span>
                        <span className="text-[clamp(11.5px,3vw,13px)] text-neutral-400 font-normal shrink-0 whitespace-nowrap">
                          {f.time}
                        </span>
                      </div>
                      {f.location && (
                        <div className="flex items-center gap-1 text-[clamp(11.5px,3vw,13px)] text-neutral-500 mt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchCategory("location");
                              setSearchQuery(f.location!);
                              setIsSearchOpen(true);
                            }}
                            className="flex items-center gap-1 text-neutral-500 hover:text-[#00632B] font-normal truncate max-w-[200px] transition cursor-pointer text-left"
                            aria-label={`Lihat semua postingan di ${f.location}`}
                          >
                            <MapPin className="w-[clamp(12px,3.2vw,13.5px)] h-[clamp(12px,3.2vw,13.5px)] text-yellow-500 shrink-0 inline" />
                            <span className="truncate">{f.location}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Icon Titik 3 di Atas Sudut Kanan Postingan */}
                  <div className="relative">
                    <button
                      id={`post-menu-btn-${f.id}`}
                      type="button"
                      onClick={() => setActiveMenuPostId((prev) => (prev === f.id ? null : f.id))}
                      className="w-[clamp(36px,9.5vw,40px)] h-[clamp(36px,9.5vw,40px)] flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition cursor-pointer"
                      aria-label="Opsi postingan"
                    >
                      <MoreHorizontal className="w-[clamp(19px,5vw,22px)] h-[clamp(19px,5vw,22px)] text-neutral-600" />
                    </button>

                    {/* Menu Dropdown Opsi Postingan (Simpan, Laporkan, Hapus, Salin) */}
                    {activeMenuPostId === f.id && (
                      <>
                        {/* Backdrop untuk menutup menu saat klik di luar */}
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveMenuPostId(null)}
                        />

                        <div
                          className="absolute right-0 top-9 z-40 w-52 bg-white rounded-2xl shadow-xl border border-neutral-200/90 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                        >
                          {/* 1. Opsi Simpan Kabar */}
                          <button
                            id={`menu-save-btn-${f.id}`}
                            type="button"
                            onClick={() => {
                              handleToggleSave(f.id);
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-neutral-50 transition cursor-pointer group"
                          >
                            <Bookmark
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                savedPostIds.includes(f.id)
                                  ? "fill-[#00632B] text-[#00632B]"
                                  : "text-neutral-600"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold leading-tight ${savedPostIds.includes(f.id) ? "text-[#00632B]" : "text-neutral-800"}`}>
                                {savedPostIds.includes(f.id) ? "Hapus dari Simpanan" : "Simpan Kabar"}
                              </p>
                              <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                                {savedPostIds.includes(f.id) ? "Tersimpan di koleksi Anda" : "Simpan untuk dibaca nanti"}
                              </p>
                            </div>
                          </button>

                          {/* 2. Opsi Laporkan Kabar (Pada postingan orang lain) ATAU Hapus Kabar (Pada postingan sendiri) */}
                          {isMyPost(f) ? (
                            <button
                              id={`menu-delete-btn-${f.id}`}
                              type="button"
                              onClick={() => {
                                setPostToDelete({ id: f.id, title: f.text, img: f.img });
                                setActiveMenuPostId(null);
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
                          ) : (
                            <button
                              id={`menu-report-btn-${f.id}`}
                              type="button"
                              onClick={() => {
                                handleReportPost(f.id, f.user, f.text);
                                setActiveMenuPostId(null);
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
                          )}

                          <div className="my-1 border-t border-neutral-100" />

                          {/* 3. Salin Tautan */}
                          <button
                            id={`menu-copy-btn-${f.id}`}
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(`${window.location.origin}/#post-${f.id}`);
                              }
                              handlePostShared(f.id);
                              showToast("Tautan kabar berhasil disalin");
                              setActiveMenuPostId(null);
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
                <div id={`feed-post-media-${f.id}`} className="w-full scroll-mt-20 feed-media-wrapper" style={{ touchAction: "pan-y" }}>
                  <FeedMedia
                    src={f.img}
                    thumbnail={f.thumbnail}
                    alt={f.text}
                    description={f.text}
                    mediaType={f.mediaType}
                    author={{
                      name: f.name || f.user || "Warga Kareba",
                      username: f.user,
                      email: f.email || `${f.user}@karebata.id`,
                      location: f.location || "Kawasan Sekitar",
                      time: f.time,
                      initials: (f.user ? f.user.trim().replace(/^@/, "")[0] : f.init || "W").toUpperCase(),
                      avatar: f.avatar,
                      description: f.text,
                    }}
                  />
                </div>

                {/* Post Content / Deskripsi di bawah media - Hanya menampilkan selengkapnya jika teks benar-benar panjang/terpotong */}
                <div className="px-4">
                  {(() => {
                    const isLong = f.text.length > 110 || f.text.split("\n").length > 2;
                    return (
                      <div
                        id={`post-desc-container-${f.id}`}
                        onClick={() => {
                          if (isLong) {
                            toggleExpandPost(f.id);
                          }
                        }}
                        className={`select-none ${isLong ? "cursor-pointer group" : ""}`}
                      >
                        <h3
                          className={`text-[clamp(18px,5vw,22px)] font-bold text-neutral-900 tracking-tight leading-snug transition-all ${
                            isLong && !expandedPosts[f.id] ? "line-clamp-2" : ""
                          }`}
                        >
                          {f.text}
                        </h3>
                        {isLong && (
                          <span className="text-[clamp(14px,3.8vw,16px)] font-bold text-[#00632B] hover:text-[#004f22] mt-1.5 inline-block">
                            {expandedPosts[f.id] ? "Tampilkan lebih sedikit" : "selengkapnya"}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Post Actions: Suka, Komentar, Bagikan, Laporkan/Hapus, Dilihat (Ukuran Ramping & Profesional) */}
                <div className="px-4 flex items-center gap-4 sm:gap-6 text-[clamp(12.5px,3.4vw,14px)] font-bold text-neutral-700">
                  <button
                    id={`like-btn-${f.id}`}
                    type="button"
                    onClick={() => handleToggleLike(f.id)}
                    className={`flex items-center gap-1.5 py-1.5 min-h-[40px] cursor-pointer transition ${
                      f.isLiked ? "text-red-500 font-bold" : "hover:text-red-500 text-neutral-600"
                    }`}
                    aria-label="Suka"
                  >
                    <Heart
                      className={`w-[clamp(18px,4.8vw,21px)] h-[clamp(18px,4.8vw,21px)] transition-transform active:scale-125 ${
                        f.isLiked ? "fill-red-500 text-red-500" : "text-neutral-500"
                      }`}
                    />
                    <span className="whitespace-nowrap font-bold">Suka</span>
                  </button>

                  <button
                    id={`share-btn-${f.id}`}
                    type="button"
                    onClick={() => setActiveSharePostId((prev) => (prev === f.id ? null : f.id))}
                    className={`flex items-center gap-1.5 py-1.5 min-h-[40px] cursor-pointer transition ${
                      activeSharePostId === f.id ? "text-emerald-600 font-bold" : "hover:text-emerald-600 text-neutral-600"
                    }`}
                    aria-label="Bagikan"
                  >
                    <Share2 className="w-[clamp(18px,4.8vw,21px)] h-[clamp(18px,4.8vw,21px)] text-neutral-500" />
                    <span className="whitespace-nowrap font-bold">Bagikan</span>
                  </button>

                  {/* Ikon Tayangan / View (Fitur Analitik) - Posisi di ujung kanan bar aksi */}
                  <div
                    className="flex items-center gap-1.5 py-1.5 min-h-[40px] text-neutral-500 select-none ml-auto sm:ml-0"
                    aria-label={`${(f.views || 0).toLocaleString("id-ID")} kali dilihat`}
                  >
                    <Eye className="w-[clamp(16px,4.2vw,18.5px)] h-[clamp(16px,4.2vw,18.5px)] text-neutral-400" />
                    <span className="text-[clamp(11.5px,3vw,13px)] text-neutral-500 font-normal whitespace-nowrap">{f.views ? f.views.toLocaleString("id-ID") : 0} dilihat</span>
                  </div>
                </div>

                {/* Bar Bagikan Interaktif (FB, WA, Salin) */}
                {activeSharePostId === f.id && (
                  <div className="mx-4 mt-2.5 px-3 py-0.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between animate-fade-in">
                    <ShareBar
                      newsUrl={window.location.href}
                      title={f.text}
                      onShared={() => {
                        handlePostShared(f.id);
                      }}
                      onShowToast={showToast}
                    />
                    <button
                      type="button"
                      onClick={() => setActiveSharePostId(null)}
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition shrink-0"
                      aria-label="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </article>

              {/* KARTU IKLAN BERSPONSOR DI SELA-SELA FEED BERITA WARGA */}
              {(() => {
                if (!adSettings.isEnabled) return null;
                const now = Date.now();
                const activeAds = adSettings.ads.filter(
                  (a) =>
                    a.isActive &&
                    (!a.expiresAt || a.expiresAt > now) &&
                    (a.displayFormat === "feed" || a.displayFormat === "both" || !a.displayFormat)
                );
                if (activeAds.length === 0) return null;

                const freq = Math.max(2, adSettings.frequency || 4);
                // Selipkan iklan secara otomatis setiap kelipatan `freq` berita
                const isAdSlot = (index + 1) % freq === 0;
                if (!isAdSlot) return null;

                const slotNum = Math.floor((index + 1) / freq) - 1;
                const adToShow = activeAds[slotNum % activeAds.length];

                return (
                  <div key={`ad-slot-${f.id}-${adToShow.id}`} className="w-full">
                    <div className="w-full h-[2px] bg-neutral-200" aria-hidden="true" />
                    <SponsorAdCard
                      ad={adToShow}
                      onOpenHelp={() => setIsHelpOpen(true)}
                      onShowToast={showToast}
                    />
                  </div>
                );
              })()}
            </Fragment>
          )))}
          </div>
        </section>
        </PullToRefresh>

        {/* TOMBOL MELAYANG KEMBALI KE MEDIA DI ATAS (MUNCUL OTOMATIS SAAT TERSCROLL KE BAWAH) */}
        {showScrollTop && !isSearchOpen && (
          <button
            id="scroll-to-top-btn"
            type="button"
            onClick={scrollToTop}
            className="fixed z-40 bg-neutral-900/85 hover:bg-neutral-950 active:scale-90 text-white px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-neutral-700/50 flex items-center gap-1.5 transition-all duration-200 cursor-pointer animate-fade-in group select-none"
            style={{
              bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
              right: "max(0.875rem, calc((100vw - 448px) / 2 + 0.875rem))",
            }}
            aria-label="Kembali ke media paling atas"
          >
            <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[11px] sm:text-xs font-semibold tracking-tight">Ke Atas</span>
          </button>
        )}



        {/* MODAL KONFIRMASI HAPUS POSTINGAN SENDIRI */}
        {postToDelete && (
          <div
            id="delete-post-modal-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 max-w-md mx-auto animate-fade-in touch-none overscroll-contain select-none"
            onClick={() => setPostToDelete(null)}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          >
            <div
              className="bg-white border border-neutral-200 rounded-2xl w-full p-5 space-y-4 shadow-2xl touch-auto select-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-neutral-900">Hapus Kabar</h3>
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus kabar ini? Kabar akan dihapus dari Kareba&apos;Ta.
              </p>

              <div className="flex gap-2.5 pt-1">
                <button
                  id="cancel-delete-post-btn"
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  className="flex-1 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="confirm-delete-post-btn"
                  type="button"
                  onClick={() => {
                    if (postToDelete) {
                      handleExecuteDeletePost(postToDelete.id, postToDelete.img);
                    }
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Hapus Kabar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN / MODAL LAPORKAN KABAR - FULL SCREEN */}
        {reportPostData && (
          <div
            id="report-post-modal-overlay"
            className="fixed inset-0 z-50 bg-white flex flex-col max-w-md mx-auto animate-fade-in touch-manipulation overscroll-none"
            style={{ touchAction: "manipulation", overscrollBehavior: "none" }}
          >
            {/* Header Full Screen */}
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 leading-tight">Laporkan Kabar</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Kabar oleh @{reportPostData.user}</p>
                </div>
              </div>
              <button
                id="close-report-modal-btn"
                type="button"
                onClick={() => {
                  setReportPostData(null);
                  setReportSuccessInfo(null);
                }}
                className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                aria-label="Tutup Halaman Laporan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccessInfo ? (
              /* Tampilan Konfirmasi Sukses Pelaporan ala Instagram / Facebook */
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center animate-fade-in space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00632B] flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-9 h-9" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-lg font-bold text-neutral-900">
                    Terima Kasih Atas Laporan Anda
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Laporan Anda mengenai kabar dari <span className="font-semibold text-neutral-800">@{reportSuccessInfo.targetUser}</span> telah berhasil dikirimkan ke tim pengawas.
                  </p>
                </div>

                {/* Info Kotak Penjelasan */}
                <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-neutral-700">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00632B] mt-1.5 shrink-0" />
                    <p className="leading-snug">
                      <b>Postingan telah disembunyikan</b> dari linimasa beranda Anda agar Anda tidak melihatnya kembali.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00632B] mt-1.5 shrink-0" />
                    <p className="leading-snug">
                      <b>Identitas Anda aman & rahasia.</b> Pengguna yang dilaporkan tidak akan pernah mengetahui siapa yang melaporkan.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#00632B] mt-1.5 shrink-0" />
                    <p className="leading-snug">
                      <b>Pengawas akan meninjau</b> konten ini dan mengambil tindakan tegas jika terbukti melanggar Pedoman Komunitas Kareba'Ta.
                    </p>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="w-full pt-2 space-y-2">
                  <button
                    id="finish-report-btn"
                    type="button"
                    onClick={() => {
                      setReportSuccessInfo(null);
                      setReportPostData(null);
                    }}
                    className="w-full py-3 px-4 bg-[#00632B] hover:bg-[#004f22] text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md"
                  >
                    Selesai
                  </button>
                  <button
                    id="undo-hide-post-btn"
                    type="button"
                    onClick={() => {
                      handleUnhidePost(reportSuccessInfo.postId);
                      setReportSuccessInfo(null);
                      setReportPostData(null);
                    }}
                    className="w-full py-2.5 px-4 text-neutral-500 hover:text-neutral-800 font-semibold text-xs transition cursor-pointer"
                  >
                    Batalkan Sembunyikan Postingan
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Konten Halaman Full Screen (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Kutipan konten yang dilaporkan */}
                  {reportPostData.text && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-600 italic">
                      &ldquo;{reportPostData.text}&rdquo;
                    </div>
                  )}

                  {/* Pilihan alasan pelaporan dengan deskripsi tegas untuk asusila / sensual */}
                  <div>
                    <label className="text-xs font-bold text-neutral-800 block mb-2">
                      Pilih Alasan Pelaporan:
                    </label>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Konten Asusila, Sensual & Pornografi",
                          desc: "Pakaian seksi/terbuka berlebihan, goyangan/tarian erotis, julur lidah sensual, atau gestur berbau pornografi.",
                        },
                        {
                          title: "Informasi Palsu / Hoaks",
                          desc: "Berita bohong, fitnah, atau kabar menyesatkan warga.",
                        },
                        {
                          title: "Ujaran Kebencian & Pelecehan",
                          desc: "SARA, perundungan, hinaan personal, atau pelecehan sesama warga.",
                        },
                        {
                          title: "Spam, Penipuan & Promosi Liar",
                          desc: "Iklan berulang, link berbahaya, penipuan uang, atau judi online.",
                        },
                        {
                          title: "Kekerasan & Bahaya Nyata",
                          desc: "Mendorong perkelahian, tawuran, senjata tajam, atau aksi kejahatan.",
                        },
                        {
                          title: "Pelanggaran Norma & Etika Lainnya",
                          desc: "Melanggar ketertiban dan pedoman etika komunitas Kareba'Ta.",
                        },
                      ].map((opt) => {
                        const isSelected = reportReason === opt.title;
                        return (
                          <label
                            key={opt.title}
                            onClick={() => setReportReason(opt.title)}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                              isSelected
                                ? "border-red-500 bg-red-50/50 text-neutral-900 ring-1 ring-red-400 shadow-xs"
                                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 text-neutral-700"
                            }`}
                          >
                            {/* Cincin Lingkaran: Abu-abu netral secara default, berubah Merah saat dipilih */}
                            <div
                              className={`w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                                isSelected
                                  ? "border-2 border-red-600 bg-white ring-2 ring-red-200"
                                  : "border-2 border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-red-600 transition-transform scale-100" />
                              )}
                            </div>
                            <input
                              type="radio"
                              name="report_reason"
                              checked={isSelected}
                              onChange={() => setReportReason(opt.title)}
                              className="sr-only"
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold leading-tight ${isSelected ? "text-red-700" : "text-neutral-900"}`}>
                                {opt.title}
                              </p>
                              <p className="text-[11px] text-neutral-500 leading-normal mt-1">{opt.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Catatan tambahan opsional */}
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Keterangan Tambahan <span className="text-neutral-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      id="report-details-input"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Jelaskan detail tindakan atau bagian yang melanggar..."
                      rows={3}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl p-3 text-base text-neutral-900 placeholder-neutral-400 outline-none focus:border-red-500 focus:bg-white transition resize-none"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed">
                    Laporan Anda bersifat rahasia. Tim moderator Kareba&apos;Ta akan segera meninjau dan menghapus konten jika terbukti melanggar norma komunitas.
                  </div>
                </div>

                {/* Footer Tombol Aksi Sticky di Bawah */}
                <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex gap-3 shadow-lg">
                  <button
                    id="cancel-report-btn"
                    type="button"
                    onClick={() => setReportPostData(null)}
                    className="flex-1 py-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    id="submit-report-btn"
                    type="button"
                    onClick={handleConfirmReport}
                    disabled={!reportReason}
                    className={`flex-1 py-3 text-xs font-bold text-white rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                      reportReason
                        ? "bg-red-600 hover:bg-red-700 active:scale-[0.99]"
                        : "bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>Kirim Laporan</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* MODAL EDIT PROFIL WARGA (IN-APP) - LATAR PUTIH */}
        {isEditProfileOpen && (
          <div
            id="edit-profile-modal-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 max-w-md mx-auto touch-none overscroll-contain select-none animate-fade-in"
            onClick={() => setIsEditProfileOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          >
            <div
              className="bg-white border border-neutral-200 rounded-2xl w-full p-5 space-y-4 shadow-2xl touch-auto select-auto"
              onClick={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-neutral-900">Ubah Nama Pengguna</h3>
                  <p className="text-[11px] text-neutral-500">Maksimal 13 huruf</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer rounded-lg hover:bg-neutral-100 transition"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Pratinjau Foto Profil dengan Huruf Pertama */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] text-white font-extrabold text-xl flex items-center justify-center shrink-0 border-2 border-[#E5A000] select-none">
                  {(newUserNameInput.trim().replace(/^@/, "")[0] || (userName[0] || "W")).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-500 font-medium">Foto Profil (Huruf Pertama Nama Pengguna):</p>
                  <p className="text-sm font-bold text-neutral-900 truncate">
                    Huruf "{(newUserNameInput.trim().replace(/^@/, "")[0] || (userName[0] || "W")).toUpperCase()}"
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="edit-username-input" className="text-xs text-neutral-600 font-medium">
                    Nama Pengguna
                  </label>
                  <span className={`text-[11px] font-semibold ${newUserNameInput.length >= 13 ? "text-amber-600" : "text-neutral-400"}`}>
                    {newUserNameInput.length}/13
                  </span>
                </div>
                <div className="relative flex items-center bg-neutral-50 rounded-xl border border-neutral-300 focus-within:border-[#00632B] focus-within:bg-white transition-all">
                  <span className="pl-3.5 text-sm font-semibold select-none text-neutral-400">
                    @
                  </span>
                  <input
                    id="edit-username-input"
                    type="text"
                    maxLength={13}
                    value={newUserNameInput.replace(/^@/, "")}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^@/, "").replace(/\s+/g, "_").slice(0, 13);
                      setNewUserNameInput(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newUserNameInput.trim()) {
                        const trimmed = newUserNameInput.trim().replace(/^@/, "").slice(0, 13);
                        if (trimmed) {
                          setUserName(trimmed);
                          if (currentUser) {
                            localStorage.setItem(`karebata_custom_username_${currentUser.uid}`, trimmed);
                            saveUserProfile(currentUser.uid, trimmed).catch(() => {});
                          }
                          localStorage.setItem("karebata_username", trimmed);
                          const cleanInit = (trimmed[0] || "W").toUpperCase();
                          setFeed((prev) =>
                            prev.map((item) =>
                              isMyPost(item)
                                ? { ...item, user: trimmed, name: trimmed, init: cleanInit, avatar: undefined }
                                : item
                            )
                          );
                          setPosts((prev) =>
                            prev.map((p) =>
                              isMyPost(p)
                                ? { ...p, user: trimmed, name: trimmed, init: cleanInit }
                                : p
                            )
                          );
                          setIsEditProfileOpen(false);
                          showToast(`Nama pengguna berhasil diperbarui: @${trimmed}`);
                        }
                      }
                    }}
                    placeholder="nama_kamu"
                    className="w-full py-2.5 pl-1 pr-3 bg-transparent text-sm font-bold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  Maksimal 13 karakter huruf/angka.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="save-username-btn"
                  type="button"
                  disabled={!newUserNameInput.trim().replace(/^@/, "")}
                  onClick={() => {
                    const trimmed = newUserNameInput.trim().replace(/^@/, "").slice(0, 13);
                    if (trimmed) {
                      setUserName(trimmed);
                      if (currentUser) {
                        localStorage.setItem(`karebata_custom_username_${currentUser.uid}`, trimmed);
                        if (currentUser.email) {
                          localStorage.setItem(`karebata_registered_${currentUser.email.toLowerCase()}`, trimmed);
                        }
                        saveUserProfile(currentUser.uid, trimmed, currentUser.email || undefined).catch(() => {});
                      }
                      localStorage.setItem("karebata_username", trimmed);
                      localStorage.setItem("karebata_last_registered_username", trimmed);
                      const cleanInit = (trimmed[0] || "W").toUpperCase();
                      setFeed((prev) =>
                        prev.map((item) =>
                          isMyPost(item)
                            ? { ...item, user: trimmed, name: trimmed, init: cleanInit, avatar: undefined }
                            : item
                        )
                      );
                      setPosts((prev) =>
                        prev.map((p) =>
                          isMyPost(p)
                            ? { ...p, user: trimmed, name: trimmed, init: cleanInit }
                            : p
                        )
                      );
                      setIsEditProfileOpen(false);
                      showToast(`Nama pengguna berhasil diperbarui: @${trimmed}`);
                    }
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                    newUserNameInput.trim().replace(/^@/, "")
                      ? "bg-[#00632B] hover:bg-[#004f22] text-white cursor-pointer active:scale-95"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN KOMENTAR LAYAR PENUH (FULL SCREEN) */}
        {activeCommentItem && (
          <div
            id="comments-fullscreen-page"
            className="fixed inset-0 z-50 bg-white flex flex-col w-full h-full overflow-hidden animate-fade-in"
          >
            {/* Header Halaman Komentar Layar Penuh */}
            <header className="px-4 py-3 sm:py-3.5 border-b border-neutral-200 bg-white flex items-center justify-between sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveCommentItem(null)}
                  className="p-1.5 -ml-1.5 rounded-full text-neutral-700 hover:bg-neutral-100 transition active:scale-95 shrink-0"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-neutral-900 leading-tight">Komentar</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-neutral-100 text-neutral-600 rounded-full shrink-0">
                      {activeCommentItem.comments?.length || 0}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate">Kabar oleh @{activeCommentItem.user}</p>
                </div>
              </div>
            </header>

            {/* Ringkasan Singkat Postingan yang Sedang Dikomentari */}
            <div className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 flex items-center gap-3 shrink-0">
              {activeCommentItem.img && (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border border-neutral-200">
                  {activeCommentItem.mediaType === "video" ? (
                    <video src={activeCommentItem.img} className="w-full h-full object-cover" />
                  ) : (
                    <img src={activeCommentItem.img} alt="Pratinjau" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                  {activeCommentItem.name || `@${activeCommentItem.user}`}
                </p>
                <p className="text-xs text-neutral-600 truncate mt-0.5">
                  {activeCommentItem.text}
                </p>
              </div>
            </div>

            {/* List komentar Layar Penuh */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-neutral-50/50">
              {activeCommentItem.comments && activeCommentItem.comments.length > 0 ? (
                activeCommentItem.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] border-2 border-[#E5A000] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs select-none">
                      {c.user[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs font-bold text-neutral-900 truncate max-w-[150px] sm:max-w-[190px]">
                          {c.user}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0 whitespace-nowrap">
                          {c.time}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 mt-1 leading-relaxed">{c.text}</p>

                      {/* Aksi Komentar (Like, Balas, Hapus) */}
                      <CommentActions
                        likes={c.likes ?? 0}
                        isLiked={c.isLiked}
                        onLike={() => handleLikeComment(c.id)}
                        onReply={() => handleReplyComment(c.user)}
                        onDelete={() => handleDeleteComment(c.id)}
                        isOwner={c.user === userName}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-3">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">Belum ada komentar</p>
                  <p className="text-xs text-neutral-400 mt-1">Jadilah yang pertama memberikan tanggapan!</p>
                </div>
              )}
            </div>

            {/* Input komentar baru di bagian bawah layar penuh */}
            {currentBanStatus.isBanned ? (
              <div className="p-3 sm:p-4 border-t border-rose-200 bg-rose-50 flex items-center justify-between gap-3 shrink-0 text-xs text-rose-900">
                <span className="font-semibold">
                  Tabe' akun Anda telah ditangguhkan karena melanggar aturan komunitas.
                </span>
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="px-2.5 py-1 bg-rose-200 hover:bg-rose-300 font-bold rounded-lg transition shrink-0 cursor-pointer"
                >
                  Bantuan
                </button>
              </div>
            ) : (
              <div className="p-3 sm:p-4 border-t border-neutral-200 bg-white space-y-2 shrink-0">
                {!checkContentModeration(commentInputText).isClean && (
                  <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fade-in">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    <span>Komentar mengandung kata tidak pantas/jorok. Mohon gunakan bahasa santun.</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] border-2 border-[#E5A000] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs select-none">
                    {userName[0].toUpperCase()}
                  </div>
                  <input
                    id="comment-input-field"
                    type="text"
                    value={commentInputText}
                    onChange={(e) => setCommentInputText(e.target.value)}
                    placeholder={`Tulis komentar santun sebagai @${userName}...`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmitComment();
                      }
                    }}
                    className={`flex-1 border rounded-full px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition ${
                      !checkContentModeration(commentInputText).isClean
                        ? "bg-red-50 border-red-300"
                        : "bg-neutral-100 border-neutral-300 focus:border-[#00632B] focus:bg-white"
                    }`}
                  />
                  <button
                    id="send-comment-btn"
                    type="button"
                    disabled={!commentInputText.trim() || !checkContentModeration(commentInputText).isClean}
                    onClick={handleSubmitComment}
                    className="p-2.5 bg-[#00632B] hover:bg-[#004f22] disabled:opacity-40 text-white rounded-full transition shadow-xs active:scale-95 flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Kirim Komentar"
                  >
                    <Send className="w-4 h-4 translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HALAMAN PENCARIAN TERARAH: HASIL TAMPIL EKSKLUSIF DI SINI, BUKAN DI BERANDA */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery("");
            setSearchCategory("all");
          }}
          feed={feed}
          posts={posts}
          query={searchQuery}
          setQuery={setSearchQuery}
          activeCategory={searchCategory}
          onSelectCategory={(cat) => setSearchCategory(cat)}
          onOpenPostDetail={(post) => {
            const foundFeed = feed.find((f) => f.id === post.id);
            setActiveDetailPost((foundFeed || post) as PostItem);
          }}
          onDeletePost={(id, title, img) => {
            setPostToDelete({ id, title, img });
          }}
          isMyPost={(item) => isMyPost(item)}
        />

        {/* MODAL IKLAN POP-UP PROMOSI BERSPONSOR */}
        <SponsorPopupModal
          ad={activePopupAd}
          isOpen={Boolean(activePopupAd)}
          onClose={() => setActivePopupAd(null)}
          onShowToast={showToast}
        />

        {/* MODAL PUSAT BANTUAN & KONTAK WHATSAPP ADMIN DINAMIS */}
        <HelpContactModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          settings={helpSettings}
          onShowToast={showToast}
        />

        {/* MODAL / HALAMAN LOGIN GOOGLE KAREBA'TA */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            setIsLoginModalOpen(false);
            setPendingUploadAction(null);
          }}
          onSuccess={handleLoginSuccess}
          actionContext={pendingUploadAction}
        />

        {/* MODAL / TAMPILAN DETAIL KABAR LAYAR PENUH (FULL SCREEN) UNTUK KARTU KABAR KAMU & KARTU TERSIMPAN */}
        {activeDetailPost && (
          <PostDetailModal
            post={activeDetailPost}
            feedItem={feed.find((f) => f.id === activeDetailPost.id)}
            views={feed.find((f) => f.id === activeDetailPost.id)?.views || activeDetailPost.views || 0}
            onClose={() => setActiveDetailPost(null)}
            onShowToast={showToast}
            isOwner={activeDetailPost ? isMyPost(activeDetailPost) : false}
            isSaved={Boolean(activeDetailPost && savedPostIds.includes(activeDetailPost.id))}
            onToggleSave={handleToggleSave}
            onShare={handlePostShared}
            userName={userName}
            initial={initial}
            isLiked={Boolean(
              feed.find((f) => f.id === activeDetailPost.id)?.isLiked ||
              likedPostIds.includes(activeDetailPost.id)
            )}
            likeCount={
              feed.find((f) => f.id === activeDetailPost.id)?.like || 0
            }
            onToggleLike={(id) => handleToggleLike(id)}
            commentsCount={
              feed.find((f) => f.id === activeDetailPost.id)?.comments?.length || 0
            }
            onOpenComments={() => {
              const targetFeedItem = feed.find((f) => f.id === activeDetailPost.id);
              if (targetFeedItem) {
                setActiveCommentItem(targetFeedItem);
              }
            }}
            onDelete={(id) => {
              setPostToDelete({ id, title: activeDetailPost?.title, img: activeDetailPost?.img });
              setActiveDetailPost(null);
            }}
            onReport={(id, user) => {
              handleReportPost(id, user, activeDetailPost?.title || activeDetailPost?.caption);
              setActiveDetailPost(null);
            }}
          />
        )}

        {/* MODAL PERINGATAN DURASI VIDEO LEBIH DARI 60 DETIK (1 MENIT) */}
        {videoDurationAlert?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-neutral-900">
                  Durasi Video Terlalu Panjang
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Video yang Anda pilih berdurasi{" "}
                  <span className="font-bold text-amber-600 font-mono">
                    {formatDuration(videoDurationAlert.duration)}
                  </span>
                  . Batas durasi maksimal di Kareba&apos;Ta adalah{" "}
                  <span className="font-bold text-[#00632B]">60 detik (1 menit)</span>.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 text-left space-y-1.5">
                <p className="text-[11px] font-bold text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00632B]" />
                  <span>Kenapa dibatasi 60 detik?</span>
                </p>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Agar kabar warga tetap padat &amp; to the point, cepat diunggah di HP, serta hemat kuota dan tidak membuat warga lain *buffering* saat menonton di beranda.
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVideoDurationAlert(null);
                    openCustomGallery();
                  }}
                  className="w-full py-2.5 px-4 bg-[#00632B] hover:bg-[#004f22] active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Pilih Video Lain (&lt; 60 Detik)
                </button>
                <button
                  type="button"
                  onClick={() => setVideoDurationAlert(null)}
                  className="w-full py-2 px-4 text-neutral-500 hover:text-neutral-800 text-xs font-semibold rounded-xl hover:bg-neutral-100 transition cursor-pointer"
                >
                  Tutup &amp; Potong di Galeri HP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
