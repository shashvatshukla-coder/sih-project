import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppSidebar } from './components/layout/AppSidebar';
import { TopHeader } from './components/layout/TopHeader';
import { FilterBar } from './components/layout/FilterBar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { ResearcherIdCardModal } from './components/auth/ResearcherIdCardModal';

// Views
import { HomePage } from './pages/HomePage';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { LandStatisticsView } from './components/statistics/LandStatisticsView';
import { IndiaMapExplorer } from './components/maps/IndiaMapExplorer';
import { DatasetExplorer } from './components/datasets/DatasetExplorer';
import { TrendAnalysisView } from './components/analysis/TrendAnalysisView';
import { AskLandAI } from './components/ai/AskLandAI';
import { AnomalyDetectionView } from './components/ai/AnomalyDetectionView';
import { LandUseChangeView } from './components/analysis/LandUseChangeView';
import { ComparisonTool } from './components/analysis/ComparisonTool';
import { PolicyImpactAnalyzer } from './components/policy/PolicyImpactAnalyzer';
import { PolicyDecisionDashboard } from './components/policy/PolicyDecisionDashboard';
import { PolicyRepository } from './components/policy/PolicyRepository';
import { ResearchLibrary } from './components/research/ResearchLibrary';
import { DataIntegrationHub } from './components/datasets/DataIntegrationHub';
import { ReportGenerator } from './components/reports/ReportGenerator';
import { MyWorkspace } from './components/workspace/MyWorkspace';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InspectionDashboard } from './components/admin/InspectionDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from './components/common/BrandLogo';
import { LoadingSplash } from './components/common/LoadingSplash';

const AppContent: React.FC = () => {
  const { activePage } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  // Determine if filter bar should be shown (kept clean on dashboard)
  const showFilterBar = ['statistics', 'trends', 'change', 'comparison'].includes(activePage);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Animated First Loading Splash Screen */}
      {showSplash && (
        <LoadingSplash onComplete={() => setShowSplash(false)} />
      )}

      {/* Sidebar Navigation */}
      <AppSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileDrawerOpen}
        setMobileOpen={setMobileDrawerOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Top Header */}
        <TopHeader
          collapsed={sidebarCollapsed}
          onOpenMobile={() => setMobileDrawerOpen(true)}
        />

        {/* Filter Bar */}
        {showFilterBar && <FilterBar />}

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'home' && <ExecutiveDashboard />}
          {activePage === 'dashboard' && <ExecutiveDashboard />}
          {activePage === 'statistics' && <LandStatisticsView />}
          {activePage === 'map' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Interactive Geospatial Map Explorer
                </h2>
                <p className="text-xs text-slate-500">
                  Select layers, play 2005–2025 timeline, and click any state to inspect district breakdowns.
                </p>
              </div>
              <IndiaMapExplorer />
            </div>
          )}
          {activePage === 'datasets' && <DatasetExplorer />}
          {activePage === 'trends' && <TrendAnalysisView />}
          {activePage === 'ai-query' && <AskLandAI />}
          {activePage === 'anomalies' && <AnomalyDetectionView />}
          {activePage === 'change' && <LandUseChangeView />}
          {activePage === 'comparison' && <ComparisonTool />}
          {activePage === 'policy' && <PolicyImpactAnalyzer />}
          {activePage === 'policies' && <PolicyRepository />}
          {activePage === 'decision-support' && <PolicyDecisionDashboard />}
          {activePage === 'research' && <ResearchLibrary />}
          {activePage === 'case-studies' && <ResearchLibrary />}
          {activePage === 'collaboration' && <MyWorkspace />}
          {activePage === 'news-events' && <ReportGenerator />}
          {activePage === 'integration' && <DataIntegrationHub />}
          {activePage === 'reports' && <ReportGenerator />}
          {activePage === 'workspace' && <MyWorkspace />}
          {activePage === 'admin' && <AdminDashboard />}
          {activePage === 'inspection' && <InspectionDashboard />}
          {activePage === 'login' && <LoginPage />}
        </main>

        {/* Standard Government Research Platform Footer */}
        <footer className="mt-auto py-6 px-4 md:px-8 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-500 text-left backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <BrandLogo variant="horizontal" size="sm" showMotto={true} />
              <p className="text-[11px] text-slate-400 pl-1">
                Adhering to MoA&FW 9-fold land classification standard and GODL India Open Data Guidelines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Ground-Truth Intelligence
              </span>
              <span>•</span>
              <button
                onClick={() => setShowSplash(true)}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors underline cursor-pointer"
              >
                Replay Intro Splash
              </button>
              <span>•</span>
              <span>Version 1.0.0 (Research Edition)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Cmd+K Global Search Modal */}
      <GlobalSearchModal />

      {/* Google Authentication & Researcher Verification Modal */}
      <GoogleAuthModal />

      {/* Dedicated Researcher Institutional ID Card Modal */}
      <ResearcherIdCardModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
