"use client";

import { Check, Shield, Zap, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// MOCK PLAN IDs - Replace with real ones from PayPal Developer Dashboard
const PLAN_IDS = {
    DISCIPLE: {
        MONTHLY: "P-MOCK-DISCIPLE-M",
        YEARLY: "P-MOCK-DISCIPLE-Y"
    },
    MINISTER: {
        MONTHLY: "P-MOCK-MINISTER-M",
        YEARLY: "P-MOCK-MINISTER-Y"
    }
};

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const router = useRouter();

    const prices = {
        DISCIPLE: billingCycle === 'monthly' ? "4.99" : "49.99",
        MINISTER: billingCycle === 'monthly' ? "12.99" : "129.99"
    };

    const period = billingCycle === 'monthly' ? "/mo" : "/yr";

    const handleApprove = (data: any, actions: any) => {
        // This function captures the transaction
        return actions.subscription.get().then((details: any) => {
            // 1. Call your backend API to update the user's profile with subscription ID
            console.log("Subscription successful:", details);
            toast.success("Welcome to the Kingdom Builder plan!");
            router.push('/studio');
        });
    };

    const handleMockCheckout = () => {
        toast.promise(new Promise(r => setTimeout(r, 1500)), {
            loading: 'Processing mock payment...',
            success: 'Welcome to the Kingdom Builder plan! (Dev Mode)',
            error: 'Payment failed'
        });
        setTimeout(() => router.push('/studio'), 1500);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white py-10 px-4 font-sans relative">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="absolute top-8 left-8 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Go Back"
            >
                <CornerDownLeft className="h-6 w-6" />
            </button>

            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif">
                        Invest in Your <span className="text-[#D4AF37]">Ministry</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Choose the toolkit that empowers your revelation.
                        Start with a 7-day free trial on paid plans.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center mt-8 gap-4">
                        <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white font-medium' : 'text-gray-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="bg-gray-800 w-14 h-7 rounded-full p-1 relative transition-colors duration-200"
                        >
                            <div className={`bg-[#D4AF37] w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
                        </button>
                        <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white font-medium' : 'text-gray-500'}`}>
                            Yearly <span className="text-[#D4AF37] text-xs ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                {/* Cards Container */}
                <PayPalScriptProvider options={{ clientId: "test", vault: true, intent: "subscription" }}>
                    <div className="grid md:grid-cols-3 gap-8 items-start relative">

                        {/* Seeker (Free) */}
                        <div className="bg-[#121212] border border-gray-800 rounded-2xl p-8 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold">Seeker</h3>
                                <p className="text-gray-400 text-sm mt-1">Daily Word & Meditation</p>
                            </div>
                            <div className="text-3xl font-bold">$0 <span className="text-lg font-normal text-gray-500">/mo</span></div>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500" /> Daily Devotional</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500" /> Public Sermons</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-gray-500" /> Community Access</li>
                            </ul>
                            <div className="h-12 flex items-end">
                                <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Current Plan</Button>
                            </div>
                        </div>

                        {/* Disciple */}
                        <div className="bg-[#121212] border border-gray-700 rounded-2xl p-8 space-y-6 relative hover:border-gray-500 transition-colors">
                            <div>
                                <h3 className="text-xl font-bold">Disciple</h3>
                                <p className="text-gray-400 text-sm mt-1">Growing Faith</p>
                            </div>
                            <div className="text-3xl font-bold">${prices.DISCIPLE} <span className="text-lg font-normal text-gray-500">{period}</span></div>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400" /> Unlimited Chat</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400" /> Personal Journal</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-blue-400" /> Scripture Search</li>
                            </ul>
                            <div className="h-12 w-full space-y-2">
                                <div className="min-h-[40px] relative z-0">
                                    <PayPalButtons
                                        key={`disciple-${billingCycle}`}
                                        style={{ shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe', height: 40 }}
                                        createSubscription={(data, actions) => {
                                            return actions.subscription.create({
                                                'plan_id': billingCycle === 'monthly' ? PLAN_IDS.DISCIPLE.MONTHLY : PLAN_IDS.DISCIPLE.YEARLY
                                            });
                                        }}
                                        onApprove={handleApprove}
                                        onError={(err) => console.error("PayPal Error:", err)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Minister (Gold) */}
                        <div className="bg-[#1c1c1c] border-2 border-[#D4AF37] rounded-2xl p-8 space-y-6 relative shadow-2xl shadow-[#D4AF37]/10 transform scale-105 z-10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                Most Popular
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#D4AF37]">Minister</h3>
                                <p className="text-gray-400 text-sm mt-1">Kingdom Builder</p>
                            </div>
                            <div className="text-3xl font-bold">${prices.MINISTER} <span className="text-lg font-normal text-gray-500">{period}</span></div>
                            <ul className="space-y-3 text-sm text-gray-200 font-medium">
                                <li className="flex gap-2"><Zap className="h-5 w-5 text-[#D4AF37]" /> <strong>Sermon Studio & AI</strong></li>
                                <li className="flex gap-2"><Shield className="h-5 w-5 text-[#D4AF37]" /> <strong>PDF Export</strong></li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37]" /> Context Engine (Unlimited)</li>
                                <li className="flex gap-2"><Check className="h-5 w-5 text-[#D4AF37]" /> Priority Support</li>
                            </ul>
                            <div className="w-full space-y-3">
                                <div className="min-h-[40px] relative z-0">
                                    <PayPalButtons
                                        key={`minister-${billingCycle}`} // Force re-render on cycle change
                                        style={{ shape: 'rect', color: 'gold', layout: 'vertical', label: 'subscribe', height: 40 }}
                                        createSubscription={(data, actions) => {
                                            return actions.subscription.create({
                                                'plan_id': billingCycle === 'monthly' ? PLAN_IDS.MINISTER.MONTHLY : PLAN_IDS.MINISTER.YEARLY
                                            });
                                        }}
                                        onApprove={handleApprove}
                                        onError={(err) => {
                                            console.error("PayPal Error (Minister):", err);
                                            toast.error("PayPal sandbox error. Try the Mock Checkout below.");
                                        }}
                                    />
                                </div>
                                {/* Fallback Mock Button for Development */}
                                <button
                                    onClick={handleMockCheckout}
                                    className="text-xs text-gray-500 hover:text-[#D4AF37] underline w-full text-center transition-colors"
                                >
                                    (Dev) Mock Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </PayPalScriptProvider>

                <p className="text-center text-xs text-gray-500">
                    Secure payments via PayPal. 7-day money-back guarantee. Cancel anytime.
                </p>
            </div>
        </div>
    );
}
