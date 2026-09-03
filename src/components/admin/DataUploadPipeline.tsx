import React, { useState } from 'react';
import { api } from '../../services/api';
import { Upload, CheckCircle2, AlertCircle, ArrowRight, FileText, Check } from 'lucide-react';

export const DataUploadPipeline: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [fileContent, setFileContent] = useState<string>('');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    state_name: 'State',
    district_name: 'District',
    year: 'Year',
    total_area: 'Total_Area',
    agricultural_pct: 'Agricultural_Pct',
    forest_pct: 'Forest_Pct',
    builtup_pct: 'Builtup_Pct'
  });
  const [datasetMeta, setDatasetMeta] = useState({
    title: 'Custom State Land Survey Dataset 2026',
    publisher: 'Department of Agricultural Statistics',
    category: 'Land Use',
    coverage: 'State & District Aggregates',
    format: 'CSV'
  });
  const [validationResult, setValidationResult] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);

  // Sample CSV generator for demonstration
  const handleLoadSampleCSV = () => {
    const sample = `State,District,Year,Total_Area,Agricultural_Pct,Forest_Pct,Builtup_Pct
Uttar Pradesh,Gorakhpur,2025,332100,71.2,3.8,10.6
Uttar Pradesh,Lucknow,2025,252800,52.0,5.2,33.5
Bihar,Patna,2025,320200,53.0,1.1,32.5
Maharashtra,Pune,2025,1564300,51.0,12.0,25.0
Karnataka,Bengaluru Urban,2025,219600,15.0,6.5,69.0`;
    parseCSV(sample);
  };

  const parseCSV = (csvText: string) => {
    setFileContent(csvText);
    const lines = csvText.trim().split('\n');
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      setDetectedColumns(headers);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        const row: any = {};
        headers.forEach((h, idx) => {
          row[h] = parts[idx];
        });
        rows.push(row);
      }
      setRawRows(rows);
      setStep(2);
    }
  };

  const handleRunValidation = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    rawRows.forEach((row, idx) => {
      const stateVal = row[columnMapping['state_name']];
      const yearVal = Number(row[columnMapping['year']]);
      const agriVal = Number(row[columnMapping['agricultural_pct']]);

      if (!stateVal) errors.push(`Row ${idx + 1}: Missing State Name`);
      if (isNaN(yearVal) || yearVal < 1990 || yearVal > 2030) errors.push(`Row ${idx + 1}: Year ${yearVal} out of valid range (1990-2030)`);
      if (isNaN(agriVal) || agriVal < 0 || agriVal > 100) errors.push(`Row ${idx + 1}: Agricultural % must be between 0 and 100`);
    });

    setValidationResult({
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRows: rawRows.length
    });
    setStep(3);
  };

  const handleConfirmIngestion = async () => {
    setIngesting(true);
    try {
      await api.uploadCustomDataset({
        rawRows,
        columnMapping,
        metadata: datasetMeta
      });
      setIngestSuccess(true);
      setTimeout(() => onComplete(), 2000);
    } catch (err) {
      console.error('Ingestion error:', err);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-xs">
      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        {[
          { num: 1, label: 'Upload File' },
          { num: 2, label: 'Map Columns' },
          { num: 3, label: 'Validate Rules' },
          { num: 4, label: 'Ingest & Log' }
        ].map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= s.num
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {s.num}
            </span>
            <span className={`font-semibold ${step >= s.num ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-4 text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <Upload className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Upload CSV or JSON Land-Record Dataset
          </h4>
          <p className="text-slate-500 max-w-md mx-auto text-xs">
            Supports tabular records containing State, District, Year, and Land Category percentages.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleLoadSampleCSV}
              className="px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-xs"
            >
              Load Sample Government CSV
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            Map Uploaded Columns to Bhu-Drishti Standard Schema
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(columnMapping).map(targetField => (
              <div key={targetField} className="space-y-1">
                <label className="font-mono text-[11px] text-slate-500 uppercase">{targetField}</label>
                <select
                  value={columnMapping[targetField]}
                  onChange={e => setColumnMapping(prev => ({ ...prev, [targetField]: e.target.value }))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer"
                >
                  {detectedColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleRunValidation}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-xs"
            >
              <span>Validate Dataset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validation */}
      {step === 3 && validationResult && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              {validationResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <span>{validationResult.isValid ? 'Validation Passed (0 Errors)' : 'Validation Errors Detected'}</span>
            </div>
            <div className="text-slate-500 text-xs">
              Processed {validationResult.totalRows} records against boundary constraints, non-negative bounds, and decadal year ranges.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleConfirmIngestion}
              disabled={!validationResult.isValid || ingesting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs disabled:opacity-50"
            >
              {ingesting ? <span>Normalizing & Ingesting...</span> : ingestSuccess ? <span>Ingested Successfully!</span> : <span>Confirm Import to Database</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
