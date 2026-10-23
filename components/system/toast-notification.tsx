"use client";

import React from "react";

export interface ToastProps {
  type?: "success" | "error";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

export function SystemToast({
  type = "success",
  message,
  actionLabel,
  onAction,
}: ToastProps) {
  const isSuccess = type === "success";

  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] bg-[#17171A] text-[#F8F9FA] transition-all shadow-xl"
      style={{
        border: isSuccess
          ? "1px solid rgba(212,175,55,0.35)"
          : "1px solid rgba(240,160,160,0.40)",
      }}
    >
      {isSuccess ? (
        <span style={{ color: "#D4AF37" }} className="flex-none">
          <svg
            className="w-[18px] height-[18px] fill-none stroke-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5 9-11" />
          </svg>
        </span>
      ) : (
        <span style={{ color: "#F0A0A0" }} className="flex-none">
          <svg
            className="w-[18px] height-[18px] fill-none stroke-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l10 18H2zM12 10v5M12 18v.5" />
          </svg>
        </span>
      )}

      <span className="flex-1 text-[14px] leading-snug">{message}</span>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-q !min-h-[36px] !border-transparent !text-[#F3E5AB] !text-[13px] px-2.5 hover:!bg-[#F3E5AB]/10"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ToastSuccess({
  message = "Saved to Library",
  actionLabel = "Undo",
  onUndo,
}: {
  message?: string;
  actionLabel?: string;
  onUndo?: () => void;
}) {
  return (
    <SystemToast
      type="success"
      message={message}
      actionLabel={actionLabel}
      onAction={onUndo}
    />
  );
}

export function ToastError({
  message = "Could not save your note",
  actionLabel = "Retry",
  onRetry,
}: {
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <SystemToast
      type="error"
      message={message}
      actionLabel={actionLabel}
      onAction={onRetry}
    />
  );
}
