"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface BreathingOrbProps {
  mode?: string;
  autoStart?: boolean;
}

export function BreathingOrb({
  mode = "default",
  autoStart = true,
}: BreathingOrbProps) {
  const [active, setActive] = useState(autoStart);

  return (
    <div className="flex flex-col items-center justify-center h-full relative z-10 py-8">
      {/* Kindle 4-7-8 Breath Stage */}
      <div
        className="stage !h-[260px] !w-[260px] !rounded-full relative flex items-center justify-center shadow-2xl border-[rgba(243,229,171,0.18)]"
        role="img"
        aria-label="4-7-8 Biblical Breath stillness orb"
        onClick={() => setActive(!active)}
      >
        {active && (
          <>
            <span className="hring !w-[160px] !h-[160px]" />
            <span className="orb !w-[96px] !h-[96px]" />
            <span className="lbl3 l1 !bottom-7">BREATHE IN · 4</span>
            <span className="lbl3 l2 !bottom-7">HOLD · 7</span>
            <span className="lbl3 l3 !bottom-7">OUT · 8</span>
          </>
        )}
      </div>

      <div className="mt-8 text-center space-y-1">
        <h3 className="serif text-xl text-[#F3E5AB] font-semibold m-0">
          Biblical Stillness
        </h3>
        <p className="dim text-xs tracking-wider uppercase m-0">
          Inhale Grace · Be Still &amp; Know · Exhale Burden
        </p>
      </div>

      <p className="text-[11px] text-[#8F8F98] mt-4">
        4 seconds in, 7 held with a shimmer ring, 8 out. The orb is the timer.
      </p>
    </div>
  );
}
