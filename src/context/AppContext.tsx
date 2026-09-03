import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  State,
  District,
  LandUseRecord,
  LandCategory,
  UserRole,
  PageId,
  AIQueryResponse,
  Dataset,
  ResearchPaper,
  Policy
} from '../types';
import { api } from '../services/api';

export interface SavedItem {
  id: string;
  type: 'analysis' | 'dataset' | 'paper' | 'policy';
  title: string;
  subtitle: string;
  timestamp: string;
  data: any;
}

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  selectedState: string;
  setSelectedState: (stateCode: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (districtCode: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedCategory: LandCategory;
  setSelectedCategory: (cat: LandCategory) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  states: State[];
  districts: District[];
  allDistricts: District[];
  currentRecord: LandUseRecord | null;
  loading: boolean;
  savedItems: SavedItem[];
  saveItem: (item: Omit<SavedItem, 'timestamp'>) => void;
  removeItem: (id: string) => void;
  isSaved: (id: string) => boolean;
  activeAIQuery: string;
  setActiveAIQuery: (q: string) => void;
  aiResponse: AIQueryResponse | null;
  setAIResponse: (resp: AIQueryResponse | null) => void;
  runAIQuery: (queryText: string) => Promise<void>;
  aiLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selectedState, setSelectedState] = useState<string>('IN-UP');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedCategory, setSelectedCategory] = useState<LandCategory>('agricultural');
  const [userRole, setUserRole] = useState<UserRole>('policymaker');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [states, setStates] = useState<State[]>([]);
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [currentRecord, setCurrentRecord] = useState<LandUseRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [savedItems, setSavedItems] = useState<SavedItem[]>([
    {
      id: 'DS-DES-LUS',
      type: 'dataset',
      title: 'Land Use Statistics At A Glance',
      subtitle: 'MoA&FW / DES Official Series',
      timestamp: '2026-03-01',
      data: {}
    },
    {
      id: 'PAP-001',
      type: 'paper',
      title: 'Decadal Spatio-Temporal Dynamics of Agricultural Land Conversion',
      subtitle: 'Sharma et al., 2024 (Springer)',
      timestamp: '2026-02-28',
      data: {}
    }
  ]);

  const [activeAIQuery, setActiveAIQuery] = useState<string>('UP mein agricultural land-use ka trend kya hai?');
  const [aiResponse, setAIResponse] = useState<AIQueryResponse | null>(null);
  const [aiLoading, setAILoading] = useState<boolean>(false);

  useEffect(() => {
    // Theme setup
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  // Initial load of states and districts
  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoading(true);
        const [statesData, allDistrictsData] = await Promise.all([
          api.getStates(),
          api.getDistricts()
        ]);
        setStates(statesData || []);
        setAllDistricts(allDistrictsData || []);
      } catch (err) {
        console.error('Failed to load initial metadata:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, []);

  // Update districts when selected state changes
  useEffect(() => {
    if (selectedState && selectedState !== 'IN-ALL') {
      const filtered = allDistricts.filter(d => d.state_code.toLowerCase() === selectedState.toLowerCase());
      setDistricts(filtered);
    } else {
      setDistricts(allDistricts);
    }
    setSelectedDistrict('ALL');
  }, [selectedState, allDistricts]);

  // Load current record
  useEffect(() => {
    async function fetchRecord() {
      try {
        const records = await api.getLandUseRecords({
          state_code: selectedState,
          district_code: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
          year: selectedYear
        });
        if (records && records.length > 0) {
          setCurrentRecord(records[0]);
        } else {
          // Fallback to closest record
          const fallback = await api.getLandUseRecords({
            state_code: selectedState,
            district_code: selectedDistrict !== 'ALL' ? selectedDistrict : undefined
          });
          setCurrentRecord(fallback[0] || null);
        }
      } catch (err) {
        console.error('Failed to fetch current record:', err);
      }
    }
    fetchRecord();
  }, [selectedState, selectedDistrict, selectedYear]);

  const saveItem = (item: Omit<SavedItem, 'timestamp'>) => {
    if (savedItems.some(i => i.id === item.id)) return;
    setSavedItems(prev => [{ ...item, timestamp: new Date().toISOString().split('T')[0] }, ...prev]);
  };

  const removeItem = (id: string) => {
    setSavedItems(prev => prev.filter(i => i.id !== id));
  };

  const isSaved = (id: string) => savedItems.some(i => i.id === id);

  const runAIQuery = async (queryText: string) => {
    try {
      setAILoading(true);
      setActiveAIQuery(queryText);
      const resp = await api.queryAI(queryText);
      setAIResponse(resp);
      setActivePage('ai-query');
    } catch (err) {
      console.error('AI Query Error:', err);
    } finally {
      setAILoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        selectedYear,
        setSelectedYear,
        selectedCategory,
        setSelectedCategory,
        userRole,
        setUserRole,
        isDarkMode,
        toggleDarkMode,
        isSearchOpen,
        setIsSearchOpen,
        states,
        districts,
        allDistricts,
        currentRecord,
        loading,
        savedItems,
        saveItem,
        removeItem,
        isSaved,
        activeAIQuery,
        setActiveAIQuery,
        aiResponse,
        setAIResponse,
        runAIQuery,
        aiLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
