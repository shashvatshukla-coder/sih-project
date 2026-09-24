import type { District, State } from '../../types';

export type GeoLocationType = 'country' | 'state' | 'district' | 'village';

export interface GeoLocation {
  id: string;
  sourceId: string;
  parentId?: string;
  name: string;
  type: GeoLocationType;
  latitude: number;
  longitude: number;
  region?: string;
  availableData: string[];
  source: 'BHU-DRISHTI location catalogue';
}

export const INDIA_LOCATION: GeoLocation = {
  id: 'country-IN',
  sourceId: 'IN-ALL',
  name: 'India',
  type: 'country',
  latitude: 20.5937,
  longitude: 78.9629,
  availableData: ['State catalogue', 'Land-use records', 'Regional comparisons', 'Research and policy evidence'],
  source: 'BHU-DRISHTI location catalogue'
};

const stateDataViews = ['Land-use trends', 'Agricultural land', 'Forest area', 'Urban expansion'];
const districtDataViews = ['District land records', 'Land-use trends', 'Agricultural land', 'Map explorer'];

export function statesToGeoLocations(states: State[]): GeoLocation[] {
  return states
    .filter((state) => state.state_code !== 'IN-ALL')
    .filter((state) => Number.isFinite(state.center_coords?.[0]) && Number.isFinite(state.center_coords?.[1]))
    .map((state) => ({
      id: `state-${state.state_code}`,
      sourceId: state.state_code,
      parentId: INDIA_LOCATION.id,
      name: state.state_name,
      type: 'state',
      latitude: state.center_coords[0],
      longitude: state.center_coords[1],
      region: state.region,
      availableData: stateDataViews,
      source: 'BHU-DRISHTI location catalogue'
    }));
}

export function districtsToGeoLocations(districts: District[]): GeoLocation[] {
  return districts
    .filter((district) => Number.isFinite(district.center_coords?.[0]) && Number.isFinite(district.center_coords?.[1]))
    .map((district) => ({
      id: `district-${district.district_code}`,
      sourceId: district.district_code,
      parentId: `state-${district.state_code}`,
      name: district.district_name,
      type: 'district',
      latitude: district.center_coords[0],
      longitude: district.center_coords[1],
      region: district.state_name,
      availableData: districtDataViews,
      source: 'BHU-DRISHTI location catalogue'
    }));
}

export function buildGlobeLocations(states: State[], districts: District[]): GeoLocation[] {
  return [INDIA_LOCATION, ...statesToGeoLocations(states), ...districtsToGeoLocations(districts)];
}
