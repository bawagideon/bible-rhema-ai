"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            console.log("AuthContext: Checking session...");
            if (!supabase) {
                console.log("Supabase keys missing. Defaulting to logged out.");
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await handleUser(session.user);
                } else {
                    setUser(null);
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
                if (user?.id !== session.user.id) {
                    await handleUser(session.user);
                }
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, []);

    const handleUser = async (authUser: User) => {
        try {
            if (!supabase) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select('has_completed_onboarding')
                .eq('id', authUser.id)
                .single();

            setUser(authUser);

            if (profile) {
                setHasOnboarded(profile.has_completed_onboarding);
            } else {
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
        router.push('/login');
    };

    // Route Protection Effect (The Gatekeeper)
    useEffect(() => {
        if (loading) return;

        const isAuthGroup = pathname === '/login' || pathname === '/signup';
        const isOnboardingPage = pathname === '/onboarding';

        // 1. Not Logged In
        if (!user && !isAuthGroup) {
            router.push('/login');
            return;
        }

        // 2. Logged In
        if (user) {
            if (isAuthGroup) {
                router.push('/');
                return;
            }

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
    const isProtected = !isAuthGroup;
    const isOnboardingPage = pathname === '/onboarding';

    const shouldRedirectToLogin = !loading && !user && isProtected;
    const shouldRedirectToOnboarding = !loading && user && hasOnboarded === false && !isOnboardingPage;
    const shouldRedirectToHome = !loading && user && ((isAuthGroup) || (hasOnboarded === true && isOnboardingPage));

    const showLoader = loading || shouldRedirectToLogin || shouldRedirectToOnboarding || shouldRedirectToHome;

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
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
