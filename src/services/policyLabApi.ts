const configuredBase = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_BASE_URL;
// Production frontend is hosted on Vercel; PolicyLab requests must go to the Render API.
const rawBase = configuredBase || 'https://bhu-drishti-api.onrender.com/api';
const API_BASE = String(rawBase).replace(/\/+$/, '');

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
    throw new Error(payload?.error || payload?.detail || `Request failed: ${response.status}`);
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
  health: () => request<PolicyLabResponse>('/policylab/health'),
  predict: () => request<PolicyLabResponse>('/policylab/predict', { method: 'POST', body: '{}' }),
  scenarios: (scenario?: PolicyLabScenarioRequest) => request<PolicyLabResponse>('/policylab/scenarios', {
    method: 'POST',
    body: JSON.stringify(scenario || {}),
  }),
};
