import { useRhema } from '@/lib/store/rhema-context';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/types';

export function useFeatureAccess() {
    const { userRole, userName, userAvatar } = useRhema();

    // Construct a user object that mimics the old structure for compatibility
    const user = {
        id: 'real-user', // ID is less important here than role
        name: userName,
        role: userRole,
        avatarUrl: userAvatar || 'https://github.com/shadcn.png'
    };

    const hasAccess = (feature: string) => {
        // Basic role hierarchy check
        if (userRole === 'MINISTER') return true;
        if (userRole === 'DISCIPLE' && feature !== 'studio' && feature !== 'pdf_export') return true;
        if (userRole === 'SEEKER' && ['home', 'library:read'].includes(feature)) return true;

        // Fallback to explicit permissions list if needed
        const permissions = ROLE_PERMISSIONS[userRole];
        return permissions?.includes(feature) || false;
    };

    const hasRole = (role: UserRole) => {
        if (userRole === role) return true;
        // Hierarchy: MINISTER > DISCIPLE > SEEKER
        if (userRole === 'MINISTER') return true;
        if (userRole === 'DISCIPLE' && role === 'SEEKER') return true;
        return false;
    };

    return {
        user,
        hasAccess,
        hasRole,
    };
}
