import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Activity,
  ArrowRight,
  FileCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import axiosClient from '../../api/axiosClient.js';
import { Report, ReportAbnormalValue } from '../../types/index.js';

export const UserReports: React.FC = () => {
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get<{ success: boolean; reports: Report[] }>('/user/reports');
      if (res.data?.reports) {
        setReports(res.data.reports);
        if (res.data.reports.length > 0 && !expandedReportId) {
          setExpandedReportId(res.data.reports[0].id);
        }
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!reportName) {
        setReportName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFile && !customText.trim()) {
      setErrorMsg('Please select a report file (PDF or Image) or paste test values.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('reportName', reportName || selectedFile?.name || 'Pathology_Report.pdf');
      if (customText) {
        formData.append('customText', customText);
      }

      const res = await axiosClient.post<{ success: boolean; report: Report }>('/user/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.report) {
        setReports((prev) => [res.data.report, ...prev]);
        setExpandedReportId(res.data.report.id);
        setSuccessMsg('Report analyzed by BloodCare AI! Insights and clinical breakdown are available below.');
        setSelectedFile(null);
        setReportName('');
        setCustomText('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to analyze report.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report record?')) return;

    try {
      await axiosClient.delete(`/user/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (expandedReportId === id) setExpandedReportId(null);
    } catch {}
  };

  const handlePresetSample = (type: 'ANEMIA' | 'NORMAL' | 'THROMBOCYTOPENIA') => {
    if (type === 'ANEMIA') {
      setReportName('Complete_Hemogram_Anemia_Panel.pdf');
      setCustomText('Hemoglobin: 9.8 g/dL\nSerum Ferritin: 14 ng/mL\nRBC: 3.8 million/µL\nPlatelets: 240,000 /µL\nWBC: 6,800 /µL');
    } else if (type === 'THROMBOCYTOPENIA') {
      setReportName('Dengue_Platelet_Recovery_Panel.pdf');
      setCustomText('Hemoglobin: 13.5 g/dL\nPlatelet Count: 42,000 /µL\nWBC: 3,400 /µL');
    } else {
      setReportName('Annual_Routine_Health_Checkup.pdf');
      setCustomText('Hemoglobin: 14.8 g/dL\nPlatelet Count: 280,000 /µL\nTotal Leukocyte Count (WBC): 7,400 /µL');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600 animate-pulse" />
            Pathology Reports & BloodCare AI Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload CBC, lipid, or metabolic blood panels. BloodCare AI parses hematological indices and highlights clinical risk flags.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* 2-Column: Upload Box on Left, Detailed AI Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Box (5 spans) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <UploadCloud className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Upload New Medical Report</h2>
          </div>

          <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
            {/* File Dropzone */}
            <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Click to browse or drop report here
                  </p>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG, or Pathology Scans (Max 15MB)</p>
                </div>
              )}
            </div>

            {/* Report Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Report Title / Test Name
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC) Panel"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick Preset Samples */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Quick Sample Clinical Presets:
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetSample('ANEMIA')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20"
                >
                  ⚡ Anemia Test
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSample('THROMBOCYTOPENIA')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20"
                >
                  ⚡ Low Platelets
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSample('NORMAL')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20"
                >
                  ⚡ Normal CBC
                </button>
              </div>
            </div>

            {/* Lab Values / Extracted Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Extracted Lab Values / Pathology Content (Optional / Manual input)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Hemoglobin: 10.2 g/dL, Platelets: 180,000 /µL, WBC: 7,500 /µL..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUploading ? 'BloodCare AI is Analyzing...' : 'Run BloodCare AI Analysis'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: AI Analysis Results & History (7 spans) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              Report History & AI Clinical Outputs ({reports.length})
            </h3>
          </div>

          {reports.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No reports uploaded yet</h4>
              <p className="text-xs text-slate-400 mt-1">Upload a PDF or test with our quick clinical presets.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                let parsedAbnormal: ReportAbnormalValue[] = report.abnormalValues || [];
                let parsedRisk: string[] = report.riskFlags || [];

                if (parsedAbnormal.length === 0 && report.abnormal_values) {
                  try {
                    parsedAbnormal = JSON.parse(report.abnormal_values);
                  } catch {}
                }
                if (parsedRisk.length === 0 && report.risk_flags) {
                  try {
                    parsedRisk = JSON.parse(report.risk_flags);
                  } catch {}
                }

                return (
                  <div
                    key={report.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200"
                  >
                    {/* Header bar */}
                    <div
                      onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2.5 rounded-2xl ${
                            report.is_flagged
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-emerald-500/10 text-emerald-600'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{report.file_name}</h4>
                          <p className="text-xs text-slate-400">
                            Analyzed: {new Date(report.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            report.is_flagged
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          }`}
                        >
                          {report.is_flagged ? '⚠️ Flags Detected' : '✅ Optimal'}
                        </span>
                        <button
                          onClick={(e) => handleDelete(report.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expandable AI Detailed Content */}
                    {isExpanded && (
                      <div className="p-6 pt-0 space-y-5 border-t border-slate-100 dark:border-slate-800">
                        {/* Summary */}
                        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1 mt-4">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            BloodCare AI Clinical Summary
                          </span>
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            {report.summary}
                          </p>
                        </div>

                        {/* Abnormal Values Table */}
                        {parsedAbnormal.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Analyzed Biomarkers & Reference Ranges:
                            </h5>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                  <tr>
                                    <th className="py-2">Biomarker</th>
                                    <th className="py-2">Report Value</th>
                                    <th className="py-2">Normal Range</th>
                                    <th className="py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {parsedAbnormal.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                                        {item.parameter}
                                      </td>
                                      <td className="py-2.5 font-extrabold text-rose-600 dark:text-rose-400">
                                        {item.value}
                                      </td>
                                      <td className="py-2.5 text-slate-500 dark:text-slate-400">
                                        {item.normalRange}
                                      </td>
                                      <td className="py-2.5">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                            item.status === 'CRITICAL'
                                              ? 'bg-red-500/20 text-red-600'
                                              : item.status === 'LOW' || item.status === 'HIGH'
                                              ? 'bg-amber-500/20 text-amber-600'
                                              : 'bg-emerald-500/20 text-emerald-600'
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Risk Flags */}
                        {parsedRisk.length > 0 && (
                          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Clinical Risk Indicators
                            </span>
                            <ul className="list-disc list-inside text-xs text-rose-900 dark:text-rose-200 space-y-1">
                              {parsedRisk.map((flag, fIdx) => (
                                <li key={fIdx}>{flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggested Next Step */}
                        {report.suggested_step && (
                          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Suggested Clinical Next Step
                            </span>
                            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                              {report.suggested_step}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReports;
