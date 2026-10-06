export const safetyConfig = {
  permissions: {
    chat: true,
    research: true,
    memory: true,
    tools: false,
    code_execution: false,
    external_actions: false,
  },
  hardBlock: [
    /\bbypass\s+(auth|authentication|login)\b/i,
    /\b(steal|exfiltrate)\s+(credential|password|token)/i,
    /\bunauthorized\s+access\b/i,
  ],
} as const;
