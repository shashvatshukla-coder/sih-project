import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Upload, Database, Layers, Clock, AlertTriangle, FileText, CheckCircle2, RefreshCw, Copy, Check, Server } from 'lucide-react';
import { DataUploadPipeline } from './DataUploadPipeline';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'database' | 'audit'>('overview');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [sqlSchema, setSqlSchema] = useState<string>('');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [logs, srcs, dbStat, schema] = await Promise.all([
          api.getAuditLogs(),
          api.getDataSources(),
          api.getDbStatus(),
          api.getSupabaseSchema()
        ]);
        setAuditLogs(logs || []);
        setSources(srcs || []);
        setDbStatus(dbStat);
        if (schema) setSqlSchema(schema);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadAdminData();
  }, []);

  const handleSeedSupabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.seedSupabase();
      setSeedResult(res);
      const updatedStatus = await api.getDbStatus();
      setDbStatus(updatedStatus);
    } catch (err: any) {
      setSeedResult({ success: false, message: err?.message || 'Error occurred' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopySchema = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

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
            System Ingestion Pipelines, Schema Mappers & Database Sync
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
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'database'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase & Storage</span>
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

      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Supabase & Cloud DB Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Supabase & Cloud Database Integration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active Storage Provider: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dbStatus?.type || 'Hybrid In-Memory + Cloud Engine'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedSupabase}
                  disabled={isSeeding}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                  <span>{isSeeding ? 'Syncing...' : 'Sync / Seed to Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Seed Result Alert */}
            {seedResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                seedResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              }`}>
                {seedResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                <div>
                  <div className="font-semibold">{seedResult.message}</div>
                  {seedResult.details && (
                    <div className="text-[11px] mt-1 font-mono">
                      States: {seedResult.details.states} | Districts: {seedResult.details.districts} | Records: {seedResult.details.records}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metric Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Supabase REST Status</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dbStatus?.supabase_connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{dbStatus?.supabase_connected ? 'Connected' : (dbStatus?.supabase_configured ? 'Configured' : 'Ready (Local Cache Active)')}</span>
                </div>
                {dbStatus?.supabase_url && (
                  <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">{dbStatus.supabase_url}</div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">PostgreSQL Pooler</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dbStatus?.postgres_connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span>{dbStatus?.postgres_connected ? 'Active Pool' : (dbStatus?.postgres_configured ? 'Configured' : 'Standby')}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Available Records</span>
                <div className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">
                  {dbStatus?.total_records?.toLocaleString() || '744,900'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Districts & States</span>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {dbStatus?.total_districts || 11} Dists / {dbStatus?.total_states || 10} States
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Schema Migration Guide & Script */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Supabase SQL Schema Migration
                </h3>
                <p className="text-xs text-slate-500">
                  Run this SQL in your Supabase project SQL Editor to create tables with automated RLS policies.
                </p>
              </div>

              <button
                onClick={handleCopySchema}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-64 scrollbar-thin">
                {sqlSchema || '-- Run server/db/supabase-schema.sql in Supabase SQL Editor'}
              </pre>
            </div>
          </div>
        </div>
      )}

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
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Database Engine</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                {dbStatus?.type || 'In-Memory Cache'}
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
