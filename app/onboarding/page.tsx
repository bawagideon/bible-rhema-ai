import { SpiritualCalibrationForm } from "@/components/onboarding/spiritual-calibration-form";

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-gray-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-10">
                    <p className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase mb-2">Bible Rhema AI</p>
                    <h1 className="text-3xl font-serif font-bold text-white">Spiritual Calibration</h1>
                </div>

                <SpiritualCalibrationForm />
            </div>
        </div>
    );
}
