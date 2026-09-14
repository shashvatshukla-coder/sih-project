// PolicyLab requests use a same-origin Vercel rewrite in production. This avoids
// browser CORS failures while still allowing an explicit endpoint override for
// local development or another hosting provider.
const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const API_BASE = (metaEnv.VITE_POLICYLAB_URL?.trim() || '/policylab-api').replace(/\/+$/, '');

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
