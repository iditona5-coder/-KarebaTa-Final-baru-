import React, { useState } from "react";
import { User } from "firebase/auth";
import { CheckCircle2, ArrowRight, LogOut } from "lucide-react";
import { KarebaTaLogo } from "./KarebaTaLogo";

interface SetupUsernamePageProps {
  currentUser: User | null;
  initialValue?: string;
  onSaveUsername: (username: string) => void;
  onLogout?: () => void;
}

export const SetupUsernamePage: React.FC<SetupUsernamePageProps> = ({
  currentUser,
  initialValue = "",
  onSaveUsername,
  onLogout,
}) => {
  // Biarkan input awal kosong agar tulisan @nama_kamu langsung terlihat di papan edit nama
  const [usernameInput, setUsernameInput] = useState(
    initialValue && initialValue.trim() && initialValue !== "warga_kareba"
      ? initialValue.replace(/^@/, "").slice(0, 13)
      : ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Otomatis hilangkan spasi dan batasi 13 huruf
    const val = e.target.value.replace(/^@/, "").replace(/\s+/g, "_").slice(0, 13);
    setUsernameInput(val);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSave = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setErrorMessage("Silakan ketik nama pengguna Anda.");
      return;
    }
    if (trimmed.length < 2) {
      setErrorMessage("Nama pengguna minimal 2 huruf.");
      return;
    }
    if (trimmed.includes("@")) {
      setErrorMessage("Jangan gunakan tanda '@' atau alamat email sebagai nama.");
      return;
    }
    onSaveUsername(trimmed.slice(0, 13));
  };

  const userInitial = currentUser?.displayName
    ? currentUser.displayName[0].toUpperCase()
    : currentUser?.email
    ? currentUser.email[0].toUpperCase()
    : "U";

  const isReady = usernameInput.trim().length >= 2;

  return (
    <div
      className="fixed inset-0 w-full max-w-full h-[100dvh] max-h-[100dvh] bg-black text-neutral-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden overscroll-none selection:bg-[#E5A000] selection:text-neutral-900 box-border"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Header Atas Full Width (Tanpa tombol ganti akun) */}
      <header className="w-full border-b border-neutral-800 bg-black sticky top-0 z-10">
        <div className="w-full max-w-[500px] mx-auto box-border px-4 sm:px-5 py-3.5 flex items-center flex-wrap justify-between gap-2">
          <KarebaTaLogo showSubtitle={true} />
        </div>
      </header>

      {/* Main Content Area - Full Screen Seamless Flow */}
      <main className="w-full max-w-[500px] mx-auto box-border px-4 sm:px-5 py-6 flex-1 flex flex-col justify-center space-y-6">
          {/* Info Status Akun Google Terhubung */}
          {currentUser && (
            <div className="flex items-center flex-wrap justify-between gap-2.5 p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00632B] to-[#004f22] text-white font-extrabold text-lg flex items-center justify-center shrink-0 border-2 border-[#E5A000] select-none">
                  {(usernameInput.trim().replace(/^@/, "")[0] || userInitial || "W").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Akun Google Terhubung</span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/70 px-2.5 py-1.5 rounded-xl transition active:scale-95 shrink-0 cursor-pointer shadow-2xs"
                  title="Ganti ke akun Google yang lain"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Beralih Akun</span>
                </button>
              )}
            </div>
          )}

          {/* Judul Bersih */}
          <div className="space-y-1 text-left">
            <h1
              className="text-xl sm:text-2xl font-[900] text-white tracking-tight"
              style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
            >
              Nama Pengguna
            </h1>
          </div>

          {/* Form Input Nama Pengguna (Tanpa Cincin / Bayangan Ring) */}
          <div className="space-y-2">
            <div className="relative flex items-center bg-neutral-900 rounded-2xl border-2 border-neutral-700 focus-within:border-emerald-500 focus-within:bg-neutral-950 transition-all min-w-0">
              <span className="pl-4 text-base sm:text-lg font-semibold select-none text-neutral-400 shrink-0">
                @
              </span>
              <input
                id="username-setup-input"
                type="text"
                autoFocus
                maxLength={13}
                value={usernameInput}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                }}
                placeholder="nama_kamu"
                className="flex-1 min-w-0 w-full py-3.5 pl-0.5 pr-2 bg-transparent text-base sm:text-lg font-bold text-white placeholder:text-neutral-500 placeholder:font-normal outline-none"
              />
              <span className={`pr-4 text-xs font-semibold shrink-0 ${usernameInput.length >= 13 ? "text-amber-400" : "text-neutral-400"}`}>
                {usernameInput.length}/13
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs text-rose-400 font-semibold pt-0.5 animate-shake">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Tombol Simpan - Responsif penuh di semua ukuran HP */}
          <button
            id="submit-username-btn"
            type="button"
            onClick={handleSave}
            disabled={!isReady}
            className={`w-full py-3.5 px-4 sm:px-5 font-bold text-[clamp(13px,3.8vw,15.5px)] rounded-2xl flex flex-wrap items-center justify-center gap-2 text-center transition-all select-none ${
              isReady
                ? "bg-[#00632B] hover:bg-[#004f22] text-white shadow-lg shadow-emerald-950/30 active:scale-[0.98] cursor-pointer"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed shadow-none"
            }`}
          >
            <span>Simpan & Masuk ke Beranda</span>
            <ArrowRight className={`w-4 h-4 shrink-0 ${isReady ? "text-white" : "text-neutral-500"}`} />
          </button>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[500px] mx-auto box-border border-t border-neutral-800 py-3.5 px-4 text-center bg-black">
        <p className="text-[11px] text-neutral-500">
          © {new Date().getFullYear()} Kareba'Ta — Beritamu, Suaramu
        </p>
      </footer>
    </div>
  );
};
