import React, { useEffect, useMemo, useState } from 'react';
import { DataSource } from '../../types';
import { api } from '../../services/api';
import { readFileAsDataUrl, validateUploadFile } from '../../lib/files';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';

const sourceCategories = [
  'Government Portal',
  'Satellite / GIS Source',
  'Research Repository',
  'Field Survey',
  'Other'
];

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DataIntegrationHub: React.FC = () => {
  const { setActivePage } = useApp();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(sourceCategories[0]);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submittedSources = useMemo(
    () => sources.filter(source => source.is_user_uploaded),
    [sources]
  );

  const loadSources = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDataSources();
      setSources(data || []);
    } catch (err: any) {
      setError(err.message || 'Sources could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const selectFile = (selected: File) => {
    const validationError = validateUploadFile(selected);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setFile(selected);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Source name is required.');
      return;
    }
    if (!endpointUrl.trim() && !file) {
      setError('Add a source link, a supporting file, or both.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const fileData = file ? await readFileAsDataUrl(file) : undefined;
      const created = await api.uploadDataSource({
        name: name.trim(),
        category,
        description: description.trim(),
        endpointUrl: endpointUrl.trim(),
        fileName: file?.name,
        fileType: file?.type,
        fileData
      });

      setSources(previous => [created, ...previous.filter(source => source.id !== created.id)]);
      setName('');
      setCategory(sourceCategories[0]);
      setEndpointUrl('');
      setDescription('');
      setFile(null);
      setFileInputKey(previous => previous + 1);
      setSuccess('Source saved. It will remain available after refresh and is ready for validation.');
    } catch (err: any) {
      setError(err.message || 'Source could not be uploaded.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnect = async (id: string) => {
    try {
      setSyncingId(id);
      setError('');
      const updated = await api.syncDataSource(id);
      setSources(previous => previous.map(source => source.id === id ? updated : source));
      setSuccess(`${updated.name} is now connected.`);
    } catch (err: any) {
      setError(err.message || 'Source could not be connected.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (source: DataSource) => {
    if (!window.confirm(`Remove “${source.name}” and its uploaded file?`)) return;
    try {
      setDeletingId(source.id);
      setError('');
      await api.deleteDataSource(source.id);
      setSources(previous => previous.filter(item => item.id !== source.id));
      setSuccess('Source removed successfully.');
    } catch (err: any) {
      setError(err.message || 'Source could not be removed.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className="mt-0.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Hidden evidence registry</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Validated Sources</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Add an authoritative source link, upload its supporting document, or provide both. New submissions stay pending until connected to the evidence pipeline.
              </p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
            <span className="block text-lg font-black text-center">{submittedSources.length}</span>
            <span className="block text-[10px] font-bold uppercase tracking-wide">Submitted sources</span>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={`px-4 py-3 rounded-xl border text-sm font-semibold ${
          error
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
        }`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload a source</h2>
              <p className="text-[11px] text-slate-500">Link or file is required; both may be added.</p>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Source name *</span>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. UP Bhulekh land record portal"
              maxLength={160}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</span>
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-emerald-500"
            >
              {sourceCategories.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Source link</span>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={endpointUrl}
                onChange={event => setEndpointUrl(event.target.value)}
                placeholder="https://official-source.gov.in/..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes</span>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Custodian, geography, reporting year, licence or validation notes"
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm outline-none resize-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </label>

          <div
            onDragOver={event => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={event => {
              event.preventDefault();
              setIsDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) selectFile(dropped);
            }}
            className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFileInputKey(previous => previous + 1);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer text-center">
                <UploadCloud className="w-6 h-6 text-emerald-600 mx-auto" />
                <span className="block mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">Drop a supporting file or browse</span>
                <span className="block mt-1 text-[10px] text-slate-500">PDF, document, image, CSV, JSON, GIS or ZIP • max 25 MB</span>
                <input
                  key={fileInputKey}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.json,.geojson,.xlsx,.xls,.zip,.kml,.kmz,image/*"
                  onChange={event => {
                    const selected = event.target.files?.[0];
                    if (selected) selectFile(selected);
                  }}
                />
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{submitting ? 'Saving source...' : 'Submit for validation'}</span>
          </button>
        </form>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your submitted sources</h2>
              <p className="text-[11px] text-slate-500">Saved in the persistent evidence registry.</p>
            </div>
            <button
              type="button"
              onClick={loadSources}
              disabled={loading}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="min-h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : submittedSources.length === 0 ? (
            <div className="min-h-64 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No submitted source yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">Use the form to add the first traceable link or supporting document. Prototype connector records are not shown here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submittedSources.map(source => {
                const connected = source.status === 'Connected';
                const syncing = syncingId === source.id;
                const deleting = deletingId === source.id;
                return (
                  <article
                    key={source.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white break-words">{source.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">{source.category}</span>
                            <span className="font-mono text-slate-400">{source.adapter_type}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        connected
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {connected ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {connected ? 'Connected' : 'Pending validation'}
                      </span>
                    </div>

                    {source.description && (
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{source.description}</p>
                    )}

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {source.endpoint_url && (
                        <a
                          href={source.endpoint_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 flex items-center gap-2 min-w-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Open source link</span>
                        </a>
                      )}
                      {source.fileAttachment && (
                        <button
                          type="button"
                          onClick={() => api.downloadDataSourceDocument(source.id, source.fileAttachment!.name).catch(err => setError(err.message))}
                          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-400 flex items-center gap-2 min-w-0"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{source.fileAttachment.name}</span>
                          <span className="ml-auto text-[9px] text-slate-400 shrink-0">{formatFileSize(source.fileAttachment.size)}</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{source.last_synced}</span>
                      <div className="flex items-center gap-2">
                        {!connected && (
                          <button
                            type="button"
                            onClick={() => handleConnect(source.id)}
                            disabled={syncing || deleting}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Connecting...' : 'Connect source'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(source)}
                          disabled={deleting || syncing}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                          title="Delete source"
                        >
                          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
