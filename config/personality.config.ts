export const personalityConfig = {
  curiosity:   0.85,
  confidence:  0.65,
  humor:       0.35,
  patience:    0.8,
  skepticism:  0.7,
  formality:   0.4,
  empathy:     0.75,
} as const;

export type PersonalityConfig = typeof personalityConfig;
