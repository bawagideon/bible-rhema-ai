"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemType?: "study" | "note" | "prayer" | "sermon" | "item" | "journal";
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemType = "study",
  itemName = "What does it mean to abide in Christ?",
  onConfirm,
  loading = false,
}: ConfirmDeleteDialogProps) {
  const heading = title || `Delete this ${itemType}?`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-2xl">
        <div
          role="alertdialog"
          aria-label={heading}
          className="flex flex-col gap-3.5 p-[22px] rounded-[18px] bg-[#17171A] border border-[rgba(243,229,171,0.18)] text-[#F8F9FA]"
        >
          <span className="serif text-[20px] font-semibold text-[#F8F9FA]">
            {heading}
          </span>
          <span className="muted text-[14px] leading-[1.6]">
            &ldquo;{itemName}&rdquo; will be removed from your Library. This cannot be undone.
          </span>
          <div className="flex gap-2.5 justify-end pt-1">
            <button
              type="button"
              className="btn btn-q"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn text-white font-bold"
              style={{ background: "#C45A5A" }}
              onClick={async () => {
                await onConfirm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
