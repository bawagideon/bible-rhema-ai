"use client";

import React from "react";
import Link from "next/link";

interface EmptyFirstVisitProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyFirstVisit({
  title = "Your library is waiting",
  description = "Save a study, write a note or add a prayer and it will appear here.",
  actionText = "Start your first study",
  actionHref = "/spirit-os",
  onAction,
}: EmptyFirstVisitProps) {
  return (
    <div className="card p-6 flex flex-col gap-3.5 items-center justify-center text-center my-4">
      <div className="flex flex-col items-center text-center gap-3 py-3 max-w-sm">
        <span style={{ color: "#D4AF37" }}>
          <svg
            className="w-8 h-8 fill-none stroke-current"
            viewBox="0 0 24 24"
            aria-hidden="true"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </span>
        <h3 className="serif text-[22px] font-semibold text-[#F8F9FA] tracking-tight m-0">
          {title}
        </h3>
        <p className="muted text-[14px] leading-[1.6] max-w-[300px] m-0">
          {description}
        </p>
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              onClick={onAction}
              className="btn btn-p shadow-md hover:brightness-105"
            >
              {actionText}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="btn btn-p shadow-md hover:brightness-105"
            >
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
