import React, { useState, useRef, useLayoutEffect, useEffect } from "react";

interface ExpandablePostTextProps {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
  maxLines?: 3 | 5;
  variant: "text-only" | "media-caption" | "detail-caption";
  containerId?: string;
  children?: React.ReactNode;
}

const LINE_CLAMP_CLASS: Record<3 | 5, string> = {
  3: "line-clamp-3",
  5: "line-clamp-5",
};

export const ExpandablePostText: React.FC<ExpandablePostTextProps> = ({
  text,
  isExpanded,
  onToggle,
  maxLines = 5,
  variant,
  containerId,
  children,
}) => {
  const textRef = useRef<HTMLParagraphElement | HTMLHeadingElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const measureOverflow = () => {
    const el = textRef.current;
    if (!el || isExpanded) return;
    setHasOverflow(el.scrollHeight > el.clientHeight + 2);
  };

  useLayoutEffect(() => {
    if (!isExpanded) {
      measureOverflow();
    }
  }, [text, maxLines, isExpanded]);

  useEffect(() => {
    const el = textRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (!isExpanded) {
        measureOverflow();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, maxLines, isExpanded]);

  const clampClass = !isExpanded ? LINE_CLAMP_CLASS[maxLines] : "";
  const isInteractive = hasOverflow || isExpanded;

  if (variant === "text-only") {
    return (
      <div
        id={containerId}
        onClick={() => {
          if (isInteractive) onToggle();
        }}
        className={`w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-neutral-50 via-emerald-50/30 to-amber-50/20 border border-neutral-200/90 shadow-2xs transition-all ${
          isInteractive ? "cursor-pointer" : ""
        }`}
      >
        <p
          ref={textRef as React.RefObject<HTMLParagraphElement>}
          className={`text-base sm:text-lg font-bold text-neutral-900 leading-relaxed tracking-tight whitespace-pre-wrap break-words select-text ${clampClass}`}
        >
          {text}
        </p>
        {isInteractive && (
          <span className="text-sm font-bold text-[#00632B] hover:text-[#004f22] mt-2 inline-block">
            {isExpanded ? "Tampilkan lebih sedikit" : "selengkapnya"}
          </span>
        )}
        {children}
      </div>
    );
  }

  if (variant === "detail-caption") {
    return (
      <div
        id={containerId}
        onClick={() => {
          if (isInteractive) onToggle();
        }}
        className={`select-none ${isInteractive ? "cursor-pointer group" : ""}`}
      >
        <h3
          ref={textRef as React.RefObject<HTMLHeadingElement>}
          className={`text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug whitespace-pre-wrap break-words transition-all ${clampClass}`}
        >
          {text}
        </h3>
        {isInteractive && (
          <span className="text-xs font-semibold text-[#00632B] hover:text-[#004f22] mt-1 inline-block">
            {isExpanded ? "Tampilkan lebih sedikit" : "selengkapnya"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      id={containerId}
      onClick={() => {
        if (isInteractive) onToggle();
      }}
      className={`select-none ${isInteractive ? "cursor-pointer group" : ""}`}
    >
      <h3
        ref={textRef as React.RefObject<HTMLHeadingElement>}
        className={`text-[clamp(18px,5vw,22px)] font-bold text-neutral-900 tracking-tight leading-snug whitespace-pre-wrap break-words transition-all ${clampClass}`}
      >
        {text}
      </h3>
      {isInteractive && (
        <span className="text-[clamp(14px,3.8vw,16px)] font-bold text-[#00632B] hover:text-[#004f22] mt-1.5 inline-block">
          {isExpanded ? "Tampilkan lebih sedikit" : "selengkapnya"}
        </span>
      )}
    </div>
  );
};
