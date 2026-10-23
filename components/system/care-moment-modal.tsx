"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CareMomentProps {
  onContinue?: () => void;
  onPrayWithMe?: () => void;
}

export function CareMomentCard({ onContinue, onPrayWithMe }: CareMomentProps) {
  const router = useRouter();
  const [showHotlines, setShowHotlines] = useState(false);

  const handlePray = () => {
    if (onPrayWithMe) onPrayWithMe();
    else router.push("/altar");
  };

  return (
    <div className="card p-6 flex flex-col gap-3.5 border-[rgba(243,229,171,0.2)] text-left">
      <div className="flex flex-col gap-3.5 p-1.5">
        <h3 className="serif text-[22px] font-semibold leading-[1.3] text-[#F8F9FA] m-0">
          It sounds like you are carrying a lot.
        </h3>
        <p className="muted text-[14px] leading-[1.65] m-0">
          You do not have to carry it alone. If you are in danger or thinking of harming yourself, please contact Nigeria National Emergency (112), MANI (0809 111 6264), or a person you trust right now.
        </p>

        {showHotlines && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#17171A] border border-[rgba(243,229,171,0.18)] my-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Nigeria National Emergency:</span>
              <a href="tel:112" className="text-[#D4AF37] font-mono font-bold hover:underline">112 (Toll-free 24/7)</a>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">MANI Crisis Helpline:</span>
              <a href="tel:08091116264" className="text-[#D4AF37] font-mono font-bold hover:underline">0809 111 6264</a>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Lagos MiND Lifeline:</span>
              <a href="tel:07000006463" className="text-[#D4AF37] font-mono font-bold hover:underline">070 0000 6463</a>
            </div>
          </div>
        )}

        <div className="flex gap-2 flex-wrap pt-1">
          <button
            type="button"
            onClick={() => setShowHotlines(!showHotlines)}
            className="btn btn-p"
          >
            Get help now
          </button>
          <button
            type="button"
            onClick={handlePray}
            className="btn btn-s"
          >
            Pray with me
          </button>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="btn btn-q"
            >
              Continue
            </button>
          )}
        </div>

        <span className="dim text-[12px] leading-[1.5] pt-1">
          Bible Rhema AI is a study aid, not pastoral or medical care.
        </span>
      </div>
    </div>
  );
}

interface CareMomentModalProps extends CareMomentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CareMomentModal({
  open,
  onOpenChange,
  onPrayWithMe,
}: CareMomentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-2xl">
        <div className="p-1">
          <CareMomentCard
            onContinue={() => onOpenChange(false)}
            onPrayWithMe={() => {
              onOpenChange(false);
              if (onPrayWithMe) onPrayWithMe();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
