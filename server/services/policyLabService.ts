export interface PolicyLabRunRequest {
  base_dir?: string;
  model_path?: string;
}

const DEFAULT_POLICYLAB_URL = 'https://bhu-drishti-policylab.onrender.com';

function policyLabBaseUrl(): string {
  const value = process.env.POLICYLAB_URL?.trim() || DEFAULT_POLICYLAB_URL;
  return value.replace(/\/+$/, '');
}

async function callPolicyLab(path: string, body: PolicyLabRunRequest = {}) {
  const base = policyLabBaseUrl();
  if (!base) {
    throw new Error('POLICYLAB_URL is not configured on the backend.');
  }

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.detail || payload?.error || `PolicyLab returned HTTP ${response.status}`;
    throw new Error(detail);
  }

  return payload;
}

export const PolicyLabService = {
  isConfigured(): boolean {
    return Boolean(policyLabBaseUrl());
  },

  async health() {
    const base = policyLabBaseUrl();
    if (!base) return { configured: false, available: false };
    try {
      const response = await fetch(`${base}/health`);
      const payload = await response.json();
      return { configured: true, available: response.ok, data: payload };
    } catch (error) {
      return {
        configured: true,
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  runPrediction(request: PolicyLabRunRequest = {}) {
    return callPolicyLab('/predict', request);
  },

  runScenarios(request: PolicyLabRunRequest = {}) {
    return callPolicyLab('/scenarios', request);
  },
};
