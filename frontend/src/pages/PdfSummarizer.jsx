import React, { useState, useRef, useEffect } from "react";
import { Home, Settings, User, Upload, FileText, X, Check, Loader2, Download, Sparkles, Zap, Clock, BarChart3, Eye, Copy, Share2, MessageCircle, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from '../firebase';


// Chat Component
const ChatWithDocument = ({ documentContent, isVisible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const idToken = await getToken();

      const response = await fetch("http://localhost:8000/api/pdf/chat-simple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          document_content: documentContent
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { type: "ai", content: data.response || "Sorry, I couldn't process that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { type: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Chat with Document</h3>
              <p className="text-sm text-gray-400">Ask questions about your PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation about your document!</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${message.type === "user"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
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
  const [showChat, setShowChat] = useState(false);
  const [documentContent, setDocumentContent] = useState("");
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [analysisType, setAnalysisType] = useState("general");
  const [animateResult, setAnimateResult] = useState(false);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();

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

  const handleSubmit = async (event) => {
    try {
      if (event) event.preventDefault();

      const idToken = await getToken();
      if (!idToken) {
        console.error("User not authenticated");
        displayToast("Authentication failed. Please try logging in again.", "error");
        return;
      }

      if (!file) {
        displayToast("Please select a PDF file first", "error");
        return;
      }

      setIsProcessing(true);
      setLoading(true);
      setStep && setStep(3);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("analysis_type", analysisType);

      const response = await fetch('http://localhost:8000/api/pdf/upload-analyze', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("Error data:", errorData);
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(
                (err) => `${err.loc?.join('.')} ${err.msg}`
              ).join(', ');
            } else {
              errorMessage = typeof errorData.detail === 'string'
                ? errorData.detail
                : JSON.stringify(errorData.detail);
            }
          }
        } catch (e) {
          console.error("Failed to parse error response");
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Analysis response:", data);

      setStep && setStep(4);
      setAnimateResult && setAnimateResult(true);
      setResult && setResult(data);

      // Map backend response to frontend expectations
      setSummary(data.summary || "Analysis completed successfully.");

      // FIXED: Store actual document content for chat
      // Check multiple possible fields where the extracted text might be
      const extractedText = data.extracted_text ||
        data.document_content ||
        data.content ||
        data.text ||
        data.analysis_data?.content ||
        "";

      console.log("Extracted text length:", extractedText.length);
      console.log("Extracted text preview:", extractedText.substring(0, 200));

      if (extractedText && extractedText.trim().length > 0) {
        setDocumentContent(extractedText);
      } else {
        // If no text content found, try to extract it separately
        console.warn("No extracted text found in response, attempting separate extraction");
        await extractTextSeparately(file);
      }

      setAnalysisData({
        wordCount: data.analysis_data?.word_count || 0,
        pageCount: data.page_count || 0,
        readingTime: data.analysis_data?.reading_time_minutes || 0,
        complexity: data.analysis_data?.complexity || "Unknown",
        topics: data.analysis_data?.topics || [],
        sentiment: data.analysis_data?.sentiment || "Neutral",
        keyMetrics: {
          technical: data.analysis_data?.technical_score || 0,
          business: data.analysis_data?.business_score || 0,
          academic: data.analysis_data?.academic_score || 0,
        },
        keyPoints: data.analysis_data?.key_points || [],
        documentType: data.analysis_data?.document_type || "document"
      });

      displayToast("PDF analyzed successfully! 🎉");
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      displayToast(`Failed to analyze: ${error.message}`, "error");
      setStep && setStep(2);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setSummary("");
    setAnalysisData(null);
    setDocumentContent("");
    setActiveTab("summary");
    setShowChat(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    displayToast("Summary copied to clipboard! 📋");
  };

  const exportToPDF = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: summary,
          analysisData: analysisData,
          fileName: file.name
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name}_analysis.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        displayToast("Report exported successfully! 📄");
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      displayToast("Export failed. Please try again.", "error");
      console.error("Export error:", error);
    }
  };

  const shareReport = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: summary,
          analysisData: analysisData,
          fileName: file.name
        })
      });

      const data = await response.json();
      if (response.ok) {
        await navigator.clipboard.writeText(data.shareUrl);
        displayToast("Share link copied to clipboard! 🔗");
      } else {
        throw new Error('Share failed');
      }
    } catch (error) {
      displayToast("Share failed. Please try again.", "error");
      console.error("Share error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Premium Glassmorphic Header */}
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <FileText className="h-8 w-8 text-teal-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Summ<span className="text-teal-500">AIze</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[{ icon: Home, path: "/shortify" }, { icon: User, path: "/profile" }, { icon: Settings, path: "/settings" }].map(
              (item, index) => (
                <button
                  key={index}
                  className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                  onClick={() => navigate(item.path)}>
                  <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
                </button>
              )
            )}
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
                <div className={`flex flex-col items-center transition-all duration-500 ${completed ? "text-emerald-400" : "text-gray-500"
                  }`}>
                  <div className={`relative rounded-2xl p-4 border-2 transition-all duration-500 ${completed
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
                  <div className={`mt-1 w-2 h-2 rounded-full transition-all duration-500 ${completed ? "bg-emerald-400 shadow-lg shadow-emerald-500/50" : "bg-gray-600"
                    }`}></div>
                </div>
                {index < 2 && (
                  <div className={`h-1 w-24 mx-6 rounded-full transition-all duration-500 ${completed ? "bg-gradient-to-r from-emerald-500 to-blue-500" : "bg-gray-600"
                    }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Premium File Upload Zone */}
          <div className="max-w-2xl mx-auto mb-12">
            <div
              className={`relative rounded-3xl border-2 border-dashed transition-all duration-500 ${isDragOver
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
              className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${!file || isProcessing
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

            {/* Chat Button - Only show when document is processed and has content */}
            {summary && documentContent && (
              <button
                onClick={() => setShowChat(true)}
                className="group relative overflow-hidden px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center gap-3">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Document
                </div>
              </button>
            )}

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
                      <button
                        onClick={shareReport}
                        className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors"
                      >
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
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${activeTab === id
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
      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <p className="text-gray-300 text-center">
            Made with ❤️ and ☕ for everyone everywhere.
          </p>
        </div>
      </footer>
      {/* Chat Component */}
      <ChatWithDocument
        documentContent={documentContent}
        isVisible={showChat}
        onClose={() => setShowChat(false)}
      />

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