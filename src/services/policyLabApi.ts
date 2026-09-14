// PolicyLab is hosted as a dedicated public ML service on Render.
// Calling it directly avoids the cross-region Render API proxy path that was
// returning HTTP 502 in the hosted demo.
const API_BASE = 'https://bhu-drishti-policylab.onrender.com';

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
