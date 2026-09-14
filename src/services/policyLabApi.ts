// PolicyLab is hosted as a dedicated public ML service on Render.
// Vercel can override the endpoint, while the production URL remains a safe
// fallback so PolicyLab continues working when the variable is not configured.
const DEFAULT_POLICYLAB_URL = 'https://bhu-drishti-policylab.onrender.com';
const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const API_BASE = (metaEnv.VITE_POLICYLAB_URL?.trim() || DEFAULT_POLICYLAB_URL).replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || `PolicyLab request failed: ${response.status}`);
  }
  return payload as T;
}

export interface PolicyLabScenarioRequest {
  agriculture_protection: number;
  water_protection: number;
  forest_protection: number;
  policy_text?: string;
}

export interface PolicyLabResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const policyLabApi = {
  health: () => request<PolicyLabResponse>('/health'),
  predict: () => request<PolicyLabResponse>('/predict', { method: 'POST', body: '{}' }),
  scenarios: (scenario?: PolicyLabScenarioRequest) => request<PolicyLabResponse>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(scenario || {}),
  }),
};
