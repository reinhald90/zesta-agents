import { POLICY, type PermissionKey } from './policy';

const runtimeState: Record<PermissionKey, boolean> = { ...POLICY.permissions };

export function isAllowed(key: PermissionKey): boolean {
  // Note: agent tidak punya API untuk menulis runtimeState.
  // Hanya admin/UI (di masa depan) yang boleh mengubah via server action khusus.
  return runtimeState[key] === true;
}

export function listPermissions(): Record<PermissionKey, boolean> {
  return { ...runtimeState };
}
