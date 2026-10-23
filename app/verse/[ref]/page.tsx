import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { resolveScripturePassage } from "@/lib/bible/api-bible";

interface VersePageProps {
  params: {
    ref: string;
  };
}

export async function generateMetadata({
  params,
}: VersePageProps): Promise<Metadata> {
  const decodedRef = decodeURIComponent(params.ref).replace(/-/g, " ");
  return {
    title: `${decodedRef} — Bible Rhema AI`,
    description: `Read and reflect on ${decodedRef} with verified Scripture and biblical context on Bible Rhema AI.`,
  };
}

export default async function VerseSharePage({ params }: VersePageProps) {
  const rawRef = decodeURIComponent(params.ref).replace(/-/g, " ");
  const scripture = await resolveScripturePassage(rawRef, "KJV");

  const displayRef = scripture?.reference || rawRef;
  const translation = scripture?.translation || "KJV";
  const verseText =
    scripture?.text?.trim() ||
    "Thy word is a lamp unto my feet, and a light unto my path.";

  const words = verseText.split(/\s+/);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F8F9FA] flex flex-col justify-between selection:bg-[#D4AF37]/30 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-[rgba(243,229,171,0.1)] px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 relative">
            <Image
              src="/files/bible-rhema-ai-emblem.png"
              alt="Bible Rhema AI"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="serif text-lg font-semibold tracking-wide text-[#F3E5AB]">
            Bible Rhema AI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn btn-q !min-h-[38px] text-xs">
            Sign in
          </Link>
          <Link href="/sign-up" className="btn btn-p !min-h-[38px] text-xs">
            Start Free
          </Link>
        </div>
      </header>

      {/* Main Verse Unfurl Card */}
      <main className="max-w-2xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="card p-8 md:p-12 w-full flex flex-col items-center gap-6 shadow-2xl border-[rgba(243,229,171,0.18)]">
          <span className="eyebrow">Daily Rhema · Shared Scripture</span>

          {/* Kindle Verse Unfurl Animation */}
          <div className="py-4 max-w-lg">
            <blockquote className="serif italic text-2xl md:text-3xl leading-relaxed text-[#F8F9FA] m-0">
              {words.map((word, idx) => (
                <span
                  key={`${word}-${idx}`}
                  className="w"
                  style={{ "--i": idx } as React.CSSProperties}
                >
                  {word}{" "}
                </span>
              ))}
            </blockquote>

            <div className="ul w-24 mx-auto my-4" />

            <span className="eyebrow text-xs tracking-widest text-[#F3E5AB] block mt-2">
              {displayRef.toUpperCase()} · {translation}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[rgba(243,229,171,0.08)] w-full">
            <Link
              href={`/spirit-os?q=${encodeURIComponent(
                `Explain ${displayRef} in its biblical context`
              )}`}
              className="btn btn-p"
            >
              Reflect on this
            </Link>
            <Link href="/" className="btn btn-s">
              Explore Rhema
            </Link>
            <Link href="/sanctuary" className="btn btn-q">
              Enter Sanctuary
            </Link>
          </div>
        </div>

        {/* First Visit Trust Card */}
        <div className="mt-8 text-center max-w-md">
          <p className="dim text-xs leading-relaxed">
            Bible Rhema AI is an ad-free, Scripture-first sanctuary. Every verse is verified against canonical texts.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(243,229,171,0.08)] px-6 py-4 text-center dim text-xs">
        <p className="m-0">
          © {new Date().getFullYear()} Bible Rhema AI · Scripture first. Always.
        </p>
      </footer>
    </div>
  );
}
