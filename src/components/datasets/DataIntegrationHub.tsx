import React, { useState, useEffect } from 'react';
import { DataSource } from '../../types';
import { api } from '../../services/api';
import { Layers, RefreshCw, CheckCircle2, Clock, AlertCircle, ShieldCheck, Database } from 'lucide-react';

export const DataIntegrationHub: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      try {
        setLoading(true);
        const data = await api.getDataSources();
        setSources(data || []);
      } catch (err) {
        console.error('Failed to load data sources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  const handleSync = async (id: string) => {
    try {
      setSyncingId(id);
      await api.syncDataSource(id);
      const updated = await api.getDataSources();
      setSources(updated);
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setTimeout(() => setSyncingId(null), 1000);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Government Data Gateway & Ingestion Connectors</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Connected Live Government Sources & Schema Adapters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Automated adapter architecture normalizing disparate state and central statistical repositories into a unified 9-fold geospatial database.
          </p>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(src => {
          const isConnected = src.status === 'Connected';
          const isSyncing = syncingId === src.id;

          return (
            <div
              key={src.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {src.adapter_type}
                  </span>
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isConnected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{src.status}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {src.name}
                </h3>
                <span className="text-xs text-slate-400 block">{src.category}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Datasets</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {src.datasets_count}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium">Records Synced</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {src.records_imported.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Footer / Sync Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  Last: {src.last_synced.split(' ')[0]}
                </span>
                <button
                  onClick={() => handleSync(src.id)}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
