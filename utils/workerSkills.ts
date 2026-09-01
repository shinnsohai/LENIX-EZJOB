import type { UserSkill, WorkerProfile } from '../types';

/**
 * Legacy skills migration: older worker profiles only had a single flat
 * `trade_or_skill` + `trade_specifics` pair (pre multi-skilling). If a
 * profile's `skills` array is missing/empty but the legacy flat fields are
 * present, synthesize a one-item `skills` array from them so the rest of the
 * app (which reads `skills`) keeps working for profiles created before the
 * multi-skill feature existed.
 *
 * Shared by WorkerDashboard.tsx (own profile, edit mode) and
 * PublicWorkerProfile.tsx (any worker's profile, read-only view) — this used
 * to be duplicated byte-for-byte in both files.
 */
export function migrateLegacySkills(profileData: Pick<WorkerProfile, 'skills' | 'trade_or_skill' | 'trade_specifics'>): UserSkill[] {
    const existingSkills: UserSkill[] = profileData.skills || [];
    if (existingSkills.length === 0 && profileData.trade_or_skill) {
        return [{
            trade: profileData.trade_or_skill,
            tags: profileData.trade_specifics || {},
            isPrimary: true,
        }];
    }
    return existingSkills;
}
