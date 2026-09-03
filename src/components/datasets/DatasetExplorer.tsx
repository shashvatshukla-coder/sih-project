import React, { useState, useEffect } from 'react';
import { Dataset } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Check
} from 'lucide-react';
import { DatasetPreviewModal } from './DatasetPreviewModal';
import { DataQualityBadge } from '../common/DataQualityBadge';

export const DatasetExplorer: React.FC = () => {
  const { runAIQuery, saveItem, isSaved } = useApp();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);

  useEffect(() => {
    async function loadDatasets() {
      try {
        setLoading(true);
        const data = await api.getDatasets(searchQuery, selectedCategory);
        setDatasets(data || []);
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDatasets();
  }, [searchQuery, selectedCategory]);

  const categories = ['All', 'Land Use', 'Agriculture', 'Forestry', 'Satellite / Remote Sensing'];
  const formats = ['All', 'CSV', 'JSON', 'GeoJSON', 'XLSX', 'API'];

  const filtered = datasets.filter(d =>
    selectedFormat === 'All' || d.format.toLowerCase() === selectedFormat.toLowerCase()
  );

  const handleRunAI = (dataset: Dataset) => {
    runAIQuery(`Analyze key trends and statistical anomalies in dataset: ${dataset.title}`);
  };

  const handleSave = (dataset: Dataset) => {
    saveItem({
      id: dataset.id,
      type: 'dataset',
      title: dataset.title,
      subtitle: dataset.publisher,
      data: dataset
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Search Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>National Open Data Repository</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Search Land-Use, Agricultural, Remote Sensing & Cadastral Datasets
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {filtered.length} Datasets Available
          </span>
        </div>

        {/* Search Bar & Multi-facet Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search datasets by title, publisher, keywords, ministry..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {formats.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Cards Grid */}
      <div className="space-y-4">
        {filtered.map(dataset => {
          const saved = isSaved(dataset.id);
          return (
            <div
              key={dataset.id}
              className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      {dataset.format}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      Publisher: {dataset.publisher}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {dataset.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSave(dataset)}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                      saved
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                    title={saved ? 'Saved in Workspace' : 'Save to Workspace'}
                  >
                    {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setPreviewDataset(dataset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Data</span>
                  </button>

                  <button
                    onClick={() => handleRunAI(dataset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Run AI Analysis</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {dataset.description}
              </p>

              {/* Metadata Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Coverage</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{dataset.coverage}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Temporal Range</span>
                  <div className="font-mono text-slate-800 dark:text-slate-200">{dataset.date_range}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Update Frequency</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{dataset.update_frequency}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Quality Tier</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">{dataset.data_quality.reliability_tier}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview Modal */}
      {previewDataset && (
        <DatasetPreviewModal
          dataset={previewDataset}
          onClose={() => setPreviewDataset(null)}
        />
      )}
    </div>
  );
};
