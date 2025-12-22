"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/store/auth-context";

export function AuthForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { signInWithDemo } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // If Demo Mode (no supabase keys), mock it
        if (!supabase) {
            // Mock delay then manual demo login
            setTimeout(() => {
                signInWithDemo();
            }, 1000);
            return;
        }

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
                <h1 className="font-serif text-3xl font-medium tracking-tight">
                    {isSignUp ? "Join the Fold" : "Welcome Back"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access the sanctuary.
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="disciple@rhema.ai"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-muted/50 border-border/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-muted/50 border-border/50"
                    />
                </div>

                {error && (
                    <div className="text-xs text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-semibold h-11"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignUp ? "Create Account" : "Enter Sanctuary")}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full" type="button" disabled>
                    Google
                </Button>
                <Button variant="outline" className="w-full" type="button" disabled>
                    Apple
                </Button>
            </div>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                </span>
                <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline font-medium"
                >
                    {isSignUp ? "Sign In" : "Sign Up"}
                </button>
            </div>
        </div>
    );
}
