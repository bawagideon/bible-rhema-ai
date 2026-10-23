"use client";

interface HomeLoadingSkeletonProps {
    className?: string;
}

export function HomeLoadingSkeleton({ className = "" }: HomeLoadingSkeletonProps) {
    return (
        <div className={`card p-6 flex flex-col gap-3.5 ${className}`}>
            <div className="flex flex-col gap-3.5">
                <span className="skel h-3.5 w-[36%]" />
                <span className="skel h-7.5 w-[62%]" />
                <div className="skel h-[130px] rounded-2xl" />
                <div className="flex gap-3">
                    <div className="skel flex-1 h-[84px] rounded-[14px]" />
                    <div className="skel flex-1 h-[84px] rounded-[14px]" />
                    <div className="skel flex-1 h-[84px] rounded-[14px]" />
                </div>
            </div>
        </div>
    );
}
