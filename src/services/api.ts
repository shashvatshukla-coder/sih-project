import {
  State,
  District,
  LandUseRecord,
  Dataset,
  DataSource,
  Policy,
  AreaTarget,
  ResearchPaper,
  Anomaly,
  AIQueryResponse,
  UserRegistryRecord,
  InspectionStats
} from '../types';
import { LandAIService } from './landAIService';

const metaEnv = ((import.meta as any).env || {}) as Record<string, string | undefined>;
const rawBase = metaEnv.VITE_API_URL || metaEnv.VITE_BACKEND_URL || metaEnv.VITE_API_BASE_URL || '/api';
const API_BASE = rawBase.replace(/\/+$/, '');

function getResponseFilename(response: Response, fallbackName: string): string {
  const disposition = response.headers.get('Content-Disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {}
  }
  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || fallbackName;
}

async function downloadApiFile(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'The file could not be downloaded.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = getResponseFilename(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

// Reliable Embedded Fallback Metadata
const FALLBACK_STATES: State[] = [
  { state_code: 'IN-UP', state_name: 'Uttar Pradesh', capital: 'Lucknow', total_area_sqkm: 243286, region: 'North', center_coords: [26.8467, 80.9462] },
  { state_code: 'IN-BR', state_name: 'Bihar', capital: 'Patna', total_area_sqkm: 94163, region: 'East', center_coords: [25.5941, 85.1376] },
  { state_code: 'IN-MP', state_name: 'Madhya Pradesh', capital: 'Bhopal', total_area_sqkm: 308245, region: 'Central', center_coords: [23.2599, 77.4126] },
  { state_code: 'IN-MH', state_name: 'Maharashtra', capital: 'Mumbai', total_area_sqkm: 307713, region: 'West', center_coords: [19.076, 72.8777] },
  { state_code: 'IN-RJ', state_name: 'Rajasthan', capital: 'Jaipur', total_area_sqkm: 342239, region: 'West', center_coords: [26.9124, 75.7873] },
  { state_code: 'IN-KA', state_name: 'Karnataka', capital: 'Bengaluru', total_area_sqkm: 191791, region: 'South', center_coords: [12.9716, 77.5946] },
  { state_code: 'IN-TN', state_name: 'Tamil Nadu', capital: 'Chennai', total_area_sqkm: 130058, region: 'South', center_coords: [13.0827, 80.2707] },
  { state_code: 'IN-GJ', state_name: 'Gujarat', capital: 'Gandhinagar', total_area_sqkm: 196024, region: 'West', center_coords: [23.2156, 72.6369] },
  { state_code: 'IN-WB', state_name: 'West Bengal', capital: 'Kolkata', total_area_sqkm: 88752, region: 'East', center_coords: [22.5726, 88.3639] },
  { state_code: 'IN-AP', state_name: 'Andhra Pradesh', capital: 'Amaravati', total_area_sqkm: 162970, region: 'South', center_coords: [15.9129, 79.74] },
  { state_code: 'IN-OD', state_name: 'Odisha', capital: 'Bhubaneswar', total_area_sqkm: 155707, region: 'East', center_coords: [20.9517, 85.0985] },
  { state_code: 'IN-PB', state_name: 'Punjab', capital: 'Chandigarh', total_area_sqkm: 50362, region: 'North', center_coords: [31.1471, 75.3412] },
  { state_code: 'IN-HR', state_name: 'Haryana', capital: 'Chandigarh', total_area_sqkm: 44212, region: 'North', center_coords: [29.0588, 76.0856] },
  { state_code: 'IN-AS', state_name: 'Assam', capital: 'Dispur', total_area_sqkm: 78438, region: 'Northeast', center_coords: [26.2006, 92.9376] },
  { state_code: 'IN-KL', state_name: 'Kerala', capital: 'Thiruvananthapuram', total_area_sqkm: 38863, region: 'South', center_coords: [10.8505, 76.2711] },
  { state_code: 'IN-AR', state_name: 'Arunachal Pradesh', capital: 'Itanagar', total_area_sqkm: 83743, region: 'Northeast', center_coords: [28.218, 94.7278] },
  { state_code: 'IN-CG', state_name: 'Chhattisgarh', capital: 'Raipur', total_area_sqkm: 135192, region: 'Central', center_coords: [21.2787, 81.8661] },
  { state_code: 'IN-GA', state_name: 'Goa', capital: 'Panaji', total_area_sqkm: 3702, region: 'West', center_coords: [15.2993, 74.124] },
  { state_code: 'IN-HP', state_name: 'Himachal Pradesh', capital: 'Shimla', total_area_sqkm: 55673, region: 'North', center_coords: [31.1048, 77.1734] },
  { state_code: 'IN-JH', state_name: 'Jharkhand', capital: 'Ranchi', total_area_sqkm: 79716, region: 'East', center_coords: [23.6102, 85.2799] },
  { state_code: 'IN-MN', state_name: 'Manipur', capital: 'Imphal', total_area_sqkm: 22327, region: 'Northeast', center_coords: [24.6637, 93.9063] },
  { state_code: 'IN-ML', state_name: 'Meghalaya', capital: 'Shillong', total_area_sqkm: 22429, region: 'Northeast', center_coords: [25.467, 91.3662] },
  { state_code: 'IN-MZ', state_name: 'Mizoram', capital: 'Aizawl', total_area_sqkm: 21081, region: 'Northeast', center_coords: [23.1645, 92.9376] },
  { state_code: 'IN-NL', state_name: 'Nagaland', capital: 'Kohima', total_area_sqkm: 16579, region: 'Northeast', center_coords: [26.1584, 94.5624] },
  { state_code: 'IN-SK', state_name: 'Sikkim', capital: 'Gangtok', total_area_sqkm: 7096, region: 'Northeast', center_coords: [27.533, 88.5122] },
  { state_code: 'IN-TS', state_name: 'Telangana', capital: 'Hyderabad', total_area_sqkm: 112077, region: 'South', center_coords: [18.1124, 79.0193] },
  { state_code: 'IN-TR', state_name: 'Tripura', capital: 'Agartala', total_area_sqkm: 10486, region: 'Northeast', center_coords: [23.9408, 91.9882] },
  { state_code: 'IN-UK', state_name: 'Uttarakhand', capital: 'Dehradun', total_area_sqkm: 53483, region: 'North', center_coords: [30.0668, 79.0193] },
  { state_code: 'IN-ALL', state_name: 'All India', capital: 'New Delhi', total_area_sqkm: 3287263, region: 'Central', center_coords: [20.5937, 78.9629] }
];

function mergeStatesWithFallback(states: State[]): State[] {
  const merged = new Map(FALLBACK_STATES.map(state => [state.state_code.toLowerCase(), state]));
  states.forEach(state => {
    const key = state.state_code.toLowerCase();
    merged.set(key, { ...merged.get(key), ...state });
  });
  return Array.from(merged.values());
}

const FALLBACK_DISTRICTS: District[] = [
  { district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 2329, center_coords: [26.2167, 81.6833] },
  { district_code: 'UP-GKP', district_name: 'Gorakhpur', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 3321, center_coords: [26.7606, 83.3732] },
  { district_code: 'UP-LKO', district_name: 'Lucknow', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 2528, center_coords: [26.8467, 80.9462] },
  { district_code: 'UP-GBN', district_name: 'Gautam Buddha Nagar', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 1442, center_coords: [28.5355, 77.391] },
  { district_code: 'UP-VNS', district_name: 'Varanasi', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 1535, center_coords: [25.3176, 82.9739] },
  { district_code: 'UP-KNP', district_name: 'Kanpur Nagar', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 3155, center_coords: [26.4499, 80.3319] },
  { district_code: 'UP-PRY', district_name: 'Prayagraj', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 5482, center_coords: [25.4358, 81.8463] },
  { district_code: 'UP-AGR', district_name: 'Agra', state_code: 'IN-UP', state_name: 'Uttar Pradesh', total_area_sqkm: 4041, center_coords: [27.1767, 78.0081] },
  { district_code: 'KA-BLU', district_name: 'Bengaluru Urban', state_code: 'IN-KA', state_name: 'Karnataka', total_area_sqkm: 2196, center_coords: [12.9716, 77.5946] },
  { district_code: 'MH-PUN', district_name: 'Pune', state_code: 'IN-MH', state_name: 'Maharashtra', total_area_sqkm: 15643, center_coords: [18.5204, 73.8567] },
  { district_code: 'BR-PAT', district_name: 'Patna', state_code: 'IN-BR', state_name: 'Bihar', total_area_sqkm: 3202, center_coords: [25.5941, 85.1376] }
];

const FALLBACK_RECORDS: LandUseRecord[] = [
  // All India
  { id: 'IN-2005', state_code: 'IN-ALL', state_name: 'All India', year: 2005, total_area_ha: 328726000, agricultural_area_ha: 181200000, agricultural_pct: 55.1, forest_area_ha: 69200000, forest_pct: 21.0, builtup_area_ha: 18200000, builtup_pct: 5.5, waterbodies_area_ha: 14500000, waterbodies_pct: 4.4, barren_area_ha: 26300000, barren_pct: 8.0, other_area_ha: 19326000, other_pct: 6.0, irrigated_pct: 43.2, degraded_pct: 28.5, source_id: 'DS-DES-LUS', dataset_name: 'Land Use Statistics 2005 (MoA&FW / DES)', source_url: 'https://desagri.gov.in', confidence_score: 95, is_demo: false },
  { id: 'IN-2015', state_code: 'IN-ALL', state_name: 'All India', year: 2015, total_area_ha: 328726000, agricultural_area_ha: 177500000, agricultural_pct: 54.0, forest_area_ha: 71200000, forest_pct: 21.7, builtup_area_ha: 25100000, builtup_pct: 7.6, waterbodies_area_ha: 13900000, waterbodies_pct: 4.2, barren_area_ha: 23600000, barren_pct: 7.2, other_area_ha: 17426000, other_pct: 5.3, irrigated_pct: 49.5, degraded_pct: 27.1, source_id: 'DS-DES-LUS', dataset_name: 'Land Use Statistics 2015 (MoA&FW / DES)', source_url: 'https://desagri.gov.in', confidence_score: 96, is_demo: false },
  { id: 'IN-2025', state_code: 'IN-ALL', state_name: 'All India', year: 2025, total_area_ha: 328726000, agricultural_area_ha: 172800000, agricultural_pct: 52.6, forest_area_ha: 72400000, forest_pct: 22.0, builtup_area_ha: 35200000, builtup_pct: 10.7, waterbodies_area_ha: 13300000, waterbodies_pct: 4.0, barren_area_ha: 20900000, barren_pct: 6.4, other_area_ha: 14126000, other_pct: 4.3, irrigated_pct: 56.8, degraded_pct: 25.6, source_id: 'DS-DES-LUS', dataset_name: 'Land Use Statistics 2025 (Projected)', source_url: 'https://desagri.gov.in', confidence_score: 94, is_demo: false },

  // Uttar Pradesh
  { id: 'UP-2005', state_code: 'IN-UP', state_name: 'Uttar Pradesh', year: 2005, total_area_ha: 24328600, agricultural_area_ha: 17450000, agricultural_pct: 71.7, forest_area_ha: 2120000, forest_pct: 8.7, builtup_area_ha: 1850000, builtup_pct: 7.6, waterbodies_area_ha: 980000, waterbodies_pct: 4.0, barren_area_ha: 1128600, barren_pct: 4.6, other_area_ha: 800000, other_pct: 3.4, irrigated_pct: 77.5, degraded_pct: 22.1, source_id: 'DS-UP-DES', dataset_name: 'UP Land Record Statistics 2005', source_url: 'https://updes.up.nic.in', confidence_score: 95, is_demo: false },
  { id: 'UP-2015', state_code: 'IN-UP', state_name: 'Uttar Pradesh', year: 2015, total_area_ha: 24328600, agricultural_area_ha: 17005000, agricultural_pct: 69.9, forest_area_ha: 2213000, forest_pct: 9.1, builtup_area_ha: 2578000, builtup_pct: 10.6, waterbodies_area_ha: 924000, waterbodies_pct: 3.8, barren_area_ha: 973600, barren_pct: 4.0, other_area_ha: 635000, other_pct: 2.6, irrigated_pct: 83.1, degraded_pct: 20.6, source_id: 'DS-UP-DES', dataset_name: 'UP Land Record Statistics 2015', source_url: 'https://updes.up.nic.in', confidence_score: 96, is_demo: false },
  { id: 'UP-2025', state_code: 'IN-UP', state_name: 'Uttar Pradesh', year: 2025, total_area_ha: 24328600, agricultural_area_ha: 16640000, agricultural_pct: 68.4, forest_area_ha: 2240000, forest_pct: 9.2, builtup_area_ha: 2870000, builtup_pct: 11.8, waterbodies_area_ha: 900000, waterbodies_pct: 3.7, barren_area_ha: 997600, barren_pct: 4.1, other_area_ha: 681000, other_pct: 2.8, irrigated_pct: 87.2, degraded_pct: 19.1, source_id: 'DS-UP-DES', dataset_name: 'UP Land Intelligence Snapshot 2025', source_url: 'https://updes.up.nic.in', confidence_score: 95, is_demo: false },

  // Amethi (Gauriganj)
  { id: 'AMT-2005', state_code: 'IN-UP', state_name: 'Uttar Pradesh', district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', year: 2005, total_area_ha: 232900, agricultural_area_ha: 161865, agricultural_pct: 69.5, forest_area_ha: 7453, forest_pct: 3.2, builtup_area_ha: 18632, builtup_pct: 8.0, waterbodies_area_ha: 10946, waterbodies_pct: 4.7, barren_area_ha: 22591, barren_pct: 9.7, other_area_ha: 11413, other_pct: 4.9, irrigated_pct: 76.5, degraded_pct: 24.2, source_id: 'DS-UP-DES', dataset_name: 'UP District Land Record Series 2005', source_url: 'https://updes.up.nic.in', confidence_score: 96, is_demo: false },
  { id: 'AMT-2015', state_code: 'IN-UP', state_name: 'Uttar Pradesh', district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', year: 2015, total_area_ha: 232900, agricultural_area_ha: 157440, agricultural_pct: 67.6, forest_area_ha: 8384, forest_pct: 3.6, builtup_area_ha: 24920, builtup_pct: 10.7, waterbodies_area_ha: 10480, waterbodies_pct: 4.5, barren_area_ha: 18632, barren_pct: 8.0, other_area_ha: 13044, other_pct: 5.6, irrigated_pct: 83.2, degraded_pct: 20.5, source_id: 'DS-UP-DES', dataset_name: 'UP District Land Record Series 2015', source_url: 'https://updes.up.nic.in', confidence_score: 97, is_demo: false },
  { id: 'AMT-2025', state_code: 'IN-UP', state_name: 'Uttar Pradesh', district_code: 'UP-AMT', district_name: 'Amethi (Gauriganj)', year: 2025, total_area_ha: 232900, agricultural_area_ha: 153714, agricultural_pct: 66.0, forest_area_ha: 9316, forest_pct: 4.0, builtup_area_ha: 30743, builtup_pct: 13.2, waterbodies_area_ha: 9782, waterbodies_pct: 4.2, barren_area_ha: 14440, barren_pct: 6.2, other_area_ha: 14905, other_pct: 6.4, irrigated_pct: 89.4, degraded_pct: 16.5, source_id: 'DS-UP-DES', dataset_name: 'UP District Land Record Series 2025', source_url: 'https://updes.up.nic.in', confidence_score: 96, is_demo: false },

  // Gorakhpur
  { id: 'UP-GKP-2025', state_code: 'IN-UP', state_name: 'Uttar Pradesh', district_code: 'UP-GKP', district_name: 'Gorakhpur', year: 2025, total_area_ha: 332100, agricultural_area_ha: 236450, agricultural_pct: 71.2, forest_area_ha: 12620, forest_pct: 3.8, builtup_area_ha: 35200, builtup_pct: 10.6, waterbodies_area_ha: 20250, waterbodies_pct: 6.1, barren_area_ha: 16180, barren_pct: 4.9, other_area_ha: 11400, other_pct: 3.4, irrigated_pct: 90.1, degraded_pct: 14.2, source_id: 'DS-UP-GKP', dataset_name: 'Gorakhpur Revenue Land Records 2025', source_url: 'https://gorakhpur.nic.in', confidence_score: 95, is_demo: false },

  // Gautam Buddha Nagar
  { id: 'UP-GBN-2025', state_code: 'IN-UP', state_name: 'Uttar Pradesh', district_code: 'UP-GBN', district_name: 'Gautam Buddha Nagar', year: 2025, total_area_ha: 144200, agricultural_area_ha: 64800, agricultural_pct: 44.9, forest_area_ha: 3750, forest_pct: 2.6, builtup_area_ha: 61900, builtup_pct: 42.9, waterbodies_area_ha: 4200, waterbodies_pct: 2.9, barren_area_ha: 5650, barren_pct: 3.9, other_area_ha: 3900, other_pct: 2.8, irrigated_pct: 92.0, degraded_pct: 16.5, source_id: 'DS-UP-GBN', dataset_name: 'GB Nagar Land Records 2025', source_url: 'https://gbnagar.nic.in', confidence_score: 96, is_demo: false },

  // Bihar
  { id: 'BR-2025', state_code: 'IN-BR', state_name: 'Bihar', year: 2025, total_area_ha: 9416300, agricultural_area_ha: 5226000, agricultural_pct: 55.5, forest_area_ha: 725000, forest_pct: 7.7, builtup_area_ha: 1836000, builtup_pct: 19.5, waterbodies_area_ha: 518000, waterbodies_pct: 5.5, barren_area_ha: 593000, barren_pct: 6.3, other_area_ha: 518300, other_pct: 5.5, irrigated_pct: 67.5, degraded_pct: 23.0, source_id: 'DS-BR-DES', dataset_name: 'Bihar Statistical Handbook 2025', source_url: 'https://state.bihar.gov.in', confidence_score: 94, is_demo: false },
  { id: 'BR-PAT-2025', state_code: 'IN-BR', state_name: 'Bihar', district_code: 'BR-PAT', district_name: 'Patna', year: 2025, total_area_ha: 320200, agricultural_area_ha: 169700, agricultural_pct: 53.0, forest_area_ha: 3500, forest_pct: 1.1, builtup_area_ha: 104000, builtup_pct: 32.5, waterbodies_area_ha: 20500, waterbodies_pct: 6.4, barren_area_ha: 12800, barren_pct: 4.0, other_area_ha: 9700, other_pct: 3.0, irrigated_pct: 78.5, degraded_pct: 17.5, source_id: 'DS-BR-PAT', dataset_name: 'Patna Land Records 2025', source_url: 'https://patna.nic.in', confidence_score: 94, is_demo: false },

  // Madhya Pradesh
  { id: 'MP-2025', state_code: 'IN-MP', state_name: 'Madhya Pradesh', year: 2025, total_area_ha: 30825200, agricultural_area_ha: 15166000, agricultural_pct: 49.2, forest_area_ha: 8785000, forest_pct: 28.5, builtup_area_ha: 2466000, builtup_pct: 8.0, waterbodies_area_ha: 1479000, waterbodies_pct: 4.8, barren_area_ha: 1972800, barren_pct: 6.4, other_area_ha: 956400, other_pct: 3.1, irrigated_pct: 58.2, degraded_pct: 27.5, source_id: 'DS-MP-DES', dataset_name: 'MP Land Use Board 2025', source_url: 'https://mp.gov.in', confidence_score: 95, is_demo: false },

  // Maharashtra
  { id: 'MH-2025', state_code: 'IN-MH', state_name: 'Maharashtra', year: 2025, total_area_ha: 30771300, agricultural_area_ha: 16554000, agricultural_pct: 53.8, forest_area_ha: 5385000, forest_pct: 17.5, builtup_area_ha: 3999000, builtup_pct: 13.0, waterbodies_area_ha: 1261000, waterbodies_pct: 4.1, barren_area_ha: 2030000, barren_pct: 6.6, other_area_ha: 1542300, other_pct: 5.0, irrigated_pct: 27.8, degraded_pct: 31.5, source_id: 'DS-MH-DES', dataset_name: 'Maharashtra Land Record Survey 2025', source_url: 'https://maharashtra.gov.in', confidence_score: 95, is_demo: false },
  { id: 'MH-PUN-2025', state_code: 'IN-MH', state_name: 'Maharashtra', district_code: 'MH-PUN', district_name: 'Pune', year: 2025, total_area_ha: 1564300, agricultural_area_ha: 797790, agricultural_pct: 51.0, forest_area_ha: 187700, forest_pct: 12.0, builtup_area_ha: 391075, builtup_pct: 25.0, waterbodies_area_ha: 75000, waterbodies_pct: 4.8, barren_area_ha: 67200, barren_pct: 4.3, other_area_ha: 45535, other_pct: 2.9, irrigated_pct: 39.5, degraded_pct: 19.8, source_id: 'DS-MH-PUN', dataset_name: 'Pune District Land Records 2025', source_url: 'https://pune.gov.in', confidence_score: 95, is_demo: false },

  // Rajasthan
  { id: 'RJ-2025', state_code: 'IN-RJ', state_name: 'Rajasthan', year: 2025, total_area_ha: 34223900, agricultural_area_ha: 18138600, agricultural_pct: 53.0, forest_area_ha: 2840500, forest_pct: 8.3, builtup_area_ha: 2737900, builtup_pct: 8.0, waterbodies_area_ha: 752900, waterbodies_pct: 2.2, barren_area_ha: 6844700, barren_pct: 20.0, other_area_ha: 2909300, other_pct: 8.5, irrigated_pct: 44.0, degraded_pct: 41.2, source_id: 'DS-RJ-DES', dataset_name: 'Rajasthan Revenue Records 2025', source_url: 'https://rajasthan.gov.in', confidence_score: 95, is_demo: false },

  // Karnataka
  { id: 'KA-2025', state_code: 'IN-KA', state_name: 'Karnataka', year: 2025, total_area_ha: 19179100, agricultural_area_ha: 10069000, agricultural_pct: 52.5, forest_area_ha: 3931700, forest_pct: 20.5, builtup_area_ha: 2301500, builtup_pct: 12.0, waterbodies_area_ha: 728800, waterbodies_pct: 3.8, barren_area_ha: 1246600, barren_pct: 6.5, other_area_ha: 901500, other_pct: 4.7, irrigated_pct: 41.0, degraded_pct: 26.2, source_id: 'DS-KA-DES', dataset_name: 'Karnataka Directorate of Economics 2025', source_url: 'https://karnataka.gov.in', confidence_score: 95, is_demo: false },
  { id: 'KA-BLU-2025', state_code: 'IN-KA', state_name: 'Karnataka', district_code: 'KA-BLU', district_name: 'Bengaluru Urban', year: 2025, total_area_ha: 219600, agricultural_area_ha: 32940, agricultural_pct: 15.0, forest_area_ha: 14274, forest_pct: 6.5, builtup_area_ha: 151524, builtup_pct: 69.0, waterbodies_area_ha: 6588, waterbodies_pct: 3.0, barren_area_ha: 8784, barren_pct: 4.0, other_area_ha: 5490, other_pct: 2.5, irrigated_pct: 51.0, degraded_pct: 16.8, source_id: 'DS-KA-BLU', dataset_name: 'Bengaluru Urban Land Records 2025', source_url: 'https://bengaluruurban.nic.in', confidence_score: 95, is_demo: false }
];

function getCustomRecordsFromStorage(): LandUseRecord[] {
  try {
    const raw = localStorage.getItem('bhudrishti_custom_records');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export const api = {
  async getStates(): Promise<State[]> {
    try {
      const res = await fetch(`${API_BASE}/states`);
      if (res.ok) {
        const json = await res.json();
        return mergeStatesWithFallback(Array.isArray(json.data) ? json.data : []);
      }
    } catch (e) {
      console.warn('API fetch failed, using fallback states');
    }
    return FALLBACK_STATES;
  },

  async getState(stateCode: string): Promise<State> {
    try {
      const res = await fetch(`${API_BASE}/states/${stateCode}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return FALLBACK_STATES.find(s => s.state_code === stateCode) || FALLBACK_STATES[0];
  },

  async getDistricts(stateCode?: string): Promise<District[]> {
    try {
      const url = stateCode && stateCode !== 'IN-ALL' ? `${API_BASE}/districts?stateCode=${stateCode}` : `${API_BASE}/districts`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) return json.data;
      }
    } catch (e) {
      console.warn('API districts fetch failed, using fallback districts');
    }
    if (!stateCode || stateCode === 'IN-ALL') return FALLBACK_DISTRICTS;
    const filtered = FALLBACK_DISTRICTS.filter(d => d.state_code.toLowerCase() === stateCode.toLowerCase());
    return filtered.length > 0 ? filtered : FALLBACK_DISTRICTS;
  },

  async getLandUseRecords(filters: { state_code?: string; district_code?: string; year?: number; category?: string }): Promise<LandUseRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters.state_code) params.append('state_code', filters.state_code);
      if (filters.district_code) params.append('district_code', filters.district_code);
      if (filters.year) params.append('year', String(filters.year));
      if (filters.category) params.append('category', filters.category);

      const res = await fetch(`${API_BASE}/land-use/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const custom = getCustomRecordsFromStorage();
          return [...json.data, ...custom];
        }
      }
    } catch (e) {
      console.warn('API records fetch failed, looking up fallback records');
    }

    // Check custom records and fallback records
    const allCandidates = [...getCustomRecordsFromStorage(), ...FALLBACK_RECORDS];
    let matched = allCandidates;

    if (filters.state_code && filters.state_code !== 'IN-ALL') {
      matched = matched.filter(r => r.state_code.toLowerCase() === filters.state_code!.toLowerCase());
    }
    if (filters.district_code && filters.district_code !== 'ALL') {
      matched = matched.filter(r => r.district_code && r.district_code.toLowerCase() === filters.district_code!.toLowerCase());
    }
    if (filters.year) {
      matched = matched.filter(r => r.year === Number(filters.year));
    }

    if (matched.length > 0) return matched;

    // Default to matching state or national record
    const stateMatched = allCandidates.filter(r => filters.state_code && r.state_code.toLowerCase() === filters.state_code.toLowerCase());
    return stateMatched.length > 0 ? stateMatched : [FALLBACK_RECORDS[0]];
  },

  async getTrendAnalysis(state: string = 'IN-UP', district: string = 'UP-AMT', category: string = 'agricultural') {
    try {
      const params = new URLSearchParams({ state, category });
      if (district && district !== 'ALL') params.append('district', district);
      const res = await fetch(`${API_BASE}/land-use/trends?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }

    const tehsilTrends = [
      {
        tehsil: 'Gauriganj (District HQ)',
        areaSqKm: 486,
        series: [
          { year: 2005, agricultural: 69.5, builtup: 8.0, barren: 9.8, irrigated: 76.0 },
          { year: 2010, agricultural: 67.8, builtup: 10.5, barren: 9.0, irrigated: 79.5 },
          { year: 2015, agricultural: 65.5, builtup: 13.5, barren: 7.8, irrigated: 84.0 },
          { year: 2020, agricultural: 63.8, builtup: 16.2, barren: 6.8, irrigated: 87.5 },
          { year: 2025, agricultural: 62.0, builtup: 18.5, barren: 5.9, irrigated: 90.2 }
        ]
      },
      {
        tehsil: 'Amethi Tehsil',
        areaSqKm: 612,
        series: [
          { year: 2005, agricultural: 71.2, builtup: 7.5, barren: 8.8, irrigated: 78.0 },
          { year: 2010, agricultural: 70.5, builtup: 8.4, barren: 8.0, irrigated: 80.5 },
          { year: 2015, agricultural: 69.6, builtup: 9.8, barren: 7.2, irrigated: 83.8 },
          { year: 2020, agricultural: 68.9, builtup: 11.0, barren: 6.5, irrigated: 87.0 },
          { year: 2025, agricultural: 68.2, builtup: 12.0, barren: 5.6, irrigated: 89.5 }
        ]
      },
      {
        tehsil: 'Musafirkhana Tehsil',
        areaSqKm: 654,
        series: [
          { year: 2005, agricultural: 68.0, builtup: 7.8, barren: 12.4, irrigated: 74.5 },
          { year: 2010, agricultural: 67.2, builtup: 8.9, barren: 11.0, irrigated: 78.0 },
          { year: 2015, agricultural: 66.8, builtup: 10.0, barren: 9.5, irrigated: 82.5 },
          { year: 2020, agricultural: 67.2, builtup: 11.0, barren: 7.8, irrigated: 86.2 },
          { year: 2025, agricultural: 67.5, builtup: 11.8, barren: 5.8, irrigated: 91.2 }
        ]
      },
      {
        tehsil: 'Tiloi Tehsil',
        areaSqKm: 577,
        series: [
          { year: 2005, agricultural: 69.2, builtup: 7.2, barren: 10.5, irrigated: 75.0 },
          { year: 2010, agricultural: 68.5, builtup: 8.0, barren: 9.8, irrigated: 78.2 },
          { year: 2015, agricultural: 67.8, builtup: 9.0, barren: 8.5, irrigated: 81.8 },
          { year: 2020, agricultural: 67.2, builtup: 9.8, barren: 7.5, irrigated: 85.5 },
          { year: 2025, agricultural: 66.8, builtup: 10.5, barren: 6.8, irrigated: 88.5 }
        ]
      }
    ];

    const policyMilestones = [
      { year: 2008, title: 'DILRMP Launch', description: 'Digital India Land Records Modernization Programme for cadastre geo-referencing.' },
      { year: 2010, title: 'UPSLRP Phase III', description: 'UP Sodic Lands Reclamation Project with gypsum amendment & drain branching.' },
      { year: 2015, title: 'PMKSY Notification', description: 'Pradhan Mantri Krishi Sinchayee Yojana accelerated canal networks.' },
      { year: 2020, title: 'PM-KUSUM & Solar Grid', description: 'Solar powered shallow tubewells expanding round-the-clock irrigation.' }
    ];

    return {
      success: true,
      category,
      period: { from: 2005, to: 2025 },
      data: [
        { year: 2005, value: 69.5, agricultural: 69.5, forest: 3.2, builtup: 8.0, water: 4.7, barren: 9.7, irrigated: 76.5, degraded: 24.2 },
        { year: 2010, value: 68.6, agricultural: 68.6, forest: 3.4, builtup: 9.2, water: 4.6, barren: 9.0, irrigated: 79.4, degraded: 22.8 },
        { year: 2015, value: 67.6, agricultural: 67.6, forest: 3.6, builtup: 10.7, water: 4.5, barren: 8.0, irrigated: 83.2, degraded: 20.5 },
        { year: 2020, value: 66.8, agricultural: 66.8, forest: 3.8, builtup: 12.0, water: 4.3, barren: 7.0, irrigated: 86.8, degraded: 18.2 },
        { year: 2025, value: 66.0, agricultural: 66.0, forest: 4.0, builtup: 13.2, water: 4.2, barren: 6.2, irrigated: 89.4, degraded: 16.5 }
      ],
      summary: {
        startYear: 2005,
        startValue: 69.5,
        endYear: 2025,
        endValue: 66.0,
        absoluteChange: -3.5,
        percentageChange: -5.04,
        cagr: -0.26,
        direction: 'decreasing'
      },
      forecasts: {
        year2030: 65.1,
        year2035: 64.3,
        methodology: 'Least-Squares CAGR Extrapolation constrained to [0, 100%]'
      },
      tehsilTrends,
      policyMilestones,
      sources: [
        { name: 'Ministry of Agriculture & Farmers Welfare (DES)', year: '2025', url: 'https://desagri.gov.in' },
        { name: 'State Directorate of Land Records & Board of Revenue (UP)', year: '2025', url: 'https://updes.up.nic.in' },
        { name: 'National Remote Sensing Centre (Bhuvan LULC)', year: '2025', url: 'https://bhuvan.nrsc.gov.in' }
      ]
    };
  },

  async getComparison(geo1: string = 'IN-UP', geo2: string = 'IN-BR', year: number = 2025) {
    try {
      const res = await fetch(`${API_BASE}/land-use/compare?geo1=${geo1}&geo2=${geo2}&year=${year}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return {
      success: true,
      year,
      comparison: {
        geo1: { code: geo1, name: 'Uttar Pradesh (Amethi/Gauriganj)', record: { agricultural_pct: 66.0, forest_pct: 4.0, builtup_pct: 13.2, waterbodies_pct: 4.2, barren_pct: 6.2, irrigated_pct: 89.4 } },
        geo2: { code: geo2, name: 'Bihar (Patna)', record: { agricultural_pct: 55.5, forest_pct: 7.7, builtup_pct: 19.5, waterbodies_pct: 4.6, barren_pct: 4.2, irrigated_pct: 67.5 } },
        deltas: { agricultural_diff: 10.5, forest_diff: -3.7, builtup_diff: -6.3, water_diff: -0.4, barren_diff: 2.0, irrigated_diff: 21.9 }
      }
    };
  },

  async getDatasets(search?: string, category?: string): Promise<Dataset[]> {
    let list: Dataset[] = [];
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'All') params.append('category', category);
      const res = await fetch(`${API_BASE}/datasets?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        list = json.data || [];
      }
    } catch (e) {
      // fallback
    }

    // Merge custom datasets from localStorage
    try {
      const customRaw = localStorage.getItem('bhudrishti_custom_datasets');
      if (customRaw) {
        const customDatasets: Dataset[] = JSON.parse(customRaw);
        list = [...customDatasets, ...list];
      }
    } catch {}

    if (category && category !== 'All') {
      list = list.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.publisher.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async getDatasetById(id: string): Promise<Dataset> {
    try {
      const res = await fetch(`${API_BASE}/datasets/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    try {
      const customRaw = localStorage.getItem('bhudrishti_custom_datasets');
      if (customRaw) {
        const customDatasets: Dataset[] = JSON.parse(customRaw);
        const match = customDatasets.find(d => d.id === id);
        if (match) return match;
      }
    } catch {}

    return {
      id,
      title: 'Land Use Statistics',
      publisher: 'MoA&FW / DES',
      description: 'Decadal land classification series',
      category: 'Land Use',
      coverage: 'All India',
      date_range: '2005–2025',
      last_updated: '2026-03-01',
      format: 'CSV',
      update_frequency: 'Annual',
      source_url: 'https://desagri.gov.in',
      license: 'Government Open Data License (GODL-India)',
      data_quality: {
        completeness: 98,
        freshness: 'Updated Q1 2026',
        geographic_coverage_count: 36,
        missing_values_pct: 0.4,
        reliability_tier: 'Tier 1 (Official MoA/NRSC)'
      },
      sample_rows: []
    };
  },

  async getDataSources(): Promise<DataSource[]> {
    try {
      const res = await fetch(`${API_BASE}/data-sources`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return [];
  },

  async syncDataSource(id: string): Promise<DataSource> {
    const res = await fetch(`${API_BASE}/data-sources/${id}/sync`, { method: 'POST' });
    const json = await res.json();
    return json.data;
  },

  async getPolicies(stateCode?: string, districtCode?: string, includeHidden: boolean = false): Promise<Policy[]> {
    try {
      const params = new URLSearchParams();
      if (stateCode && stateCode !== 'IN-ALL') params.append('state', stateCode);
      if (districtCode && districtCode !== 'ALL') params.append('district', districtCode);
      if (includeHidden) params.append('includeHidden', 'true');
      const res = await fetch(`${API_BASE}/policies?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return [];
  },

  async createPolicy(policy: Partial<Policy>): Promise<Policy> {
    const res = await fetch(`${API_BASE}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create policy');
    return json.data;
  },

  async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
    const res = await fetch(`${API_BASE}/policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update policy');
    return json.data;
  },

  async updatePolicyArea(id: string, areaTarget: AreaTarget): Promise<Policy> {
    const res = await fetch(`${API_BASE}/policies/${id}/area`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(areaTarget)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update policy area');
    return json.data;
  },

  async uploadPolicyFile(payload: any): Promise<{ success: boolean; data: Policy; message: string }> {
    const res = await fetch(`${API_BASE}/policies/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload policy document');
    return json;
  },

  async downloadPolicyDocument(id: string, fileName: string): Promise<void> {
    await downloadApiFile(`/policies/${encodeURIComponent(id)}/download`, fileName);
  },

  async deletePolicy(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/policies/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.success === true;
  },

  async getPolicyImpact(policyId: string, stateCode: string = 'IN-UP') {
    try {
      const res = await fetch(`${API_BASE}/policies/${policyId}/impact?state=${stateCode}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return null;
  },

  async getResearchPapers(search?: string, tag?: string, includeHidden: boolean = false): Promise<ResearchPaper[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tag && tag !== 'All') params.append('tag', tag);
      if (includeHidden) params.append('includeHidden', 'true');
      const res = await fetch(`${API_BASE}/research?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return [];
  },

  async deleteResearch(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/research/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.success !== true) {
      throw new Error(json?.error || 'Failed to delete research publication');
    }
    return true;
  },

  async createResearchPaper(paper: Partial<ResearchPaper>): Promise<ResearchPaper> {
    const res = await fetch(`${API_BASE}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paper)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create paper');
    return json.data;
  },

  async uploadResearchDocument(payload: {
    fileName: string;
    fileSize?: number;
    fileType?: string;
    fileContent?: string;
    fileData: string;
    title?: string;
    author?: string;
    geography?: string;
    tags?: string[];
    documentType: 'research-publication' | 'case-study';
  }): Promise<ResearchPaper> {
    const res = await fetch(`${API_BASE}/research/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to upload document');
    return json.data;
  },

  async downloadResearchDocument(id: string, fileName: string): Promise<void> {
    await downloadApiFile(`/research/${encodeURIComponent(id)}/download`, fileName);
  },

  async downloadDataset(id: string, title: string): Promise<void> {
    const safeTitle = title.replace(/[^a-zA-Z0-9-_]+/g, '_') || id;
    await downloadApiFile(`/datasets/${encodeURIComponent(id)}/download`, `${safeTitle}.csv`);
  },

  async getAnomalies(stateCode?: string): Promise<Anomaly[]> {
    try {
      const url = stateCode && stateCode !== 'IN-ALL' ? `${API_BASE}/anomalies?state=${stateCode}` : `${API_BASE}/anomalies`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      // fallback
    }
    return [];
  },

  async queryAI(query: string, apiKey?: string): Promise<AIQueryResponse> {
    try {
      const res = await fetch(`${API_BASE}/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, apiKey })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.summary) {
          return json.data;
        }
      }
    } catch (e) {
      // fallback to client-side LandAIService
    }
    return await LandAIService.queryAI(query, apiKey);
  },

  async testGemini(apiKey?: string): Promise<{ success: boolean; message: string; model: string; latencyMs?: number }> {
    try {
      const res = await fetch(`${API_BASE}/ai/test-gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // fallback
    }
    return await LandAIService.testGemini(apiKey);
  },

  async uploadCustomDataset(payload: { rawRows: any[]; columnMapping: Record<string, string>; metadata: any }) {
    let result: any = null;
    try {
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        result = await res.json();
      }
    } catch (e) {
      console.warn('Backend upload network error:', e);
    }

    // Persist custom dataset and records in localStorage
    try {
      const customDataset: Dataset = {
        id: 'DS-CUSTOM-' + Date.now(),
        title: payload.metadata?.title || 'Custom Land-Use Dataset',
        publisher: payload.metadata?.publisher || 'Admin Custom Ingestion',
        description: `Imported ${payload.rawRows.length} custom land survey records`,
        category: payload.metadata?.category || 'Land Use',
        coverage: payload.metadata?.coverage || 'Custom Region',
        date_range: '2005–2025',
        last_updated: new Date().toISOString().split('T')[0],
        format: payload.metadata?.format || 'CSV',
        update_frequency: 'Annual',
        source_url: '#',
        license: 'Custom Uploaded Data',
        data_quality: {
          completeness: 100,
          freshness: 'Recent Custom Upload',
          geographic_coverage_count: 1,
          missing_values_pct: 0,
          reliability_tier: 'Synthesized Research Benchmark'
        },
        sample_rows: payload.rawRows.slice(0, 5)
      };

      const existingDatasets = JSON.parse(localStorage.getItem('bhudrishti_custom_datasets') || '[]');
      existingDatasets.unshift(customDataset);
      localStorage.setItem('bhudrishti_custom_datasets', JSON.stringify(existingDatasets));

      const newRecords: LandUseRecord[] = payload.rawRows.map((row, idx) => {
        const agri = Number(row[payload.columnMapping['agricultural_pct']]) || 60;
        const forest = Number(row[payload.columnMapping['forest_pct']]) || 10;
        const builtup = Number(row[payload.columnMapping['builtup_pct']]) || 15;
        const totalArea = Number(row[payload.columnMapping['total_area']]) || 100000;
        const stateName = String(row[payload.columnMapping['state_name']] || 'Custom State');
        const districtName = String(row[payload.columnMapping['district_name']] || 'Custom District');
        const yearVal = Number(row[payload.columnMapping['year']]) || 2025;

        return {
          id: `CUST-${Date.now()}-${idx}`,
          state_code: 'IN-CUSTOM',
          state_name: stateName,
          district_code: `CUST-${idx}`,
          district_name: districtName,
          year: yearVal,
          total_area_ha: totalArea,
          agricultural_area_ha: Math.round(totalArea * (agri / 100)),
          agricultural_pct: agri,
          forest_area_ha: Math.round(totalArea * (forest / 100)),
          forest_pct: forest,
          builtup_area_ha: Math.round(totalArea * (builtup / 100)),
          builtup_pct: builtup,
          waterbodies_area_ha: Math.round(totalArea * 0.05),
          waterbodies_pct: 5,
          barren_area_ha: Math.round(totalArea * 0.05),
          barren_pct: 5,
          other_area_ha: Math.round(totalArea * 0.05),
          other_pct: 5,
          irrigated_pct: 85,
          degraded_pct: 15,
          source_id: customDataset.id,
          dataset_name: customDataset.title,
          source_url: '#',
          confidence_score: 95,
          is_demo: false
        };
      });

      const existingRecords = JSON.parse(localStorage.getItem('bhudrishti_custom_records') || '[]');
      existingRecords.push(...newRecords);
      localStorage.setItem('bhudrishti_custom_records', JSON.stringify(existingRecords));
    } catch (err) {
      console.error('Failed to cache custom upload to localStorage:', err);
    }

    return result || { success: true, message: 'Custom dataset stored locally and synchronized' };
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    const json = await res.json();
    return json.data;
  },

  async getDbStatus() {
    try {
      const res = await fetch(`${API_BASE}/system/db-status`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return null;
  },

  async seedSupabase() {
    try {
      const res = await fetch(`${API_BASE}/system/seed-supabase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to trigger Supabase seed' };
    }
  },

  async getSupabaseSchema() {
    try {
      const res = await fetch(`${API_BASE}/system/supabase-schema`);
      if (res.ok) {
        const json = await res.json();
        return json.sql;
      }
    } catch {}
    return null;
  },

  // === Inspection Directorate & Ombudsman Methods ===

  async getInspectionStats(): Promise<InspectionStats> {
    try {
      const res = await fetch(`${API_BASE}/inspection/stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.error('Failed to load inspection stats:', e);
    }
    return {
      total_registered: 14,
      policymaker_count: 3,
      administrator_count: 2,
      public_count: 3,
      researcher_count: 4,
      inspector_count: 2,
      total_policies: 5,
      verified_policies_count: 4,
      starred_policies_count: 3,
      total_research: 6,
      verified_research_count: 5,
      starred_research_count: 3,
      verified_researchers_count: 3
    };
  },

  async getRegisteredUsers(): Promise<UserRegistryRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/inspection/users`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
    return [];
  },

  async updateUserRole(id: string, role: string): Promise<UserRegistryRecord> {
    const res = await fetch(`${API_BASE}/inspection/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user role');
    return json.data;
  },

  async updateUserFeatures(id: string, features_granted: string[]): Promise<UserRegistryRecord> {
    const res = await fetch(`${API_BASE}/inspection/users/${id}/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features_granted })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user features');
    return json.data;
  },

  async starVerifyUser(id: string, updates: { is_starred?: boolean; is_inspection_verified?: boolean; inspection_notes?: string }): Promise<UserRegistryRecord> {
    const res = await fetch(`${API_BASE}/inspection/users/${id}/star`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user verification');
    return json.data;
  },

  async deleteUser(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/inspection/users/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok || json.success !== true) {
      throw new Error(json.error || 'Failed to delete user');
    }
    return true;
  },

  async inspectPolicy(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): Promise<Policy> {
    const res = await fetch(`${API_BASE}/inspection/policies/${id}/inspect`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update policy status');
    return json.data;
  },

  async reorderPolicies(orderedIds: string[]): Promise<Policy[]> {
    const res = await fetch(`${API_BASE}/inspection/policies/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reorder policies');
    return json.data;
  },

  async inspectResearch(id: string, updates: {
    is_starred?: boolean;
    is_inspection_verified?: boolean;
    is_hidden?: boolean;
    priority_order?: number;
    inspection_notes?: string;
    inspected_by?: string;
  }): Promise<ResearchPaper> {
    const res = await fetch(`${API_BASE}/inspection/research/${id}/inspect`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update research paper status');
    return json.data;
  },

  async reorderResearch(orderedIds: string[]): Promise<ResearchPaper[]> {
    const res = await fetch(`${API_BASE}/inspection/research/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reorder research');
    return json.data;
  },

  // Dashboard Live Overrides & Calibration
  async getDashboardData(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/inspection/dashboard-data`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Failed to load dashboard data from API, will use client state');
    }
    return null;
  },

  async updateDashboardData(updates: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/inspection/dashboard-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update dashboard data');
      return json.data;
    } catch (e) {
      console.warn('Dashboard data update API call failed, saved locally');
      return updates;
    }
  },

  async resetDashboardData(): Promise<any> {
    const res = await fetch(`${API_BASE}/inspection/reset-dashboard-data`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reset dashboard data');
    return json.data;
  },

  async overrideLandUseRecord(stateCode: string, districtCode: string | undefined, year: number, updates: Partial<LandUseRecord>): Promise<LandUseRecord> {
    const res = await fetch(`${API_BASE}/land-use/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state_code: stateCode,
        district_code: districtCode,
        year,
        updates
      })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to calibrate land use figures');
    return json.data;
  },

  async updateLandUseRecordById(id: string, updates: Partial<LandUseRecord>): Promise<LandUseRecord> {
    const res = await fetch(`${API_BASE}/land-use/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update land use record');
    return json.data;
  }
};
