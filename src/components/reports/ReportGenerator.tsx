import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Download, Printer, CheckCircle2, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

export const ReportGenerator: React.FC = () => {
  const { selectedState, selectedYear, states, currentRecord } = useApp();
  const [reportTitle, setReportTitle] = useState('Uttar Pradesh Land-Use & Agricultural Decadal Brief');
  const [includeAI, setIncludeAI] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeProvenance, setIncludeProvenance] = useState(true);
  const [includePolicy, setIncludePolicy] = useState(true);
  const [generating, setGenerating] = useState(false);

  const stateName = states.find(s => s.state_code === selectedState)?.state_name || 'Uttar Pradesh';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(31, 77, 126);
      doc.text('BHU-DRISHTI LAND INTELLIGENCE REPORT', 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(reportTitle, 20, 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Geography: ${stateName} | Series Year: ${selectedYear} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 34);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 38, 190, 38);

      // Section 1: Executive Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('1. EXECUTIVE SUMMARY & KEY INDICATORS', 20, 46);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const summaryText = `${stateName} has recorded a gradual structural shift in land-use distribution between 2005 and 2025. Agricultural land accounts for ${currentRecord?.agricultural_pct || 68.4}% of geographic area, while built-up land expanded to ${currentRecord?.builtup_pct || 11.8}%. Forest cover stabilized at ${currentRecord?.forest_pct || 9.2}%, and gross irrigated farmland expanded to ${currentRecord?.irrigated_pct || 87.2}%.`;
      doc.text(doc.splitTextToSize(summaryText, 170), 20, 52);

      // Indicators Table in PDF
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 68, 170, 35, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Indicator', 25, 75);
      doc.text('Share %', 85, 75);
      doc.text('Decadal Trend', 135, 75);

      doc.setFont('helvetica', 'normal');
      doc.text('Agricultural Land', 25, 82);
      doc.text(`${currentRecord?.agricultural_pct || 68.4}%`, 85, 82);
      doc.text('↓ -2.4 pp decline', 135, 82);

      doc.text('Forest Cover', 25, 89);
      doc.text(`${currentRecord?.forest_pct || 9.2}%`, 85, 89);
      doc.text('↑ +0.3 pp gain', 135, 89);

      doc.text('Built-up / Urban Sprawl', 25, 96);
      doc.text(`${currentRecord?.builtup_pct || 11.8}%`, 85, 96);
      doc.text('↑ +2.8 pp expansion', 135, 96);

      // Section 2: AI Synthesis
      if (includeAI) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('2. AI-ASSISTED TREND SYNTHESIS & FACTOR HYPOTHESES', 20, 115);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const aiText = 'Statistical time series reveals that peri-urban agricultural conversion is heavily concentrated in tier-2 industrial corridors and highway ribbons. Assured irrigation interventions under PMKSY have largely offset total cropland shrinkage by intensifying multi-season cropping intensity and reducing seasonal fallow acreage.';
        doc.text(doc.splitTextToSize(aiText, 170), 20, 122);
      }

      // Section 3: Data Provenance
      if (includeProvenance) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('3. DATA PROVENANCE & OFFICIAL CITATIONS', 20, 145);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('1. Directorate of Economics & Statistics, Ministry of Agriculture & Farmers Welfare (2025 Series).', 20, 152);
        doc.text('2. Forest Survey of India, Biennial Canopy Assessment (ISFR 2025).', 20, 158);
        doc.text('3. National Remote Sensing Centre (NRSC / ISRO) Bhuvan LULC Spatial Geodatabase.', 20, 164);
      }

      doc.setFontSize(8);
      doc.text('Confidential Policy Brief — Generated for Research and Policy Decision Support.', 20, 280);

      doc.save(`LandIntel-Report-${stateName}-${selectedYear}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Official Policy Brief & Report Generator</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Customizable Land Intelligence Briefing Dossier
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Generate publication-ready executive reports combining executive summaries, statistical trend breakdowns, policy context, and formal methodology citations.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{generating ? 'Exporting PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Configuration & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
            Report Parameters
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Include Sections:
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAI}
                  onChange={e => setIncludeAI(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span>AI Synthesis & Factor Hypotheses</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={e => setIncludeCharts(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span>Statistical Indicator Matrix</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePolicy}
                  onChange={e => setIncludePolicy(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span>Policy Intervention Context (PMKSY / DILRMP)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeProvenance}
                  onChange={e => setIncludeProvenance(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <span>Government Data Provenance & Citations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Document Preview Column */}
        <div className="lg:col-span-2 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 text-slate-800 dark:text-slate-200 text-xs">
          {/* Document Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
              <span>National Land Intelligence Portal — Official Brief</span>
              <span className="font-mono">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {reportTitle}
            </h3>
            <div className="text-slate-400 text-xs">
              Scope: <strong>{stateName}</strong> • Target Series Year: <strong>{selectedYear}</strong>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              1. Executive Summary
            </h4>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              {stateName} has maintained an agricultural land base of {currentRecord?.agricultural_pct || 68.4}% ({Math.round((currentRecord?.agricultural_area_ha || 16640000) / 1000).toLocaleString()}k Ha), with built-up land expanding to {currentRecord?.builtup_pct || 11.8}%. Gross irrigated area stands at {currentRecord?.irrigated_pct || 87.2}%, reflecting steady modernization under central and state irrigation schemes.
            </p>
          </div>

          {/* Section 2 */}
          {includeCharts && (
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                2. Land-Use Indicator Matrix ({selectedYear})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Agricultural Land</span>
                  <div className="text-base font-bold font-mono text-agri-600 mt-0.5">{currentRecord?.agricultural_pct || 68.4}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Forest Extent</span>
                  <div className="text-base font-bold font-mono text-emerald-600 mt-0.5">{currentRecord?.forest_pct || 9.2}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Built-up / Urban</span>
                  <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{currentRecord?.builtup_pct || 11.8}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase">Gross Irrigation</span>
                  <div className="text-base font-bold font-mono text-blue-600 mt-0.5">{currentRecord?.irrigated_pct || 87.2}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: AI Insights */}
          {includeAI && (
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                3. AI Synthesis & Factor Hypotheses
              </h4>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                Urban expansion in peripheral corridors has exerted consistent pressure on prime agricultural holdings. Micro-irrigation investments under PMKSY have mitigated net production loss by converting former seasonal fallows into double-cropped parcels.
              </p>
            </div>
          )}

          {/* Section 4: Data Provenance */}
          {includeProvenance && (
            <div className="space-y-1.5 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">4. Official Sources & Citations</span>
              <div>1. Directorate of Economics & Statistics, MoA&FW (2025 Series).</div>
              <div>2. Forest Survey of India, Biennial Forest Cover Assessment.</div>
              <div>3. National Remote Sensing Centre (NRSC / ISRO) Bhuvan Geospatial Portal.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
