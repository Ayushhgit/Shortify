import React, { useState } from 'react';
import { Upload, FileText, BarChart3, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Plot from 'react-plotly.js';

const EDAUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(fileType)) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV or Excel file');
        setFile(null);
      }
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
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
    } catch (err) {
      setError(err.message);
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
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <FileText className="mr-2" />
          Dataset Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h4 className="font-semibold text-blue-800">Shape</h4>
            <p className="text-2xl font-bold text-blue-600">{shape[0]} × {shape[1]}</p>
            <p className="text-sm text-blue-600">Rows × Columns</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-semibold text-green-800">Column Types</h4>
            <p className="text-sm text-green-600">
              Numerical: {numerical_columns.length} | Categorical: {categorical_columns.length}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Columns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-blue-600 mb-1">Numerical</h5>
              <div className="flex flex-wrap gap-1">
                {numerical_columns.map(col => (
                  <span key={col} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {col}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-green-600 mb-1">Categorical</h5>
              <div className="flex flex-wrap gap-1">
                {categorical_columns.map(col => (
                  <span key={col} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
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
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <CheckCircle className="mr-2 text-green-500" />
            Missing Values
          </h3>
          <p className="text-green-600 font-medium">No missing values found! 🎉</p>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <AlertCircle className="mr-2 text-orange-500" />
          Missing Values
        </h3>
        <p className="text-gray-600 mb-4">Total missing values: {total_missing}</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Column</th>
                <th className="px-4 py-2 text-left">Missing Count</th>
                <th className="px-4 py-2 text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {missingData.map(([col, count]) => (
                <tr key={col} className="border-t">
                  <td className="px-4 py-2 font-medium">{col}</td>
                  <td className="px-4 py-2">{count}</td>
                  <td className="px-4 py-2">{missing_percentages[col].toFixed(2)}%</td>
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
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-lg font-semibold mb-4">{title}</h4>
          <Plot
            data={fig.data}
            layout={{
              ...fig.layout,
              autosize: true,
              margin: { l: 50, r: 50, t: 50, b: 50 }
            }}
            style={{ width: '100%', height: '400px' }}
            useResizeHandler={true}
          />
        </div>
      );
    } catch (e) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-lg font-semibold mb-4">{title}</h4>
          <p className="text-red-500">Error rendering visualization</p>
        </div>
      );
    }
  };

  const renderDescriptiveStats = () => {
    if (!analysis?.descriptive_stats?.numerical) return null;

    const stats = analysis.descriptive_stats.numerical;
    const columns = Object.keys(stats);

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Descriptive Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left">Statistic</th>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map(stat => (
                <tr key={stat} className="border-t">
                  <td className="px-3 py-2 font-medium">{stat}</td>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Auto EDA Tool
          </h1>
          <p className="text-gray-600">
            Upload your dataset and get instant exploratory data analysis
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex flex-col items-center">
            <Upload className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Upload Dataset</h2>
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors duration-200 mb-4"
            >
              Choose File
            </label>
            
            {file && (
              <p className="text-green-600 mb-4">
                Selected: {file.name}
              </p>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={analyzeFile}
                disabled={!file || loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <BarChart3 className="mr-2 w-4 h-4" />
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
              
              <button
                onClick={downloadReport}
                disabled={!file || reportLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <Download className="mr-2 w-4 h-4" />
                {reportLoading ? 'Generating...' : 'Download Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
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
                <h3 className="text-2xl font-bold mb-4">Distribution Plots</h3>
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
                <h3 className="text-2xl font-bold mb-4">Outlier Detection</h3>
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
                <h3 className="text-2xl font-bold mb-4">Categorical Distributions</h3>
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
                <h3 className="text-2xl font-bold mb-4">Category Proportions</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(analysis.visualizations.pie_charts).map(([col, plotData]) =>
                    renderVisualization(plotData, `${col} Distribution`)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EDAUploader;