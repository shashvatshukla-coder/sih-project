import { PolicyLabScenarioRequest } from '../../services/policyLabApi';

export interface PolicyInterpretation {
  policy: PolicyLabScenarioRequest;
  recognized: boolean;
  summary: string;
  details: string[];
  warnings: string[];
}

const LAND_USE_TERMS = {
  agriculture: ['agriculture', 'agricultural', 'farm', 'farmland', 'cropland', 'crop land', 'farming'],
  water: ['water', 'wetland', 'wetlands', 'lake', 'lakes', 'pond', 'ponds'],
  forest: ['forest', 'forests', 'woodland', 'woodlands', 'green cover', 'tree cover'],
} as const;

function extractPercent(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function extractFraction(text: string): number | null {
  const lower = text.toLowerCase();
  if (/\b(half|one half|1\/2)\b/.test(lower)) return 50;
  if (/\b(quarter|one quarter|1\/4)\b/.test(lower)) return 25;
  if (/\b(three quarters|three-quarter|3\/4)\b/.test(lower)) return 75;
  if (/\b(one third|a third|1\/3)\b/.test(lower)) return 100 / 3;
  if (/\b(two thirds|2\/3)\b/.test(lower)) return 200 / 3;
  return null;
}

function extractNaturalAmount(text: string): number | null {
  const lower = text.toLowerCase();
  const numeric = extractPercent(text);
  if (numeric !== null) return numeric;

  const fraction = extractFraction(text);
  if (fraction !== null) return fraction;

  if (/\b(all|entirely|completely|complete|fully|100 percent|100%)\b/.test(lower)) return 100;
  if (/\b(most|strongly|highly|large proportion)\b/.test(lower)) return 80;
  return null;
}

function findLandUse(lower: string): keyof typeof LAND_USE_TERMS | null {
  for (const [key, terms] of Object.entries(LAND_USE_TERMS) as Array<[keyof typeof LAND_USE_TERMS, readonly string[]]>) {
    if (terms.some((term) => lower.includes(term))) return key;
  }
  return null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function isConversionQuestion(lower: string) {
  return /\b(convert|conversion|converted|urbanise|urbanize|urbanisation|urbanization|development|developed|allow .* conversion|allow .* development)\b/.test(lower);
}

function isProtectionQuestion(lower: string) {
  return /\b(protect|protection|preserve|preservation|conserve|conservation|restrict|restriction|limit|limited|prevent|prevented|stop|stopped|safeguard)\b/.test(lower);
}

export function interpretPolicyQuestion(
  text: string,
  current: PolicyLabScenarioRequest,
): PolicyInterpretation {
  const cleaned = text.trim();
  const lower = cleaned.toLowerCase();
  const policy: PolicyLabScenarioRequest = { ...current, policy_text: cleaned };
  const details: string[] = [];
  const warnings: string[] = [];

  if (!cleaned) {
    return {
      policy,
      recognized: false,
      summary: 'Enter a land-policy question to interpret it.',
      details,
      warnings,
    };
  }

  const landUse = findLandUse(lower);
  const amount = extractNaturalAmount(cleaned);
  const conversion = isConversionQuestion(lower);
  const protection = isProtectionQuestion(lower);

  if (!landUse) {
    return {
      policy,
      recognized: false,
      summary: 'I could not identify agriculture, water/wetland, or forest in this question.',
      details,
      warnings: ['The current PolicyLab can simulate protection or conversion pressure for agriculture, water/wetland, and forest.'],
    };
  }

  if (amount === null) {
    return {
      policy,
      recognized: false,
      summary: `I found ${landUse}, but I could not determine the percentage or proportion to simulate.`,
      details,
      warnings: ['Try a value such as 50%, half, 80%, or completely.'],
    };
  }

  const bounded = clamp(amount);
  const protectionValue = conversion ? 100 - bounded : bounded;

  if (!conversion && !protection) {
    warnings.push('The question mentions a land category and an amount, but the action is unclear. I interpreted the amount as protection.');
  }

  if (conversion) {
    details.push(`${Math.round(bounded * 100) / 100}% conversion/development pressure was requested for ${landUse}.`);
    details.push(`${Math.round(protectionValue * 100) / 100}% protection is sent to the PolicyLab scenario engine.`);
  } else {
    details.push(`${Math.round(bounded * 100) / 100}% protection is applied to ${landUse}.`);
  }

  if (lower.includes('urban') || lower.includes('built-up') || lower.includes('built up') || lower.includes('city')) {
    details.push('Urbanisation is treated as built-up conversion pressure, consistent with the current scenario model.');
  }

  switch (landUse) {
    case 'agriculture':
      policy.agriculture_protection = protectionValue;
      break;
    case 'water':
      policy.water_protection = protectionValue;
      break;
    case 'forest':
      policy.forest_protection = protectionValue;
      break;
  }

  const label = landUse === 'water' ? 'water/wetland' : landUse;
  const action = conversion ? `${bounded}% conversion` : `${bounded}% protection`;

  return {
    policy,
    recognized: true,
    summary: `Interpreted as ${action} for ${label}.`,
    details,
    warnings,
  };
}
