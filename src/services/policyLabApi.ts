// PolicyLab runs on the Render backend. Keep this production endpoint explicit so
// Vercel environment variables cannot accidentally redirect requests to Vercel /api.
const API_BASE = 'https://bhu-drishti-api.onrender.com/api';

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
