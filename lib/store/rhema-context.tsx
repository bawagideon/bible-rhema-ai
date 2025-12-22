"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/lib/types';

interface RhemaContextType {
    userRole: UserRole;
    toggleRole: () => void;
    isRightPanelOpen: boolean;
    toggleRightPanel: () => void;
}

const RhemaContext = createContext<RhemaContextType | undefined>(undefined);

export function RhemaProvider({ children }: { children: ReactNode }) {
    const [userRole, setUserRole] = useState<UserRole>('MINISTER');
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

    const toggleRole = () => {
        setUserRole(prev => {
            if (prev === 'MINISTER') return 'DISCIPLE';
            if (prev === 'DISCIPLE') return 'GUEST';
            return 'MINISTER';
        });
    };

    const toggleRightPanel = () => setIsRightPanelOpen(prev => !prev);

    return (
        <RhemaContext.Provider value={{ userRole, toggleRole, isRightPanelOpen, toggleRightPanel }}>
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
