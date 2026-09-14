// PolicyLab is a separate Render service. Call it directly in production so
// the browser reaches the live ML service without relying on a Vercel proxy.
// CORS is enabled by the PolicyLab FastAPI service.
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
    throw new Error(
      'PolicyLab network connection failed. Confirm the Render PolicyLab service is online.'
    );
  }

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
