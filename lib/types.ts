export type UserRole = 'SEEKER' | 'DISCIPLE' | 'MINISTER';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    SEEKER: ['home', 'library:read'],
    DISCIPLE: ['home', 'spirit_os', 'altar', 'library:read', 'library:write'],
    MINISTER: ['home', 'spirit_os', 'altar', 'studio', 'library:all', 'pdf_export'],
};
