"use client";

interface SystemErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
}

export function SystemErrorState({
    title = "We could not load your library",
    description = "Your saved items are safe. Check your connection and try again.",
    onRetry,
    retryLabel = "Try again",
    className = ""
}: SystemErrorStateProps) {
    return (
        <div className={`card p-6 flex flex-col gap-3.5 ${className}`}>
            <div className="flex flex-col gap-3 items-start">
                <span className="text-[#F3E5AB]">
                    <svg className="w-[26px] h-[26px] fill-none stroke-currentColor stroke-[1.6] stroke-linecap-round stroke-linejoin-round" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3l10 18H2zM12 10v5M12 18v.5" />
                    </svg>
                </span>
                <h3 className="serif text-[22px] font-semibold text-white tracking-tight leading-snug">
                    {title}
                </h3>
                <p className="muted text-sm leading-relaxed max-w-lg">
                    {description}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn btn-s mt-1"
                    >
                        {retryLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
