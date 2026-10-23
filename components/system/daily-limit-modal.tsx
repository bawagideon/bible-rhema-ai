"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DailyLimitProps {
  used?: number;
  total?: number;
  onSeePlans?: () => void;
  onOpenSanctuary?: () => void;
}

export function DailyLimitCard({
  used = 5,
  total = 5,
  onSeePlans,
  onOpenSanctuary,
}: DailyLimitProps) {
  const router = useRouter();

  const handleSeePlans = () => {
    if (onSeePlans) onSeePlans();
    else router.push("/pricing");
  };

  const handleOpenSanctuary = () => {
    if (onOpenSanctuary) onOpenSanctuary();
    else router.push("/sanctuary");
  };

  return (
    <div className="card p-6 flex flex-col gap-3.5 border-[rgba(243,229,171,0.18)]">
      <div className="flex flex-col gap-3 items-start text-left">
        <span className="eyebrow">Daily limit reached</span>
        <h3 className="serif text-[22px] font-semibold text-[#F8F9FA] leading-[1.3] m-0">
          You have used today’s {used || total} studies
        </h3>
        <p className="muted text-[14px] leading-[1.6] m-0">
          Your limit resets at midnight. Meanwhile, the Scripture reader, Sanctuary and your Altar are all open.
        </p>
        <div className="flex gap-2 flex-wrap pt-2">
          <button
            type="button"
            onClick={handleSeePlans}
            className="btn btn-p"
          >
            See plans
          </button>
          <button
            type="button"
            onClick={handleOpenSanctuary}
            className="btn btn-q"
          >
            Open Sanctuary
          </button>
        </div>
      </div>
    </div>
  );
}

interface DailyLimitModalProps extends DailyLimitProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyLimitModal({
  open,
  onOpenChange,
  used = 5,
  total = 5,
  onSeePlans,
  onOpenSanctuary,
}: DailyLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-2xl">
        <div className="p-1">
          <DailyLimitCard
            used={used}
            total={total}
            onSeePlans={() => {
              onOpenChange(false);
              if (onSeePlans) onSeePlans();
            }}
            onOpenSanctuary={() => {
              onOpenChange(false);
              if (onOpenSanctuary) onOpenSanctuary();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
