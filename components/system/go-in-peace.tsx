"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface GoInPeaceProps {
  onComplete?: () => void;
  durationMs?: number;
}

export function GoInPeace({
  onComplete,
  durationMs = 1200,
}: GoInPeaceProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1.2s fade out sequence
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, durationMs - 400);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0B] text-center transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5 p-6 animate-fadeIn">
        <div className="w-[84px] h-[84px] relative">
          <Image
            src="/files/bible-rhema-ai-emblem.png"
            alt="Bible Rhema AI"
            width={84}
            height={84}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="serif text-[28px] font-semibold text-[#F3E5AB] m-0">
          Go in peace
        </h2>
        <p className="muted text-[15px] italic font-serif max-w-sm m-0">
          &ldquo;The Lord bless you and keep you; the Lord make his face shine upon you and be gracious to you.&rdquo;
        </p>
      </div>
    </div>
  );
}
