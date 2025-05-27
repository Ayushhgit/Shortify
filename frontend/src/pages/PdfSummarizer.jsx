import React, { useState, useRef, useEffect } from "react";
import { Home, Settings, User, Upload, FileText, X, Check, Loader2, Download, Sparkles, Zap, Clock, BarChart3, Eye, Copy, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Premium Toast Component
const Toast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right duration-300">
      <div className={`rounded-xl px-6 py-4 shadow-2xl backdrop-blur-xl border max-w-sm ${
        type === "success" 
          ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" 
          : "bg-red-50/90 border-red-200 text-red-800"
      }`}>
        <div className="flex items-center gap-3">
          {type === "success" ? (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          ) : (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          )}
          <p className="font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default function PremiumPdfSummarizer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const navigate =  useNavigate();

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.includes("pdf")) {
        displayToast("Please select a PDF file", "error");
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        displayToast("File size exceeds 50MB limit", "error");
        return;
      }

      setFile(selectedFile);
      displayToast("PDF uploaded successfully! ✨");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (!droppedFile.type.includes("pdf")) {
        displayToast("Please drop a PDF file", "error");
        return;
      }
      if (droppedFile.size > 50 * 1024 * 1024) {
        displayToast("File size exceeds 50MB limit", "error");
        return;
      }
      setFile(droppedFile);
      displayToast("PDF uploaded successfully! ✨");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!file) {
      displayToast("Please select a PDF file first", "error");
      return;
    }

    try {
      setIsProcessing(true);
      
      // TODO: BACKEND INTEGRATION - Replace this section with actual API call
      // Example implementation:
      // const formData = new FormData();
      // formData.append('pdf', file);
      // 
      // const response = await fetch('/api/summarize', {
      //   method: 'POST',
      //   body: formData,
      //   headers: {
      //     // Add any required headers (auth tokens, etc.)
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      // 
      // const data = await response.json();
      // setSummary(data.summary);
      // setAnalysisData(data.analysis);
      
      // MOCK DATA - Remove this section when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate processing time
      
      const mockSummary = `This comprehensive document analysis reveals key insights across multiple dimensions. The document contains substantial information that has been distilled into actionable takeaways.

Key findings include strategic recommendations, detailed analysis of core concepts, and practical implementation guidelines. The content demonstrates thorough research and presents well-structured arguments supporting the main thesis.

Critical points highlight areas of particular importance, while supporting data provides evidence for the conclusions drawn. The document serves as a valuable resource for understanding complex topics and making informed decisions.`;

      const mockAnalysis = {
        wordCount: 12547,
        pageCount: 23,
        readingTime: 45,
        complexity: "Advanced",
        topics: ["Strategy", "Analysis", "Implementation", "Research"],
        sentiment: "Neutral",
        keyMetrics: {
          technical: 75,
          business: 60,
          academic: 85
        }
      };

      setSummary(mockSummary);
      setAnalysisData(mockAnalysis);
      // END MOCK DATA SECTION
      
      displayToast("PDF analyzed successfully! 🎉");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      displayToast("Error processing PDF. Please try again.", "error");
      console.error("Error:", error);
    }
  };

  const handleClear = () => {
    setFile(null);
    setSummary("");
    setAnalysisData(null);
    setActiveTab("summary");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    displayToast("Summary copied to clipboard! 📋");
  };

  // TODO: BACKEND INTEGRATION - Add these functions when backend is ready
  // 
  // const exportToPDF = async () => {
  //   try {
  //     const response = await fetch('/api/export/pdf', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         summary: summary,
  //         analysisData: analysisData,
  //         fileName: file.name
  //       })
  //     });
  //     
  //     if (response.ok) {
  //       const blob = await response.blob();
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = `${file.name}_analysis.pdf`;
  //       a.click();
  //       displayToast("Report exported successfully! 📄");
  //     }
  //   } catch (error) {
  //     displayToast("Export failed. Please try again.", "error");
  //   }
  // };
  // 
  // const shareReport = async () => {
  //   try {
  //     const response = await fetch('/api/share', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         summary: summary,
  //         analysisData: analysisData,
  //         fileName: file.name
  //       })
  //     });
  //     
  //     const data = await response.json();
  //     if (response.ok) {
  //       navigator.clipboard.writeText(data.shareUrl);
  //       displayToast("Share link copied to clipboard! 🔗");
  //     }
  //   } catch (error) {
  //     displayToast("Share failed. Please try again.", "error");
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Premium Glassmorphic Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="rounded-2xl bg-gray-900/80 backdrop-blur-2xl shadow-2xl border border-gray-700/50 px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-blue-600 p-2 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  SummAIze
                </h1>
                <p className="text-xs text-gray-400 font-medium">AI-Powered Document Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[
                { icon: Home, label: "Home", href: "/shortify" },
                { icon: User, label: "Profile", href: "/profile" },
                { icon: Settings, label: "Settings", href: "/settings" }
              ].map(({ icon: Icon, label, href }) => (
                <button key={label} className="group p-3 rounded-xl hover:bg-gray-800/60 transition-all duration-300 hover:shadow-lg">
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" onClick={() => navigate(href)}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Powered by Advanced AI</span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Documents
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Experience the future of document analysis with AI-powered summaries, 
              insights, and intelligent processing.
            </p>
          </div>

          {/* Enhanced Progress Steps */}
          <div className="flex justify-center items-center mb-16">
            {[
              { step: 1, label: "Upload", completed: !!file, icon: Upload },
              { step: 2, label: "Analyze", completed: !!summary, icon: BarChart3 },
              { step: 3, label: "Insights", completed: !!summary, icon: Eye }
            ].map(({ step, label, completed, icon: Icon }, index) => (
              <React.Fragment key={step}>
                <div className={`flex flex-col items-center transition-all duration-500 ${
                  completed ? "text-emerald-400" : "text-gray-500"
                }`}>
                  <div className={`relative rounded-2xl p-4 border-2 transition-all duration-500 ${
                    completed 
                      ? "border-emerald-500 bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 shadow-lg shadow-emerald-500/25" 
                      : "border-gray-600 bg-gray-800/50"
                  }`}>
                    {completed ? (
                      <div className="relative">
                        <Check className="h-6 w-6 text-emerald-400" />
                        <div className="absolute inset-0 bg-emerald-500 rounded-full blur opacity-25 animate-pulse"></div>
                      </div>
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className="mt-3 font-semibold text-sm">{label}</span>
                  <div className={`mt-1 w-2 h-2 rounded-full transition-all duration-500 ${
                    completed ? "bg-emerald-400 shadow-lg shadow-emerald-500/50" : "bg-gray-600"
                  }`}></div>
                </div>
                {index < 2 && (
                  <div className={`h-1 w-24 mx-6 rounded-full transition-all duration-500 ${
                    completed ? "bg-gradient-to-r from-emerald-500 to-blue-500" : "bg-gray-600"
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Premium File Upload Zone */}
          <div className="max-w-2xl mx-auto mb-12">
            <div
              className={`relative rounded-3xl border-2 border-dashed transition-all duration-500 ${
                isDragOver 
                  ? "border-emerald-400 bg-gradient-to-r from-emerald-900/30 to-blue-900/30 scale-105" 
                  : file 
                    ? "border-emerald-500 bg-gradient-to-r from-emerald-900/20 to-emerald-800/20" 
                    : "border-gray-600 bg-gray-800/30 hover:border-emerald-500 hover:bg-emerald-900/20"
              } backdrop-blur-sm shadow-xl`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="p-12">
                {!file ? (
                  <div className="text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur-xl opacity-25 animate-pulse"></div>
                      <div className="relative bg-gradient-to-r from-emerald-500 to-blue-500 p-4 rounded-2xl w-fit mx-auto">
                        <Upload className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload Your PDF</h3>
                    <p className="text-gray-300 mb-8">Drag and drop or click to select your document</p>
                    <label htmlFor="file-upload" className="group cursor-pointer inline-block">
                      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 group-hover:-translate-y-1">
                        Choose File
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="text-sm text-gray-400 mt-6">PDF files up to 50MB • Secure & Private</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur opacity-25"></div>
                        <div className="relative bg-emerald-100 p-3 rounded-2xl">
                          <FileText className="h-8 w-8 text-emerald-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg truncate max-w-md">{file.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <div className="flex items-center gap-1 text-emerald-400">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">Ready to process</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClear}
                      className="p-2 rounded-xl bg-gray-700 hover:bg-red-600 hover:text-white transition-all duration-300"
                    >
                      <X className="h-5 w-5 text-gray-300" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-16">
            <button
              onClick={handleSubmit}
              disabled={!file || isProcessing}
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                !file || isProcessing 
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed" 
                  : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
              }`}
            >
              {!file || isProcessing ? null : (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              )}
              <div className="relative flex items-center gap-3">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Intelligence
                  </>
                )}
              </div>
            </button>
            
            {file && (
              <button
                onClick={handleClear}
                className="px-6 py-4 border-2 border-gray-600 rounded-2xl text-gray-300 font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Enhanced Results Section */}
          {summary && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-gray-900/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
                {/* Results Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-8 py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Document Intelligence Report</h2>
                      <p className="text-emerald-200 mt-1">Complete analysis and insights</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                      <button className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors">
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors">
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                {analysisData && (
                  <div className="px-8 py-6 border-b border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: "Words", value: analysisData.wordCount.toLocaleString(), icon: FileText },
                        { label: "Pages", value: analysisData.pageCount, icon: BarChart3 },
                        { label: "Read Time", value: `${analysisData.readingTime}m`, icon: Clock },
                        { label: "Complexity", value: analysisData.complexity, icon: Zap }
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <Icon className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="text-2xl font-bold text-white">{value}</div>
                          <div className="text-sm text-gray-400">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700">
                  {[
                    { id: "summary", label: "Executive Summary", icon: FileText },
                    { id: "insights", label: "Key Insights", icon: Sparkles },
                    { id: "metrics", label: "Analytics", icon: BarChart3 }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                        activeTab === id 
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/30" 
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === "summary" && (
                    <div className="prose max-w-none">
                      <div className="text-lg leading-relaxed text-gray-300 space-y-6">
                        {summary.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="leading-8">{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "insights" && analysisData && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Key Topics</h3>
                        <div className="flex flex-wrap gap-3">
                          {analysisData.topics.map((topic, index) => (
                            <span key={index} className="px-4 py-2 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 border border-emerald-500/30 text-emerald-300 rounded-full font-medium">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Document Sentiment</h3>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl border border-gray-600">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="font-medium text-gray-300">{analysisData.sentiment}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "metrics" && analysisData && (
                    <div className="grid md:grid-cols-3 gap-6">
                      {Object.entries(analysisData.keyMetrics).map(([category, score]) => (
                        <div key={category} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                          <h4 className="font-bold text-white mb-3 capitalize">{category} Score</h4>
                          <div className="relative">
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                            <span className="text-xl font-bold text-white mt-2 block">{score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Premium Toast */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}