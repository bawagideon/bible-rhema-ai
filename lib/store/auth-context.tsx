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
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
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
                    setUser(session.user);
                    setDemoMode(false);
                } else {
                    setUser(null);
                    setDemoMode(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for changes
        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                setUser(session.user);
                setDemoMode(false);
            } else {
                setUser(null);
                setDemoMode(false);
            }
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        setUser(null);
        setDemoMode(false);
        router.push('/login');
    };

    const signInWithDemo = () => {
        setUser(DEMO_USER);
        setDemoMode(true);
        router.push('/');
    };

    // Route Protection Effect
    useEffect(() => {
        if (loading) return;

        const isAuthGroup = pathname === '/login';

        // NOTE: If Demo Mode is active, 'user' is SET, so we pass this check.
        // To test the Login Page, you must manually set demoMode to false/null or logout.
        if (!user && !isAuthGroup) {
            router.push('/login');
        }

        if (user && isAuthGroup) {
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading, demoMode, signOut, signInWithDemo }}>
            {children}
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
