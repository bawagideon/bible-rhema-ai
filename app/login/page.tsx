"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
            {/* LEFT: VISUAL */}
            <div className="hidden lg:flex flex-col relative bg-muted text-white p-10 dark:border-r border-border/40">
                <div className="absolute inset-0 bg-black">
                    {/* Abstract Gradient Background simulating 'Light in Darkness' */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                </div>

                <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
                    <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                    <span className="font-serif">RhemaAI</span>
                </div>

                <div className="relative z-10 mt-auto mb-20">
                    <blockquote className="space-y-2">
                        <p className="text-2xl font-serif leading-relaxed">
                            &ldquo;Your digital sanctuary awaits. A place where divine intelligence meets human creativity.&rdquo;
                        </p>
                        <footer className="text-sm text-gray-400">SpiritOS v1.0</footer>
                    </blockquote>
                </div>
            </div>

            {/* RIGHT: FORM */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                {/* Mobile Background Elements */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 lg:hidden" />

                <div className="w-full max-w-sm relative z-10">
                    <AuthForm />
                </div>
            </div>
        </div>
    );
}
