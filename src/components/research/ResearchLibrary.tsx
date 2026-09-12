import React, { useState, useEffect } from 'react';
import { ResearchPaper } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Sparkles,
  ExternalLink,
  Bookmark,
  Check,
  Copy,
  FileText,
  UploadCloud,
  FileEdit,
  ShieldCheck,
  Fingerprint,
  PlusCircle,
  Award,
  Layers
} from 'lucide-react';
import { ResearchUploadModal } from './ResearchUploadModal';
import { ResearchWriterStudio } from './ResearchWriterStudio';

export const ResearchLibrary: React.FC = () => {
  const { saveItem, isSaved, runAIQuery, userProfile, dedicatedFixedId, setIsAuthModalOpen, setIsIdCardModalOpen } = useApp();
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Active view: 'catalog' | 'author' | 'upload'
  const [activeTab, setActiveTab] = useState<'catalog' | 'author' | 'upload'>('catalog');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    async function loadPapers() {
      try {
        setLoading(true);
        const data = await api.getResearchPapers(searchQuery, selectedTag);
        setPapers(data || []);
      } catch (err) {
        console.error('Failed to load papers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, [searchQuery, selectedTag]);

  const tags = ['All', 'Indo-Gangetic Plain', 'DILRMP', 'PMKSY', 'Cadastral Maps', 'Urban Sprawl', 'Sodic Reclamation', 'Uploaded Paper'];

  const handleCopyCitation = (paper: ResearchPaper) => {
    navigator.clipboard.writeText(paper.citation_apa);
    setCopiedId(paper.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (paper: ResearchPaper) => {
    saveItem({
      id: paper.id,
      type: 'paper',
      title: paper.title,
      subtitle: `${paper.authors[0]} et al. (${paper.year})`,
      data: paper
    });
  };

  const handlePaperCreated = (newPaper: ResearchPaper) => {
    setPapers(prev => [newPaper, ...prev]);
    setActiveTab('catalog');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Upload Drag & Drop Modal */}
      <ResearchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onPaperCreated={handlePaperCreated}
      />

      {/* Researcher Identity & Action Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-sky-950/20 border border-emerald-500/20 dark:border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {userProfile?.name || 'Dr. Shashvat Shukla'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                Google Verified
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Dedicated Fixed ID:</span>
              <button
                onClick={() => setIsIdCardModalOpen(true)}
                className="font-mono font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                title="View Institutional ID Badge"
              >
                <span>{dedicatedFixedId}</span>
                <Award className="w-3 h-3" />
              </button>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-400">{userProfile?.affiliation}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'author' ? 'catalog' : 'author')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              activeTab === 'author'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>{activeTab === 'author' ? 'Back to Library' : 'Write Research Paper'}</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Drag & Drop Upload</span>
          </button>
        </div>
      </div>

      {/* If Authoring Studio Mode is Active, show full Writer Studio */}
      {activeTab === 'author' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('catalog')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              ← Return to Peer-Reviewed Repository
            </button>
          </div>
          <ResearchWriterStudio
            onPaperPublished={(paper) => {
              handlePaperCreated(paper);
              setActiveTab('catalog');
            }}
            onClose={() => setActiveTab('catalog')}
          />
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Peer-Reviewed Land Studies & Cadastral Repository</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Research Papers, Ingested Field Surveys & Grounded Evaluations
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {papers.length} Papers Available
                </span>
              </div>
            </div>

            {/* Search Bar & Tag Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search papers by author, title, journal, keywords, dedicated UID, geography..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {tags.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedTag === t
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Papers Grid */}
          <div className="space-y-4">
            {papers.map(paper => {
              const saved = isSaved(paper.id);
              const isCopied = copiedId === paper.id;
              const hasDedicatedId = paper.dedicatedResearcherId;

              return (
                <div
                  key={paper.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-4 text-xs"
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {paper.journal || paper.publisher}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Published: {paper.year} • {paper.authors.join(', ')}
                        </span>
                        {hasDedicatedId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <Fingerprint className="w-3 h-3" />
                            UID: {paper.dedicatedResearcherId}
                          </span>
                        )}
                        {paper.isUserAuthored && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                            Researcher Authored
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {paper.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCitation(paper)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied APA' : 'Cite APA'}</span>
                      </button>

                      <button
                        onClick={() => handleSave(paper)}
                        className={`p-2 rounded-lg border transition-colors ${
                          saved
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-200'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                        title={saved ? 'Saved in Workspace' : 'Save to Workspace'}
                      >
                        {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Abstract */}
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {paper.abstract}
                  </p>

                  {/* AI Summary Callout */}
                  {paper.ai_summary && (
                    <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-purple-950 dark:text-purple-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-purple-700 dark:text-purple-300">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI-Generated Concise Finding Summary</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {paper.ai_summary.replace('AI Summary: ', '')}
                      </p>
                    </div>
                  )}

                  {/* Key Findings */}
                  {paper.key_findings && paper.key_findings.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Core Empirical Findings
                      </span>
                      <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                        {paper.key_findings.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Tags:</span>
                      {paper.tags.map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={paper.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      <span>Repository Reference</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

