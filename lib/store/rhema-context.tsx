"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { SermonData } from '@/components/studio/sermon-builder';
import { useUser, useAuth } from '@clerk/nextjs';
import { createClerkSupabaseClient } from '@/lib/supabaseClient';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface RhemaContextType {
    userRole: UserRole;
    userTier: UserRole;
    userName: string;
    userAvatar: string;
    toggleRole: () => void;
    isRightPanelOpen: boolean;
    toggleRightPanel: () => void;
    sermonToLoad: SermonData | null;
    setSermonToLoad: (sermon: SermonData | null) => void;
    pdfExportTimestamp: number | null;
    triggerPdfExport: () => void;
    lastSavedTimestamp: number | null;
    triggerSaveComplete: () => void;
}

const RhemaContext = createContext<RhemaContextType | undefined>(undefined);

export function RhemaProvider({ children }: { children: ReactNode }) {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const [userRole, setUserRole] = useState<UserRole>('SEEKER');
    const [userTier, setUserTier] = useState<UserRole>('SEEKER');
    const [userName, setUserName] = useState<string>("Believer");
    const [userAvatar, setUserAvatar] = useState<string>("");
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); // Default to open
    const [sermonToLoad, setSermonToLoad] = useState<SermonData | null>(null);
    const [pdfExportTimestamp, setPdfExportTimestamp] = useState<number | null>(null);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);

    // Loading State
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Fetch Tier on Mount (Auth-aware)
    useEffect(() => {
        const fetchTier = async () => {
            if (!isLoaded) return; // Wait for Clerk

            if (!user) {
                setIsLoadingProfile(false); // Guest / Not logged in
                return;
            }

            try {
                const token = await getToken({ template: 'supabase' });
                if (!token) {
                    setIsLoadingProfile(false);
                    return;
                }
                const supabase = createClerkSupabaseClient(token);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tier, full_name, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.tier) {
                        setUserRole(profile.tier as UserRole);
                        setUserTier(profile.tier as UserRole);
                    }
                    if (profile.full_name) setUserName(profile.full_name);
                    if (profile.avatar_url) setUserAvatar(profile.avatar_url);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchTier();
    }, [user, isLoaded, getToken]);

    const toggleRole = () => {
        setUserRole(prev => {
            if (prev === 'MINISTER') return 'DISCIPLE';
            if (prev === 'DISCIPLE') return 'SEEKER';
            return 'MINISTER';
        });
    };

    const toggleRightPanel = () => setIsRightPanelOpen(prev => !prev);
    const triggerPdfExport = () => setPdfExportTimestamp(Date.now());
    const triggerSaveComplete = () => setLastSavedTimestamp(Date.now());

    // Show Loader for Initial Auth/Profile Fetch
    if (!isLoaded || (user && isLoadingProfile)) {
        return <LoadingScreen />;
    }

    return (
        <RhemaContext.Provider value={{
            userRole,
            userTier,
            userName,
            userAvatar,
            toggleRole,
            isRightPanelOpen,
            toggleRightPanel,
            sermonToLoad,
            setSermonToLoad,
            pdfExportTimestamp,
            triggerPdfExport,
            lastSavedTimestamp,
            triggerSaveComplete
        }}>
            {children}
        </RhemaContext.Provider>
    );
}

export function useRhema() {
    const context = useContext(RhemaContext);
    if (context === undefined) {
        throw new Error('useRhema must be used within a RhemaProvider');
    }
    return context;
}
