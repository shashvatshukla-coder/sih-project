// Local development can set VITE_POLICYLAB_URL=http://localhost:8000.
// Production falls back to the live PolicyLab service.
const viteEnv = ((import.meta as any).env || {}) as Record<string, any>;
const API_BASE = (
  viteEnv.VITE_POLICYLAB_URL?.trim() || 'https://bhu-drishti-policylab.onrender.com'
).replace(/\/+$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error('PolicyLab network connection failed. Confirm the PolicyLab service is online.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || payload?.detail || `PolicyLab request failed: ${response.status}`);
  }
  return payload as T;
}

export type PolicyLabModelMode = 'optimized' | 'full';

export interface PolicyLabScenarioRequest {
  agriculture_protection: number;
  water_protection: number;
  forest_protection: number;
  policy_text?: string;
  model_mode?: PolicyLabModelMode;
}

export interface PolicyLabResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const policyLabApi = {
  health: () => request<PolicyLabResponse>('/health'),
  predict: (model_mode: PolicyLabModelMode = 'optimized') =>
    request<PolicyLabResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify({ model_mode }),
    }),
  scenarios: (scenario?: PolicyLabScenarioRequest) =>
    request<PolicyLabResponse>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenario || {}),
    }),
};
