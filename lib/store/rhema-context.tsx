"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { SermonData } from '@/components/studio/sermon-builder';

interface RhemaContextType {
    userRole: UserRole;
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
    const [userRole, setUserRole] = useState<UserRole>('MINISTER');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); // Default to open
    const [sermonToLoad, setSermonToLoad] = useState<SermonData | null>(null);
    const [pdfExportTimestamp, setPdfExportTimestamp] = useState<number | null>(null);
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);

    const toggleRole = () => {
        setUserRole(prev => {
            if (prev === 'MINISTER') return 'DISCIPLE';
            if (prev === 'DISCIPLE') return 'GUEST';
            return 'MINISTER';
        });
    };

    const toggleRightPanel = () => setIsRightPanelOpen(prev => !prev);
    const triggerPdfExport = () => setPdfExportTimestamp(Date.now());
    const triggerSaveComplete = () => setLastSavedTimestamp(Date.now());

    return (
        <RhemaContext.Provider value={{
            userRole,
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
