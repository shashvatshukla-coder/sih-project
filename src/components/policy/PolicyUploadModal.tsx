import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Policy } from '../../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Sparkles,
  MapPin,
  Building2,
  Layers,
  Coins,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface PolicyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolicyCreated?: (policy: Policy) => void;
  initialFile?: File | null;
}

export const PolicyUploadModal: React.FC<PolicyUploadModalProps> = ({
  isOpen,
  onClose,
  onPolicyCreated,
  initialFile = null
}) => {
  const { states, selectedState, userProfile } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [policyName, setPolicyName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [ministry, setMinistry] = useState('Ministry of Agriculture & Farmers Welfare / Board of Revenue');
  const [targetStateCode, setTargetStateCode] = useState(selectedState || 'IN-UP');
  const [districtName, setDistrictName] = useState('Amethi (Gauriganj HQ)');
  const [allocatedBudgetCr, setAllocatedBudgetCr] = useState('420');
  const [directives, setDirectives] = useState<string[]>([
    'Mandatory GIS cadastral geofencing before sanctioning any land classification change.',
    'Fast-track sodic soil reclamation with prioritized solar pump subsidies for smallholders.',
    'Preservation of prime double-cropped canal command parcels against real-estate sprawl.'
  ]);
  const [newDirectiveInput, setNewDirectiveInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdPolicy, setCreatedPolicy] = useState<Policy | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStateObj = states.find(s => s.state_code === targetStateCode) || states[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage('');

    // Generate intelligent title & acronym from filename
    const cleanName = selectedFile.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    setPolicyName(cleanName);

    const generatedAcronym = cleanName
      .split(' ')
      .filter(w => w.length > 2)
      .map(w => w[0])
      .join('')
      .substring(0, 6)
      .toUpperCase() || 'GAZ-DIR';
    setAcronym(generatedAcronym);

    // Read text preview if applicable
    if (
      selectedFile.type.includes('text') ||
      selectedFile.name.endsWith('.md') ||
      selectedFile.name.endsWith('.txt') ||
      selectedFile.name.endsWith('.json')
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFilePreview(text.substring(0, 1000));
      };
      reader.readAsText(selectedFile);
    } else {
      setFilePreview(`Binary Policy Asset: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB) - Verified for Gazette Parsing`);
    }
  };

  useEffect(() => {
    if (isOpen && initialFile) {
      processFile(initialFile);
    }
  }, [isOpen, initialFile]);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleAddDirective = () => {
    if (newDirectiveInput.trim()) {
      setDirectives([...directives, newDirectiveInput.trim()]);
      setNewDirectiveInput('');
    }
  };

  const handleRemoveDirective = (idx: number) => {
    setDirectives(directives.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim()) {
      setErrorMessage('Please provide a policy title or upload a document.');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');

      const payload = {
        fileName: file?.name || 'Gazette_Notification_Directive.pdf',
        fileSize: file?.size || 142000,
        fileType: file?.type || 'application/pdf',
        fileContent: filePreview,
        name: policyName.trim(),
        acronym: acronym.trim() || policyName.substring(0, 6).toUpperCase(),
        ministry,
        target_region: `${currentStateObj?.state_name || 'Uttar Pradesh'} (${districtName || 'All Districts'})`,
        state_code: targetStateCode,
        state_name: currentStateObj?.state_name || 'Uttar Pradesh',
        district_name: districtName,
        allocated_budget_cr: Number(allocatedBudgetCr) || 450,
        directives,
        policyMakerName: userProfile?.name || 'Policy Maker'
      };

      const result = await api.uploadPolicyFile(payload);

      if (result.success && result.data) {
        setCreatedPolicy(result.data);
        setSuccess(true);
        if (onPolicyCreated) onPolicyCreated(result.data);
      } else {
        throw new Error('Failed to register policy');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload policy document');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setFilePreview('');
    setPolicyName('');
    setAcronym('');
    setSuccess(false);
    setCreatedPolicy(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-left">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Policy Ingestion & Gazette Uploader</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                  Policy Maker Portal
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag and drop Gazette notifications, Cabinet orders, or departmental policy frameworks.
              </p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success && createdPolicy ? (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Policy Directive Registered Successfully!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  The gazette notification has been parsed, indexed, and linked to {createdPolicy.target_region}.
                </p>
              </div>

              {/* Policy Quick Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {createdPolicy.acronym}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Statutory Gazette Notified</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {createdPolicy.name}
                </h4>
                <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Jurisdiction: <strong>{createdPolicy.target_region}</strong></span>
                  {createdPolicy.allocated_budget_cr && (
                    <span>Budget: <strong>₹{createdPolicy.allocated_budget_cr} Cr</strong></span>
                  )}
                  <span>Launch: <strong>{createdPolicy.launch_year}</strong></span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={resetModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all"
                >
                  Done & View Policy Repository
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 scale-[1.01]'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB • Ready for Gazette Ingestion
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFilePreview('');
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Drag & drop Gazette PDF, Cabinet Order, or Circular here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports PDF, DOCX, TXT, MD, JSON up to 25MB
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      or click to browse local files
                    </span>
                  </div>
                )}
              </div>

              {/* Policy Metadata & Area Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Policy / Scheme Name *
                    </label>
                    <input
                      type="text"
                      value={policyName}
                      onChange={(e) => setPolicyName(e.target.value)}
                      placeholder="e.g., Uttar Pradesh Sodic Land Reclamation & Zoning Order"
                      required
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Acronym / Code *
                    </label>
                    <input
                      type="text"
                      value={acronym}
                      onChange={(e) => setAcronym(e.target.value.toUpperCase())}
                      placeholder="e.g., UP-SLRP"
                      className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Ministry / Department
                  </label>
                  <input
                    type="text"
                    value={ministry}
                    onChange={(e) => setMinistry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Area Configuration */}
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <MapPin className="w-4 h-4" />
                    <span>Area Jurisdiction & Resource Allocation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Target State
                      </label>
                      <select
                        value={targetStateCode}
                        onChange={(e) => setTargetStateCode(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        {states.map(s => (
                          <option key={s.state_code} value={s.state_code}>
                            {s.state_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Target District / Tehsil
                      </label>
                      <input
                        type="text"
                        value={districtName}
                        onChange={(e) => setDistrictName(e.target.value)}
                        placeholder="e.g. Amethi (Gauriganj HQ)"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase">
                        Allocated Budget (₹ Cr)
                      </label>
                      <input
                        type="number"
                        value={allocatedBudgetCr}
                        onChange={(e) => setAllocatedBudgetCr(e.target.value)}
                        placeholder="420"
                        className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Directives */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Area Enforcement Directives & Objectives
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {directives.length} directives configured
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {directives.map((dir, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span className="line-clamp-1 flex-1">• {dir}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirective(idx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDirectiveInput}
                      onChange={(e) => setNewDirectiveInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDirective();
                        }
                      }}
                      placeholder="Add an area statutory directive and press Enter..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddDirective}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !policyName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Parsing & Ingesting Gazette...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" />
                      <span>Ingest & Publish Policy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
