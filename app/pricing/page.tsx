"use client";

import { Check, Shield, Zap, CornerDownLeft, Sparkles, ArrowRight, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useRhema } from "@/lib/store/rhema-context";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { userTier, refreshProfile } = useRhema();

    // Verify Paystack payment if redirected back with a reference
    useEffect(() => {
        const reference = searchParams?.get('reference') || searchParams?.get('trxref');
        if (reference && !isVerifying) {
            verifyPayment(reference);
        }
    }, [searchParams]);

    const verifyPayment = async (ref: string) => {
        setIsVerifying(true);
        toast.info("Verifying your Paystack payment with kingdom servers...");
        try {
            const res = await fetch("/api/billing/paystack/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference: ref })
            });

            const data = await res.json();
            if (data.success) {
                await refreshProfile();
                toast.success(`Hallelujah! You have been upgraded to ${data.tier}!`);
                setTimeout(() => {
                    router.push(data.tier === 'MINISTER' ? '/studio' : '/spirit-os');
                }, 1500);
            } else {
                toast.error(data.error || "Payment verification could not be completed.");
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            toast.error("Failed to connect to billing verification endpoint.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePaystackCheckout = async (targetTier: 'DISCIPLE' | 'MINISTER') => {
        setLoadingTier(targetTier);
        toast.info(`Preparing secure Paystack checkout for ${targetTier}...`);

        try {
            const res = await fetch("/api/billing/paystack/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tier: targetTier,
                    cycle: billingCycle
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error || "Could not initialize Paystack checkout.");
                setLoadingTier(null);
                return;
            }

            // Redirect user to Paystack's secure checkout page
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            } else {
                toast.error("Invalid payment authorization URL received.");
                setLoadingTier(null);
            }
        } catch (error: any) {
            console.error("Checkout initialization error:", error);
            toast.error("Failed to connect to Paystack billing server.");
            setLoadingTier(null);
        }
    };

    const prices = {
        DISCIPLE: {
            naira: billingCycle === 'monthly' ? "₦5,000" : "₦50,000",
            usd: billingCycle === 'monthly' ? "$4.99" : "$49.99"
        },
        MINISTER: {
            naira: billingCycle === 'monthly' ? "₦15,000" : "₦150,000",
            usd: billingCycle === 'monthly' ? "$12.99" : "$129.99"
        }
    };

    const period = billingCycle === 'monthly' ? "/month" : "/year";

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-12 px-4 font-sans relative">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-2.5 rounded-full bg-gray-800/60 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700/50"
                title="Go Back"
            >
                <CornerDownLeft className="h-5 w-5" />
            </button>

            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] px-3 py-1 text-xs">
                        Kingdom Stewardship • Paystack Secured
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif">
                        Empower Your <span className="text-[#D4AF37]">Spiritual Journey</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
                        Choose the tier tailored to your study, devotion, and preaching ministry needs.
                        Supports Nigerian bank transfers, USSD, debit cards, and Apple Pay.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center justify-center mt-8 gap-4">
                        <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-gray-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="bg-gray-800 w-14 h-7 rounded-full p-1 relative transition-colors duration-200"
                            aria-label="Toggle billing cycle"
                        >
                            <div className={`bg-[#D4AF37] w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
                        </button>
                        <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white font-medium' : 'text-gray-500'}`}>
                            Yearly <span className="text-[#D4AF37] text-xs ml-1 font-semibold">(Save ~17%)</span>
                        </span>
                    </div>
                </div>

                {/* Verification Banner */}
                {isVerifying && (
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/40 rounded-xl p-4 text-center flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                        <span className="text-sm text-[#D4AF37] font-medium">Confirming Paystack payment transaction...</span>
                    </div>
                )}

                {/* Cards Container */}
                <div className="grid md:grid-cols-3 gap-8 items-stretch relative">

                    {/* Seeker (Free) */}
                    <div className="bg-[#121212] border border-gray-800 rounded-2xl p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">Seeker</h3>
                                {userTier === 'SEEKER' && (
                                    <Badge className="bg-gray-800 text-gray-300 text-xs">Current Plan</Badge>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Personal Devotion & Meditation</p>
                            <div className="text-3xl font-bold">₦0 <span className="text-lg font-normal text-gray-500">/forever</span></div>

                            <ul className="space-y-3 text-sm text-gray-300 pt-4 border-t border-gray-800">
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500 shrink-0" /> Daily Rhema Scripture</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500 shrink-0" /> The Altar (Prayer Tracking)</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500 shrink-0" /> Sanctuary Audio Soundscapes</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500 shrink-0" /> Basic SpiritOS Inquiries</li>
                            </ul>
                        </div>

                        <div className="pt-6">
                            <Button
                                variant="outline"
                                disabled
                                className="w-full border-gray-700 text-gray-300 bg-gray-900/50 cursor-default"
                            >
                                {userTier === 'SEEKER' ? 'Current Plan' : 'Free Baseline'}
                            </Button>
                        </div>
                    </div>

                    {/* Disciple */}
                    <div className="bg-[#141416] border border-gray-700 hover:border-gray-500 rounded-2xl p-8 flex flex-col justify-between space-y-6 transition-colors">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">Disciple</h3>
                                {userTier === 'DISCIPLE' && (
                                    <Badge className="bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs">Current Plan</Badge>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Deep Expository Bible Study</p>
                            <div>
                                <div className="text-3xl font-bold text-white">{prices.DISCIPLE.naira} <span className="text-sm font-normal text-gray-400">{period}</span></div>
                                <div className="text-xs text-gray-500 mt-1">Approx. {prices.DISCIPLE.usd} {period}</div>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-300 pt-4 border-t border-gray-800">
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400 shrink-0" /> <strong>All Seeker Features</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400 shrink-0" /> Full SpiritOS Exegesis Mode</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400 shrink-0" /> Greek & Hebrew Word Studies</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400 shrink-0" /> Unlimited Prayer Wall & Journal</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400 shrink-0" /> Nehemiah Focus Mode & Streaks</li>
                            </ul>
                        </div>

                        <div className="space-y-3 pt-6">
                            {userTier === 'DISCIPLE' ? (
                                <Button variant="outline" disabled className="w-full border-blue-500/40 text-blue-400">
                                    Active Plan
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handlePaystackCheckout('DISCIPLE')}
                                    disabled={loadingTier === 'DISCIPLE' || isVerifying}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center justify-center gap-2 py-6"
                                >
                                    {loadingTier === 'DISCIPLE' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" /> Subscribe with Paystack
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Minister (Gold) */}
                    <div className="bg-[#1c1c1c] border-2 border-[#D4AF37] rounded-2xl p-8 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-[#D4AF37]/10 transform md:-translate-y-2">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-3 h-3" /> Most Recommended
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[#D4AF37]">Minister</h3>
                                {userTier === 'MINISTER' && (
                                    <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 text-xs">Current Plan</Badge>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Full Preaching & Ministry Studio</p>
                            <div>
                                <div className="text-3xl font-bold text-[#D4AF37]">{prices.MINISTER.naira} <span className="text-sm font-normal text-gray-400">{period}</span></div>
                                <div className="text-xs text-gray-500 mt-1">Approx. {prices.MINISTER.usd} {period}</div>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-200 pt-4 border-t border-gray-800">
                                <li className="flex gap-2"><Zap className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>All Disciple Features</strong></li>
                                <li className="flex gap-2"><Zap className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Sermon Studio Pro Workspace</strong></li>
                                <li className="flex gap-2"><Sparkles className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>AI Homiletics Outline Generator</strong></li>
                                <li className="flex gap-2"><Shield className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>High-Resolution PDF Manuscript Export</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37] shrink-0" /> Context Engine & Custom Research Vault</li>
                            </ul>
                        </div>

                        <div className="space-y-3 pt-6">
                            {userTier === 'MINISTER' ? (
                                <Button
                                    onClick={() => router.push('/studio')}
                                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold flex items-center justify-center gap-2 py-6"
                                >
                                    Open Sermon Studio <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handlePaystackCheckout('MINISTER')}
                                    disabled={loadingTier === 'MINISTER' || isVerifying}
                                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold flex items-center justify-center gap-2 py-6 shadow-lg shadow-[#D4AF37]/20"
                                >
                                    {loadingTier === 'MINISTER' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" /> Subscribe with Paystack
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                </div>

                <p className="text-center text-xs text-gray-500">
                    Secure 256-bit SSL encrypted billing powered by Paystack. Supports Nigerian bank cards, transfers, and USSD. Cancel anytime with one click.
                </p>
            </div>
        </div>
    );
}
