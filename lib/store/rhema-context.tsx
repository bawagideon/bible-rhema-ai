"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { SermonData } from '@/components/studio/sermon-builder';
import { useUser } from '@clerk/nextjs';
import { LoadingScreen } from '@/components/ui/loading-screen';

export interface StudyContextData {
    query: string;
    mode: 'exegesis' | 'devotion';
    passageFocus: string;
    passageSummary: string;
    keyTerms: {
        term: string;
        original: string;
        language: string;
        definition: string;
        occurrencesNote?: string;
    }[];
    crossReferences: {
        reference: string;
        text: string;
        connection?: string;
    }[];
    followUpQuestions: string[];
    sourcesUsed: string[];
}

interface RhemaContextType {
    userRole: UserRole;
    userTier: UserRole;
    userName: string;
    userAvatar: string;
    toggleRole: () => void;
    refreshProfile: () => Promise<void>;
    isRightPanelOpen: boolean;
    toggleRightPanel: () => void;
    sermonToLoad: SermonData | null;
    setSermonToLoad: (sermon: SermonData | null) => void;
    pdfExportTimestamp: number | null;
    triggerPdfExport: () => void;
    lastSavedTimestamp: number | null;
    triggerSaveComplete: () => void;
    activeStudyContext: StudyContextData | null;
    setActiveStudyContext: (context: StudyContextData | null) => void;
}

const RhemaContext = createContext<RhemaContextType | undefined>(undefined);

export function RhemaProvider({ children }: { children: ReactNode }) {
    const { user, isLoaded } = useUser();

    const [userRole, setUserRole] = useState<UserRole>('SEEKER');
    const [userTier, setUserTier] = useState<UserRole>('SEEKER');
    const [userName, setUserName] = useState<string>("Believer");
    const [userAvatar, setUserAvatar] = useState<string>("");
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [sermonToLoad, setSermonToLoad] = useState<SermonData | null>(null);
    const [pdfExportTimestamp, setPdfExportTimestamp] = useState<number | null>(null);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);
    const [activeStudyContext, setActiveStudyContext] = useState<StudyContextData | null>(null);

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const fetchProfile = async () => {
        if (!isLoaded) return;

        if (!user) {
            setUserRole('SEEKER');
            setUserTier('SEEKER');
            setIsLoadingProfile(false);
            return;
        }

        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();

            if (data && data.authenticated) {
                const tier = (data.tier || 'SEEKER').toUpperCase() as UserRole;
                setUserRole(tier);
                setUserTier(tier);
                if (data.full_name) setUserName(data.full_name);
                if (data.avatar_url) setUserAvatar(data.avatar_url);
            } else if (user) {
                setUserName(user.fullName || user.firstName || "Believer");
                if (user.imageUrl) setUserAvatar(user.imageUrl);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user, isLoaded]);

    const toggleRole = () => {
        // Dev helper to preview UI across tiers
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
            refreshProfile: fetchProfile,
            isRightPanelOpen,
            toggleRightPanel,
            sermonToLoad,
            setSermonToLoad,
            pdfExportTimestamp,
            triggerPdfExport,
            lastSavedTimestamp,
            triggerSaveComplete,
            activeStudyContext,
            setActiveStudyContext
        }}>
            {children}
        </RhemaContext.Provider>
    );
}

export function useRhema() {
    const context = useContext(RhemaContext);
    if (!context) {
        throw new Error("useRhema must be used within a RhemaProvider");
    }
    return context;
}
