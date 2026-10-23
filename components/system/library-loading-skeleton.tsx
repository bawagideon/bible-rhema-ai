"use client";

interface LibraryLoadingSkeletonProps {
    className?: string;
    rows?: number;
}

export function LibraryLoadingSkeleton({ className = "", rows = 3 }: LibraryLoadingSkeletonProps) {
    return (
        <div className={`card p-6 flex flex-col gap-3.5 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-3.5 items-center">
                    <span className="skel w-11 h-11 rounded-xl flex-none" />
                    <span className="flex-1 flex flex-col gap-2">
                        <span className="skel h-3.5 w-[48%]" />
                        <span className="skel h-3 w-[86%]" />
                    </span>
                </div>
            ))}
        </div>
    );
}
