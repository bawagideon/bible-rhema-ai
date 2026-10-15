"use client";

import { Check, Shield, Zap, CornerDownLeft, Sparkles, ArrowRight, CreditCard, Loader2, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useRhema } from "@/lib/store/rhema-context";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CheckoutState = 'idle' | 'verifying' | 'success' | 'failed' | 'already_subscribed';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
    const [errorMessage, setErrorMessage] = useState("");
    const [upgradedTier, setUpgradedTier] = useState<string>("MINISTER");

    const router = useRouter();
    const searchParams = useSearchParams();
    const { userTier, refreshProfile } = useRhema();

    // Verify Paystack payment if redirected back with a reference or query state
    useEffect(() => {
        const reference = searchParams?.get('reference') || searchParams?.get('trxref');
        const stateParam = searchParams?.get('state');

        if (stateParam === 'verifying' || stateParam === 'success' || stateParam === 'failed' || stateParam === 'already') {
            if (stateParam === 'already') setCheckoutState('already_subscribed');
            else setCheckoutState(stateParam as CheckoutState);
            return;
        }

        if (reference && checkoutState === 'idle') {
            verifyPayment(reference);
        }
    }, [searchParams]);

    const verifyPayment = async (ref: string) => {
        setCheckoutState('verifying');
        try {
            const res = await fetch("/api/billing/paystack/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reference: ref })
            });

            const data = await res.json();
            if (data.success) {
                await refreshProfile();
                setUpgradedTier(data.tier || 'MINISTER');
                setCheckoutState('success');
                toast.success(`Hallelujah! You have been upgraded to ${data.tier}!`);
            } else {
                setErrorMessage(data.error || "Payment verification could not be completed.");
                setCheckoutState('failed');
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            setErrorMessage("Failed to connect to billing verification endpoint. Please try again.");
            setCheckoutState('failed');
        }
    };

    const handlePaystackCheckout = async (targetTier: 'DISCIPLE' | 'MINISTER') => {
        if (userTier === 'MINISTER') {
            setCheckoutState('already_subscribed');
            return;
        }

        if (userTier === targetTier) {
            toast.info(`You are already subscribed to the ${targetTier} plan.`);
            return;
        }

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
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500 shrink-0" /> Basic SpiritOS Inquiries (5/day)</li>
                                <li className="flex gap-2 text-gray-500"><span className="line-through">Sermon Studio & Preach Mode</span></li>
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
                                    disabled={loadingTier === 'DISCIPLE'}
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
                            <Sparkles className="w-3 h-3" /> Most Recommended for Pastors
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[#D4AF37]">Minister</h3>
                                {userTier === 'MINISTER' && (
                                    <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 text-xs">Current Plan</Badge>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm">Full Preaching & Pulpit Suite</p>
                            <div>
                                <div className="text-3xl font-bold text-[#D4AF37]">{prices.MINISTER.naira} <span className="text-sm font-normal text-gray-400">{period}</span></div>
                                <div className="text-xs text-gray-500 mt-1">Approx. {prices.MINISTER.usd} {period}</div>
                            </div>

                            <ul className="space-y-3 text-sm text-gray-200 pt-4 border-t border-gray-800">
                                <li className="flex gap-2"><Zap className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>All Disciple Features</strong></li>
                                <li className="flex gap-2"><Zap className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Sermon Studio Workspace</strong></li>
                                <li className="flex gap-2"><Shield className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Verified Scripture (Fetched from Text)</strong></li>
                                <li className="flex gap-2"><Sparkles className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Faithfulness Check (Verified References)</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Preach Mode (Auto-scroll Teleprompter)</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37] shrink-0" /> <strong>Sunday Countdown & Speaking Time (130 wpm)</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37] shrink-0" /> High-Resolution PDF Manuscript Export</li>
                            </ul>
                        </div>

                        <div className="space-y-3 pt-6">
                            {userTier === 'MINISTER' ? (
                                <Button
                                    onClick={() => setCheckoutState('already_subscribed')}
                                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold flex items-center justify-center gap-2 py-6"
                                >
                                    Manage Minister Plan <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handlePaystackCheckout('MINISTER')}
                                    disabled={loadingTier === 'MINISTER'}
                                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold flex items-center justify-center gap-2 py-6 shadow-lg shadow-[#D4AF37]/20"
                                >
                                    {loadingTier === 'MINISTER' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" /> Subscribe for ₦15,000 / mo
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

            {/* SCREEN 10 CHECKOUT STATE MODAL 1: VERIFYING */}
            <Dialog open={checkoutState === 'verifying'} onOpenChange={() => {}}>
                <DialogContent className="bg-[#141416] border-gray-800 text-white sm:max-w-md text-center p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Verifying your payment
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-400">
                            Connecting to Paystack and kingdom servers to confirm your transaction. Please do not close or refresh this tab.
                        </DialogDescription>
                        <div className="text-xs text-[#D4AF37] font-mono pt-2">
                            Checking cryptographic signatures & idempotent ledger...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SCREEN 10 CHECKOUT STATE MODAL 2: SUCCESS / WELCOME TO MINISTER */}
            <Dialog open={checkoutState === 'success'} onOpenChange={(open) => { if (!open) setCheckoutState('idle'); }}>
                <DialogContent className="bg-[#141416] border-[#D4AF37]/50 text-white sm:max-w-md text-center p-8 shadow-2xl shadow-[#D4AF37]/15">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Welcome to Minister
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-300">
                            Your payment was confirmed. Your pulpit preparation workspace is now fully unlocked.
                        </DialogDescription>

                        <div className="w-full bg-[#181818] rounded-xl p-4 border border-gray-800 text-left text-xs space-y-2 text-gray-300">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Verified Scripture in manuscripts (fetched directly from text)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Faithfulness check (verifies references exist)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Preach mode teleprompter with auto-scroll & timer</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <span>Sunday countdown & speaking time calculator</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => router.push('/studio')}
                            className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold py-5 text-sm flex items-center justify-center gap-2"
                        >
                            Go to Sermon Studio
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SCREEN 10 CHECKOUT STATE MODAL 3: PAYMENT DID NOT COMPLETE */}
            <Dialog open={checkoutState === 'failed'} onOpenChange={(open) => { if (!open) setCheckoutState('idle'); }}>
                <DialogContent className="bg-[#141416] border-rose-500/50 text-white sm:max-w-md text-center p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Payment did not complete
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-400">
                            {errorMessage || "The transaction was cancelled or could not be verified by Paystack."}
                        </DialogDescription>

                        <div className="w-full space-y-2 pt-2">
                            <Button
                                onClick={() => {
                                    setCheckoutState('idle');
                                    handlePaystackCheckout('MINISTER');
                                }}
                                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold text-sm py-5"
                            >
                                Try again with Paystack
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => window.open('https://wa.me/2348000000000?text=Hello%20Rhema%20Support,%20I%20had%20an%20issue%20with%20my%20payment', '_blank')}
                                className="w-full border-gray-800 text-gray-300 hover:text-white text-xs gap-2"
                            >
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                Contact support on WhatsApp
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SCREEN 10 CHECKOUT STATE MODAL 4: ALREADY ON MINISTER */}
            <Dialog open={checkoutState === 'already_subscribed'} onOpenChange={(open) => { if (!open) setCheckoutState('idle'); }}>
                <DialogContent className="bg-[#141416] border-[#D4AF37]/40 text-white sm:max-w-md text-center p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <DialogTitle className="font-serif text-2xl text-white">
                            You are already on Minister
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-400">
                            Your Minister membership is active (₦15,000 / month). Your next renewal date is in 24 days.
                        </DialogDescription>

                        <div className="w-full bg-[#181818] p-4 rounded-xl border border-gray-800 text-left text-xs space-y-2 text-gray-300">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Status</span>
                                <span className="text-emerald-400 font-semibold">Active & Verified</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Plan</span>
                                <span className="text-[#D4AF37] font-semibold">Minister Pro Workspace</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400">Preach Mode</span>
                                <span className="text-white">Enabled</span>
                            </div>
                        </div>

                        <div className="w-full space-y-2 pt-2">
                            <Button
                                onClick={() => router.push('/studio')}
                                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold py-5 text-sm flex items-center justify-center gap-2"
                            >
                                Open Sermon Studio
                                <ArrowRight className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={() => setCheckoutState('idle')}
                                className="w-full text-xs text-gray-400 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
