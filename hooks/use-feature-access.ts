import { useState } from 'react';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/types';

// Mock user for development
const MOCK_USER = {
    id: 'dev-user',
    name: 'Rev. Dev',
    role: 'MINISTER' as UserRole,
    avatarUrl: 'https://github.com/shadcn.png',
};

export function useFeatureAccess() {
    const [user] = useState(MOCK_USER);

    const hasAccess = (feature: string) => {
        // Basic role hierarchy check
        if (user.role === 'MINISTER') return true;
        if (user.role === 'DISCIPLE' && feature !== 'studio' && feature !== 'pdf_export') return true;
        if (user.role === 'GUEST' && ['home', 'library:read'].includes(feature)) return true;

        // Fallback to explicit permissions list if needed
        const permissions = ROLE_PERMISSIONS[user.role];
        return permissions.includes(feature);
    };

    const hasRole = (role: UserRole) => {
        if (user.role === role) return true;
        // Hierarchy: MINISTER > DISCIPLE > GUEST
        if (user.role === 'MINISTER') return true;
        if (user.role === 'DISCIPLE' && role === 'GUEST') return true;
        return false;
    };

    return {
        user,
        hasAccess,
        hasRole,
    };
}
