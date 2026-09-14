// Production always uses the same-origin Vercel rewrite. This prevents a Vercel
// environment override from accidentally restoring browser-to-Render CORS errors.
// Local development can still point directly to PolicyLab with VITE_POLICYLAB_URL.
const viteEnv = ((import.meta as any).env || {}) as Record<string, any>;
const developmentBase =
  viteEnv.VITE_POLICYLAB_URL?.trim() || 'https://bhu-drishti-policylab.onrender.com';
const API_BASE = (viteEnv.PROD ? '/policylab-api' : developmentBase).replace(/\/+$/, '');

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
      'PolicyLab network connection failed. Confirm the latest Vercel production deployment and the Render model service are online.'
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
