import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Video,
  Camera,
  Copy,
  Check,
  ShieldAlert,
  Heart,
  MessageSquare,
  PenLine,
  Bookmark,
  Flag,
  Mail,
} from "lucide-react";
import { KarebaTaLogo } from "./KarebaTaLogo";
import { loginWithGoogle } from "../services/firebase";

export type LoginActionContext =
  | "camera"
  | "gallery"
  | "text_post"
  | "reaction"
  | "comment"
  | "save"
  | "report"
  | "inbox"
  | "general"
  | null;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user?: any) => void;
  actionContext?: LoginActionContext;
  customMessage?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionContext = "general",
  customMessage = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDomainError, setIsDomainError] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";

  const handleCopyHost = () => {
    if (navigator?.clipboard && currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsDomainError(false);
    try {
      sessionStorage.setItem("karebata_active_session", "true");
      sessionStorage.setItem("karebata_session_active", "true");
      const res = await loginWithGoogle();
      if (res.user) {
        onSuccess(res.user);
      } else if (res.error) {
        sessionStorage.removeItem("karebata_active_session");
        sessionStorage.removeItem("karebata_session_active");
        if (res.error.includes("popup-closed-by-user")) {
          setErrorMessage("Jendela masuk Google ditutup. Silakan coba kembali.");
        } else if (res.error.includes("unauthorized-domain") || res.error.includes("auth/unauthorized-domain")) {
          setIsDomainError(true);
          setErrorMessage(
            `Domain "${currentHost}" belum dimasukkan ke Authorized Domains Firebase Authentication Console.`
          );
        } else {
          setErrorMessage(res.error || "Gagal masuk dengan akun Google.");
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("unauthorized-domain") || err?.code === "auth/unauthorized-domain") {
        setIsDomainError(true);
        setErrorMessage(
          `Domain "${currentHost}" belum dimasukkan ke Authorized Domains Firebase Authentication Console.`
        );
      } else {
        setErrorMessage(err?.message || "Terjadi kendala saat menghubungkan ke akun Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (actionContext) {
      case "camera":
        return "Ambil Foto & Bagikan Kabar";
      case "gallery":
        return "Unggah Foto atau Video";
      case "text_post":
        return "Tulis Kabar Warga";
      case "reaction":
        return "Beri Reaksi Kabar";
      case "comment":
        return "Ikut Berkomentar";
      case "save":
        return "Simpan Kabar";
      case "report":
        return "Laporkan Kabar";
      case "inbox":
        return "Komentar Masuk";
      default:
        return "Masuk ke Kareba'Ta";
    }
  };

  const getActionSubtitle = () => {
    if (customMessage && customMessage.trim()) return customMessage;
    switch (actionContext) {
      case "camera":
        return "Masuk dengan Akun Google untuk menggunakan kamera dan membagikan momen warga secara langsung.";
      case "gallery":
        return "Masuk dengan Akun Google untuk memilih dan menerbitkan foto atau video dari galeri HP.";
      case "text_post":
        return "Masuk dengan Akun Google untuk menulis dan menerbitkan kabar teks warga.";
      case "reaction":
        return "Masuk dengan Akun Google untuk menyukai atau memberikan reaksi pada kabar warga.";
      case "comment":
        return "Masuk dengan Akun Google untuk mengirim, membalas, atau menyukai komentar.";
      case "save":
        return "Masuk dengan Akun Google agar kabar pilihan tersimpan ke akun Anda.";
      case "report":
        return "Masuk dengan Akun Google untuk mengirim laporan pelanggaran konten.";
      case "inbox":
        return "Masuk dengan Akun Google untuk melihat komentar dan balasan masuk.";
      default:
        return "Masuk dengan Akun Google untuk berbagi kabar, memberi reaksi, dan ikut berkomentar.";
    }
  };

  const renderContextIcon = () => {
    switch (actionContext) {
      case "camera":
        return <Camera className="w-7 h-7" />;
      case "gallery":
        return <Video className="w-7 h-7" />;
      case "text_post":
        return <PenLine className="w-7 h-7" />;
      case "reaction":
        return <Heart className="w-7 h-7" />;
      case "comment":
        return <MessageSquare className="w-7 h-7" />;
      case "save":
        return <Bookmark className="w-7 h-7" />;
      case "report":
        return <Flag className="w-7 h-7" />;
      case "inbox":
        return <Mail className="w-7 h-7" />;
      default:
        return <ShieldCheck className="w-7 h-7" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] mx-auto box-border bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 transform transition-all duration-200 animate-scale-up max-h-[92dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal dengan Logo Kareba'Ta & Tombol Tutup */}
        <div className="relative px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-neutral-100 flex items-center flex-wrap justify-between gap-2 bg-neutral-50/70 shrink-0">
          <KarebaTaLogo showSubtitle={true} />
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200/70 hover:bg-neutral-300 text-neutral-600 hover:text-neutral-900 transition flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            aria-label="Tutup jendela login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama */}
        <div className="p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center overflow-y-auto">
          {/* Ikon Kontekstual */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3 text-[#E5A000] shadow-xs">
            {renderContextIcon()}
          </div>

          <h2
            id="login-modal-title"
            className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight"
            style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
          >
            {getActionTitle()}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
            {getActionSubtitle()}
          </p>

          {/* Banner Informasi: Membaca Tetap Bebas */}
          <div className="mt-3.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200/70 flex flex-wrap items-center justify-center gap-2 text-[11px] text-emerald-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Membaca & menonton kabar warga tetap bebas tanpa login</span>
          </div>

          {/* Pesan Error / Bantuan Khusus Unauthorized Domain */}
          {isDomainError ? (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-left text-xs space-y-2.5">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Domain belum diizinkan di Firebase Console</span>
              </div>
              <p className="text-neutral-700 text-[11px] leading-relaxed">
                Google membatasi autentikasi di domain ini. Silakan salin nama domain berikut dan tambahkan ke <b>Authorized Domains</b> di Firebase Console:
              </p>

              <div className="flex items-center flex-wrap gap-1.5 bg-white border border-amber-200 rounded-xl p-1.5">
                <span className="text-[11px] font-mono text-neutral-800 truncate flex-1 min-w-[140px] px-1">
                  {currentHost}
                </span>
                <button
                  type="button"
                  onClick={handleCopyHost}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-1 transition shrink-0 cursor-pointer"
                >
                  {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedDomain ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="mt-3.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium text-left">
              {errorMessage}
            </div>
          ) : null}

          {/* Tombol Utama: Masuk dengan Google */}
          <div className="mt-5 space-y-2.5">
            <button
              id="login-modal-google-btn"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-800 border-2 border-neutral-300 hover:border-neutral-400 rounded-2xl font-bold text-[clamp(13px,3.6vw,15px)] flex flex-wrap items-center justify-center gap-2.5 text-center transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98] disabled:opacity-50 select-none"
            >
              {isLoading ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-[#00632B] animate-spin shrink-0" />
                  <span className="text-neutral-600">Menghubungkan Akun Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="font-bold">Masuk dengan Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
            >
              Nanti Saja, Lanjut Baca Kabar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
