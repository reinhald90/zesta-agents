import { safetyConfig } from '@/config/safety.config';

export const POLICY = {
  // Aturan ini static: agent tidak boleh mengubahnya runtime.
  rules: [
    'Tidak melakukan bypass authentication.',
    'Tidak melakukan unauthorized access.',
    'Tidak mengeksploitasi sistem lain.',
    'Tidak mencuri credential atau data privat.',
    'Hanya research resource publik / yang diizinkan.',
  ],
  permissions: safetyConfig.permissions,
  hardBlock: safetyConfig.hardBlock,
} as const;

export type PermissionKey = keyof typeof POLICY.permissions;
