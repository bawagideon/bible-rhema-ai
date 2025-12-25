"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    demoMode: boolean; // True if using the fallback demo user
    signOut: () => Promise<void>;
    signInWithDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define a static Demo User for development
const DEMO_USER = {
    id: 'demo-user-id',
    email: 'minister@rhema.ai',
    user_metadata: {
        full_name: 'Minister David',
        tier: 'MINISTER'
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [demoMode, setDemoMode] = useState(false);
    const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            console.log("AuthContext: Checking session...");
            if (!supabase) {
                console.log("Supabase keys missing. Defaulting to logged out (Simulated Env).");
                setUser(null); // Wait for manual login
                setDemoMode(false);
                setLoading(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await handleUser(session.user);
                } else {
                    setUser(null);
                    setDemoMode(false);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setUser(null);
                setLoading(false);
            }
        };

        checkSession();

        // Safety Timeout: Force loading to false if session check hangs (e.g., network issues)
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn("Auth check timed out. Forcing app load.");
                setLoading(false);
            }
        }, 5000); // 5 seconds max

        // Listen for changes
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                // Determine if this is a fresh login or just a refresh
                if (user?.id !== session.user.id) {
                    await handleUser(session.user);
                }
            } else {
                setUser(null);
                setDemoMode(false);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    const handleUser = async (authUser: User) => {
        // Fetch Profile for Onboarding Status
        try {
            if (!supabase) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', authUser.id)
                .single();

            // Attach custom metadata to user object for easy access if needed (or just rely on router)
            // But we need to update state to trigger re-renders if using context.
            // For now, simpler: check redirect here or save state?
            // Creating a derived user or side-effect redirect is better.

            setUser(authUser);
            setDemoMode(false);

            // Gatekeeper Logic
            const isOnboarding = profile?.has_completed_onboarding;
            const currentPath = window.location.pathname; // using window as fallback or just rely on router push in effect?
            // We can't safely use router inside this async function if it runs on valid auth change?
            // Actually better to store 'hasOnboarded' in state or user metadata.

            // Let's store it in a React Ref or State if we want to be clean, 
            // but the request asks for immediate redirect logic.
            // The existing "Route Protection Effect" below (lines 103-117) handles the redirect based on 'user'.
            // I should update that effect to handle the onboarding check.

            // So:
            // 1. Fetch profile status.
            // 2. Extend 'user' object or context to include this status?
            // The User type is from Supabase... 
            // I'll add a separate state `hasOnboarded`.

            if (profile) {
                setHasOnboarded(profile.has_completed_onboarding);
            } else {
                // Profile missing (e.g. deleted manually). Treat as not onboarded.
                console.warn("User exists but profile is missing. Enforcing onboarding.");
                setHasOnboarded(false);
            }

        } catch (e) {
            console.error("Profile fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setHasOnboarded(false);
        setDemoMode(false);
        router.push('/login');
    };

    const signInWithDemo = () => {
        setUser(DEMO_USER);
        setHasOnboarded(true); // Demo user is always onboarded
        setDemoMode(true);
        router.push('/');
    };

    // Route Protection Effect (The Gatekeeper)
    useEffect(() => {
        if (loading) return;

        const isAuthGroup = pathname === '/login' || pathname === '/signup'; // Assuming signup exists or just login
        const isOnboardingPage = pathname === '/onboarding';

        // 1. Not Logged In
        if (!user && !isAuthGroup) {
            router.push('/login');
            return;
        }

        // 2. Logged In
        if (user) {
            if (isAuthGroup) {
                // If logged in, kick out of login page
                router.push('/');
                return;
            }

            // 3. Onboarding Check
            if (hasOnboarded === false && !isOnboardingPage) {
                router.push('/onboarding');
                return;
            }

            if (hasOnboarded === true && isOnboardingPage) {
                router.push('/');
                return;
            }
        }

    }, [user, loading, pathname, router, hasOnboarded]);

    // Derived state for Render Guard
    const isAuthGroup = pathname === '/login' || pathname === '/signup';
    const isProtected = !isAuthGroup; // Pages that require auth
    const isOnboardingPage = pathname === '/onboarding';

    // Determine if we are in a "Redirecting" state
    // This blocks the UI even if loading=false, ensuring no flash of content before router.push takes effect
    const shouldRedirectToLogin = !loading && !user && isProtected;
    const shouldRedirectToOnboarding = !loading && user && hasOnboarded === false && !isOnboardingPage;
    const shouldRedirectToHome = !loading && user && ((isAuthGroup) || (hasOnboarded === true && isOnboardingPage));

    // If any redirect is pending, we show the loader
    const showLoader = loading || shouldRedirectToLogin || shouldRedirectToOnboarding || shouldRedirectToHome;

    return (
        <AuthContext.Provider value={{ user, loading, demoMode, signOut, signInWithDemo }}>
            {showLoader ? (
                <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
                    <div className="flex flex-col items-center animate-pulse">
                        <span className="text-2xl font-serif font-bold tracking-widest uppercase mb-2">
                            Rhema<span className="text-primary">AI</span>
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Divine Intelligence</span>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
