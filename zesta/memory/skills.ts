/**
 * Skill tier — placeholder Phase 2.
 * Implementasi penuh di Phase 3 (learning engine).
 */
export interface SkillRecord {
  name: string;
  description: string;
  level: number;
}

export async function listSkills(_userId: string): Promise<SkillRecord[]> {
  return [];
}
