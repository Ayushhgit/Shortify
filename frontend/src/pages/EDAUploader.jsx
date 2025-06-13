import React, { useState } from 'react';
import { Upload, FileText, BarChart3, Download, AlertCircle, CheckCircle, Database, TrendingUp, Sparkles, Search, Home, User, Settings } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Plot from 'react-plotly.js';

const EDAUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState(1);
  const [animateResult, setAnimateResult] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(fileType)) {
        setFile(selectedFile);
        setError(null);
        setStep(2);
      } else {
        setError('Please select a CSV or Excel file');
        setFile(null);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(fileType)) {
        setFile(selectedFile);
        setError(null);
        setStep(2);
      } else {
        setError('Please select a CSV or Excel file');
      }
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStep(3);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/eda/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }

      const result = await response.json();
      setAnalysis(result);
      setAnimateResult(true);
      setStep(4);
    } catch (err) {
      setError(err.message);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!file) return;

    setReportLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/eda/report', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eda_report.html';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const renderBasicInfo = () => {
    if (!analysis?.basic_info) return null;

    const { shape, columns, dtypes, numerical_columns, categorical_columns } = analysis.basic_info;

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-cyan-400/30">
        <h3 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="p-3 bg-cyan-500/20 rounded-xl mr-4">
            <FileText className="w-6 h-6 text-cyan-400" />
          </div>
          Dataset Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cyan-500/20 p-6 rounded-2xl border border-cyan-400/30">
            <h4 className="font-semibold text-cyan-300 mb-2">Shape</h4>
            <p className="text-3xl font-bold text-cyan-400">{shape[0]} × {shape[1]}</p>
            <p className="text-sm text-cyan-300">Rows × Columns</p>
          </div>
          <div className="bg-teal-500/20 p-6 rounded-2xl border border-teal-400/30">
            <h4 className="font-semibold text-teal-300 mb-2">Column Types</h4>
            <p className="text-sm text-teal-300">
              Numerical: {numerical_columns.length} | Categorical: {categorical_columns.length}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="font-semibold mb-4 text-white">Columns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Numerical</h5>
              <div className="flex flex-wrap gap-2">
                {numerical_columns.map(col => (
                  <span key={col} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-500/30">
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-teal-400 mb-3">Categorical</h5>
              <div className="flex flex-wrap gap-2">
                {categorical_columns.map(col => (
                  <span key={col} className="bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-sm border border-teal-500/30">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMissingValues = () => {
    if (!analysis?.missing_values) return null;

    const { missing_counts, missing_percentages, total_missing } = analysis.missing_values;
    const missingData = Object.entries(missing_counts).filter(([_, count]) => count > 0);

    if (missingData.length === 0) {
      return (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-green-400/30">
          <h3 className="text-2xl font-bold mb-6 flex items-center text-white">
            <div className="p-3 bg-green-500/20 rounded-xl mr-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            Missing Values
          </h3>
          <p className="text-green-300 font-medium text-lg">No missing values found! 🎉</p>
        </div>
      );
    }

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-orange-400/30">
        <h3 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="p-3 bg-orange-500/20 rounded-xl mr-4">
            <AlertCircle className="w-6 h-6 text-orange-400" />
          </div>
          Missing Values
        </h3>
        <p className="text-gray-300 mb-6 text-lg">Total missing values: {total_missing}</p>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-white/10">
                <th className="px-6 py-3 text-left text-white font-semibold">Column</th>
                <th className="px-6 py-3 text-left text-white font-semibold">Missing Count</th>
                <th className="px-6 py-3 text-left text-white font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {missingData.map(([col, count]) => (
                <tr key={col} className="border-t border-white/10">
                  <td className="px-6 py-4 font-medium text-gray-300">{col}</td>
                  <td className="px-6 py-4 text-gray-300">{count}</td>
                  <td className="px-6 py-4 text-gray-300">{missing_percentages[col].toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDescriptiveStats = () => {
    if (!analysis?.descriptive_stats?.numerical) return null;

    const stats = analysis.descriptive_stats.numerical;
    const columns = Object.keys(stats);

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
        <h3 className="text-2xl font-bold mb-6 text-white">Descriptive Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-white/10">
                <th className="px-4 py-3 text-left text-white font-semibold">Statistic</th>
                {columns.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-white font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(stat => (
                <tr key={stat} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-gray-300">{stat}</td>
                  {columns.map(col => (
                    <td key={col} className="px-4 py-3 text-gray-300">
                      {typeof stats[col][stat] === 'number'
                        ? stats[col][stat].toFixed(2)
                        : stats[col][stat]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVisualization = (plotData, title) => {
    if (!plotData) return null;

    try {
      const fig = JSON.parse(plotData);
      return (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
          <h4 className="text-xl font-semibold mb-4 text-white">{title}</h4>
          <Plot
            data={fig.data}
            layout={{
              ...fig.layout,
              autosize: true,
              margin: { l: 50, r: 50, t: 50, b: 50 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: 'white' }
            }}
            style={{ width: '100%', height: '400px' }}
            useResizeHandler={true}
          />
        </div>
      );
    } catch (e) {
      return (
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-red-400/30">
          <h4 className="text-xl font-semibold mb-4 text-white">{title}</h4>
          <p className="text-red-400">Error rendering visualization</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Database className="h-8 w-8 text-cyan-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Data<span className="text-cyan-400">AIsight</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[
              { icon: Home, href: "/shortify" },
              { icon: User, href: "/Profile" },
              { icon: Settings, href: "/Settings" },
            ].map((item, index) => (
              <button
                key={index}
                className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Data Analysis
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Discover Hidden
              <span className="block bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Data Insights
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Upload your dataset and get comprehensive exploratory data analysis with interactive visualizations
            </p>
          </div>

          {step === 1 && (
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Upload Area */}
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <Upload className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Upload Your Dataset
                  </h2>
                </div>
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 max-w-lg mx-auto ${dragActive
                    ? "border-cyan-400 bg-cyan-500/20"
                    : file
                      ? "border-green-400 bg-green-500/20"
                      : "border-white/30 bg-white/10 hover:border-cyan-400/50 hover:bg-white/20"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    {file ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                        <div>
                          <p className="text-green-300 font-semibold text-lg">
                            File uploaded successfully!
                          </p>
                          <p className="text-gray-300">{file.name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="w-16 h-16 text-white/60 mx-auto" />
                        <div>
                          <p className="text-white font-semibold text-lg">
                            Drop your CSV or Excel file here
                          </p>
                          <p className="text-gray-300">
                            or click to browse files
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              {file && (
                <div className="text-center animate-fadeIn">
                  <button
                    onClick={() => setStep(2)}
                    className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">Continue to Analysis</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && file && (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Ready to Analyze
                </h2>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Dataset File:</span>
                    <span className="text-white font-semibold">
                      {file.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={analyzeFile}
                  disabled={loading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-lg">Analyze Dataset</span>
                  </div>
                </button>

                <button
                  onClick={downloadReport}
                  disabled={reportLoading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-6 h-6" />
                    <span className="text-lg">{reportLoading ? 'Generating...' : 'Download Report'}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && loading && (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-6">
                <TrendingUp className="w-20 h-20 text-cyan-400 mx-auto animate-pulse" />
                <h2 className="text-3xl font-bold text-white">
                  Analyzing Your Dataset
                </h2>
                <p className="text-gray-300 text-lg">
                  Our AI is processing your data and generating insights...
                </p>
              </div>

              {/* Loading Progress */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="space-y-4">
                    {[
                      "Reading dataset structure...",
                      "Computing statistical summaries...",
                      "Detecting missing values...",
                      "Generating visualizations...",
                    ].map((text, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${index < 2
                            ? "bg-cyan-400"
                            : index === 2
                              ? "bg-cyan-400 animate-pulse"
                              : "bg-gray-600"
                            }`}
                        ></div>
                        <span className="text-gray-300">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 px-6 py-4 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && analysis && (
            <div
              className={`space-y-8 transition-all duration-1000 ${animateResult
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-10"
                }`}
            >
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-bold text-white">
                  Analysis Complete
                </h2>
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold text-lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Dataset Successfully Analyzed
                </div>
              </div>

              {/* Analysis Results */}
              <div className="space-y-8">
                {renderBasicInfo()}
                {renderMissingValues()}
                {renderDescriptiveStats()}

                {/* Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analysis.visualizations?.missing_values_chart &&
                    renderVisualization(analysis.visualizations.missing_values_chart, "Missing Values")}

                  {analysis.visualizations?.correlation_heatmap &&
                    renderVisualization(analysis.visualizations.correlation_heatmap, "Correlation Matrix")}
                </div>

                {/* Histograms */}
                {analysis.visualizations?.histograms && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Distribution Plots</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(analysis.visualizations.histograms).map(([col, plotData]) =>
                        renderVisualization(plotData, `Distribution of ${col}`)
                      )}
                    </div>
                  </div>
                )}

                {/* Boxplots */}
                {analysis.visualizations?.boxplots && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Outlier Detection</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(analysis.visualizations.boxplots).map(([col, plotData]) =>
                        renderVisualization(plotData, `Boxplot of ${col}`)
                      )}
                    </div>
                  </div>
                )}

                {/* Categorical Charts */}
                {analysis.visualizations?.categorical_charts && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Categorical Distributions</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(analysis.visualizations.categorical_charts).map(([col, plotData]) =>
                        renderVisualization(plotData, `Distribution of ${col}`)
                      )}
                    </div>
                  </div>
                )}

                {/* Pie Charts */}
                {analysis.visualizations?.pie_charts && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-white">Category Proportions</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(analysis.visualizations.pie_charts).map(([col, plotData]) =>
                        renderVisualization(plotData, `${col} Distribution`)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={downloadReport}
                  disabled={reportLoading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>{reportLoading ? 'Generating...' : 'Download Report'}</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setStep(1);
                    setAnalysis(null);
                    setFile(null);
                    setError(null);
                    setAnimateResult(false);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>Analyze Another Dataset</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EDAUploader;