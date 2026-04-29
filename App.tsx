import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Copilot from './components/Copilot';
import DataExplainer from './components/DataExplainer';
import RiskRadar from './components/RiskRadar';
import MarketIntel from './components/MarketIntel';
import StrategyVision from './components/StrategyVision';
import LoginPage from './components/LoginPage';
import ForecastLab from './components/ForecastLab';
import CampaignFactory from './components/CampaignFactory';
import AudienceMatrix from './components/AudienceMatrix';
import ScenarioEngine from './components/ScenarioEngine';
import FeaturesHub from './components/FeaturesHub';
import SystemBriefing from './components/SystemBriefing';
import EnvironmentChecker from './components/EnvironmentChecker';
import ProductComparison from './components/ProductComparison';
import { AppState } from './types';
import { INITIAL_STATE } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<{ name: string; email: string; avatar: string; isDemo?: boolean } | null>(null);

  /* =========================
     SAFE INITIAL STATE LOAD
  ========================= */
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('marketmind_state');
      const initial = { ...INITIAL_STATE, productAnalysis: [] };
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return { ...INITIAL_STATE, productAnalysis: [] };
    }
  });

  /* =========================
     CENTRAL STATE UPDATER
  ========================= */
  const updateState = (
    updater: Partial<AppState> | ((prev: AppState) => AppState)
  ) => {
    if (typeof updater === 'function') {
      setState(updater);
    } else {
      setState(prev => ({ ...prev, ...updater }));
    }
  };

  /* =========================
     SAFE DEMO CSV INJECTION
  ========================= */
  useEffect(() => {
    setState(prev => {
      if (!prev.rawCsv || prev.rawCsv.trim() === '') {
        return {
          ...prev,
          rawCsv: `Product,Revenue,Forecast,Growth,Status
CloudSync,120000,150000,+25%,trending
DataPulse,90000,70000,-8%,declining
AdIntel,60000,90000,+18%,stable`
        };
      }
      return prev;
    });
  }, []);

  /* =========================
     ENV CHECK
  ========================= */
  const isMockMode =
    !import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_GROQ_API_KEY === '';

  /* =========================
     PERSIST STATE
  ========================= */
  useEffect(() => {
    try {
      localStorage.setItem('marketmind_state', JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const handleLogin = (userData: { name: string; email: string; avatar: string; isDemo?: boolean }) => {
    setUser(userData);
    setIsAuthenticated(true);
    if (userData.isDemo) setActiveTab('briefing');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'briefing': return <SystemBriefing setActiveTab={setActiveTab} />;
      case 'hub': return <FeaturesHub setActiveTab={setActiveTab} />;
      case 'dashboard': return <Dashboard state={state} updateState={updateState} />;
      case 'products': return <ProductComparison state={state} updateState={updateState} />;
      case 'forecast': return <ForecastLab state={state} />;
      case 'campaigns': return <CampaignFactory state={state} updateState={updateState} />;
      case 'segments': return <AudienceMatrix state={state} updateState={updateState} />;
      case 'simulator': return <ScenarioEngine state={state} />;
      case 'synexia': return <Copilot state={state} />;
      case 'explainer': return <DataExplainer state={state} updateState={updateState} />;
      case 'vision': return <StrategyVision state={state} />;
      case 'risk': return <RiskRadar state={state} updateState={updateState} />;
      case 'market': return <MarketIntel />;
      default: return <Dashboard state={state} updateState={updateState} />;
    }
  };

  return (
    <>
      <EnvironmentChecker />

      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />

          <main className="flex-1 overflow-y-auto bg-[#020617] relative">
            <div className="absolute inset-0 cyber-grid opacity-40 pointer-events-none"></div>

            <div className="ticker-wrap relative z-10">
              <div className="ticker flex gap-20 py-3">
                {isMockMode && (
                  <span className="text-[10px] font-black text-amber-500 uppercase">
                    ⚠ DEMO MODE (NO API KEY)
                  </span>
                )}
                <span className="text-[10px] font-black text-cyan-400 uppercase">
                  MARKET VOLATILITY: LOW
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  SESSION: {user?.email}
                </span>
              </div>
            </div>

            <div className="max-w-7xl mx-auto p-12 relative z-10">
              {renderContent()}
            </div>
          </main>
        </div>
      )}
    </>
  );
};

export default App;