import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  public static async testConnection(apiKey?: string): Promise<{ success: boolean; message: string; model: string; latencyMs?: number }> {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    if (!key) {
      return {
        success: false,
        message: 'No GEMINI_API_KEY provided. The system is operating in Grounded Statistical AI Mode.',
        model: 'Grounded Statistical Engine (Deterministic Baseline)'
      };
    }

    const start = Date.now();
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Hello Gemini! Respond in one short sentence confirming you are active for Bhu-Drishti Land Intelligence Platform.';
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const latency = Date.now() - start;

      return {
        success: true,
        message: text.trim(),
        model: 'Google Gemini 1.5 Flash (Active & Connected)',
        latencyMs: latency
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gemini API Error: ${err.message}`,
        model: 'Google Gemini 1.5 Flash (Connection Failed)'
      };
    }
  }

  public static async generateLandInsights(query: string, landContext: any, apiKey?: string): Promise<{ success: boolean; text?: string; error?: string; model: string }> {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    if (!key) {
      return {
        success: false,
        error: 'No API Key configured. Defaulted to Grounded Statistical Engine.',
        model: 'Grounded Statistical Engine (Deterministic)'
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are the Bhu-Drishti Land Intelligence AI for India.
User Question: "${query}"

Verified Ground-Truth Land Statistics from Government of India (MoA&FW / Board of Revenue):
${JSON.stringify(landContext, null, 2)}

Instructions:
1. Provide a professional, evidence-backed analytical synthesis in 2-3 concise paragraphs.
2. Highlight the decadal shifts, CAGR, and notable drivers (e.g., Sodic/Usar land reclamation, Gauriganj district HQ urban growth, canal irrigation under PMKSY & Sharda Sahayak).
3. Conclude with actionable policy and urban/agricultural planning recommendations.`;

      const res = await model.generateContent(prompt);
      return {
        success: true,
        text: res.response.text().trim(),
        model: 'Google Gemini 1.5 Flash (Live Generated)'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        model: 'Grounded Statistical Engine (Fallback)'
      };
    }
  }
}
