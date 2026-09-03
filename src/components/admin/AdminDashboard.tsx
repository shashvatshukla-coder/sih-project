import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Upload, Database, Layers, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { DataUploadPipeline } from './DataUploadPipeline';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'audit'>('overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [logs, srcs] = await Promise.all([
          api.getAuditLogs(),
          api.getDataSources()
        ]);
        setAuditLogs(logs || []);
        setSources(srcs || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadAdminData();
  }, []);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrative Ingestion & Provenance Console</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            System Ingestion Pipelines, Schema Mappers & Audit Trails
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            System Metrics
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest New Dataset</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {activeTab === 'upload' && <DataUploadPipeline onComplete={() => setActiveTab('overview')} />}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Ingested Datasets</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                6 Repositories
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Connected Government Sources</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                5 Active
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Normalized Records</span>
              <div className="text-2xl font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">
                744,900
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Failed / Rejected Ingests</span>
              <div className="text-2xl font-bold font-mono text-slate-500 mt-1">
                0 Errors
              </div>
            </div>
          </div>

          {/* Sources Summary Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Live Data Source Connectors
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Gateway Name</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 font-mono">Total Records</th>
                    <th className="py-2 px-3">Last Synchronized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sources.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{s.records_imported.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{s.last_synced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            System Data Provenance & Audit Trail
          </h3>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <div className="text-slate-400 py-6 text-center">No recent audit logs available.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold font-mono text-brand-600 dark:text-brand-400 uppercase text-[11px]">{log.action}</span>
                    <span className="text-slate-400 ml-2">by {log.actor}</span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{JSON.stringify(log.details)}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp.split('T')[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
