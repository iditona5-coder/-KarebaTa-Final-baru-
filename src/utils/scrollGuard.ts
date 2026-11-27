// Utilitas pelindung global agar gestur scroll layar (termasuk tap untuk menghentikan momentum scroll)
// tidak pernah dianggap sebagai ketukan/klik yang membuka modal, layar penuh, atau tirai overlay.

interface GestureState {
  id: number;
  startTime: number;
  startX: number;
  startY: number;
  startScrollY: number;
  startScrollX: number;
  startedDuringScroll: boolean;
  moved: boolean;
  cancelled: boolean;
}

const SCROLL_ACTIVE_WINDOW_MS = 180;
const SUPPRESS_AFTER_SCROLL_MS = 320;
const MOVE_THRESHOLD_PX = 6;

let initialized = false;
let gestureSeq = 0;
let lastScrollTime = 0;
let suppressInteractionUntil = 0;
let activeGesture: GestureState | null = null;
let lastEndedGestureBlockedUntil = 0;

function getWindowScrollY(): number {
  if (typeof window === "undefined") return 0;
  return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
}

function getWindowScrollX(): number {
  if (typeof window === "undefined") return 0;
  return window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
}

function markBlocked(durationMs = SUPPRESS_AFTER_SCROLL_MS) {
  const until = Date.now() + durationMs;
  if (until > suppressInteractionUntil) {
    suppressInteractionUntil = until;
  }
  if (until > lastEndedGestureBlockedUntil) {
    lastEndedGestureBlockedUntil = until;
  }
}

export function initGlobalScrollGuard(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  (window as any).__KAREBATA_LAST_SCROLL_TIME__ = 0;

  const handleScroll = (e: Event) => {
    const now = Date.now();
    lastScrollTime = now;
    (window as any).__KAREBATA_LAST_SCROLL_TIME__ = now;

    if (activeGesture) {
      const target = e.target;
      const isDocumentScroll =
        target === document ||
        target === document.documentElement ||
        target === document.body ||
        target === window;

      if (isDocumentScroll) {
        const dy = Math.abs(getWindowScrollY() - activeGesture.startScrollY);
        const dx = Math.abs(getWindowScrollX() - activeGesture.startScrollX);
        if (dy > 2 || dx > 2 || activeGesture.startedDuringScroll) {
          activeGesture.moved = true;
          markBlocked();
        }
      } else {
        activeGesture.moved = true;
        markBlocked();
      }
    }
  };

  const startGesture = (x: number, y: number) => {
    const now = Date.now();
    // Jika touchstart dan pointerdown datang berurutan untuk sentuhan yang sama, pertahankan gestur yang sama
    if (
      activeGesture &&
      now - activeGesture.startTime < 80 &&
      Math.abs(x - activeGesture.startX) < 4 &&
      Math.abs(y - activeGesture.startY) < 4
    ) {
      return;
    }

    const isActivelyScrolling = now - lastScrollTime < SCROLL_ACTIVE_WINDOW_MS;
    gestureSeq += 1;
    activeGesture = {
      id: gestureSeq,
      startTime: now,
      startX: x,
      startY: y,
      startScrollY: getWindowScrollY(),
      startScrollX: getWindowScrollX(),
      startedDuringScroll: isActivelyScrolling,
      moved: false,
      cancelled: false,
    };
    if (isActivelyScrolling) {
      markBlocked(360);
    }
  };

  const moveGesture = (x: number, y: number) => {
    if (!activeGesture) return;
    const dx = Math.abs(x - activeGesture.startX);
    const dy = Math.abs(y - activeGesture.startY);
    const sdx = Math.abs(getWindowScrollX() - activeGesture.startScrollX);
    const sdy = Math.abs(getWindowScrollY() - activeGesture.startScrollY);

    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX || sdx > 2 || sdy > 2) {
      activeGesture.moved = true;
      markBlocked();
    }
  };

  const endGesture = (cancelled: boolean) => {
    if (!activeGesture) return;
    const endedId = activeGesture.id;
    if (cancelled) {
      activeGesture.cancelled = true;
      markBlocked();
    } else if (activeGesture.moved || activeGesture.startedDuringScroll) {
      markBlocked();
    }
    const wasBlocked = activeGesture.moved || activeGesture.cancelled || activeGesture.startedDuringScroll;
    if (wasBlocked) {
      lastEndedGestureBlockedUntil = Date.now() + 360;
    }
    setTimeout(() => {
      if (activeGesture && activeGesture.id === endedId) {
        activeGesture = null;
      }
    }, 80);
  };

  window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
  window.addEventListener(
    "wheel",
    () => {
      const now = Date.now();
      lastScrollTime = now;
      (window as any).__KAREBATA_LAST_SCROLL_TIME__ = now;
    },
    { capture: true, passive: true }
  );

  window.addEventListener(
    "pointerdown",
    (e) => {
      startGesture(e.clientX, e.clientY);
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "pointermove",
    (e) => {
      moveGesture(e.clientX, e.clientY);
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "pointerup",
    () => {
      endGesture(false);
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "pointercancel",
    () => {
      endGesture(true);
    },
    { capture: true, passive: true }
  );

  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches && e.touches.length === 1) {
        startGesture(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches && e.touches.length > 0) {
        moveGesture(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "touchend",
    () => {
      endGesture(false);
    },
    { capture: true, passive: true }
  );
  window.addEventListener(
    "touchcancel",
    () => {
      endGesture(true);
    },
    { capture: true, passive: true }
  );

  // Blokir event click nyata (e.isTrusted) bila berasal dari gestur scroll / drag / tap penahan momentum scroll
  window.addEventListener(
    "click",
    (e) => {
      if (!e.isTrusted) return;
      if (isScrollInteractionBlocked()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    { capture: true }
  );
}

export function isScrollInteractionBlocked(): boolean {
  const now = Date.now();
  if (now < suppressInteractionUntil || now < lastEndedGestureBlockedUntil) {
    return true;
  }
  if (now - lastScrollTime < 150) {
    return true;
  }
  if (
    activeGesture &&
    (activeGesture.moved || activeGesture.cancelled || activeGesture.startedDuringScroll)
  ) {
    return true;
  }
  return false;
}
