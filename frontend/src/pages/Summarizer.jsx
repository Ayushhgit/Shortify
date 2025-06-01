import React, { useState } from "react";
import {
  Link2, Home,
  Settings, User,
  PlayCircle,
  Loader2, Check, X, Sparkles
} from "lucide-react";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function YouTubeSummarizer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [inputError, setInputError] = useState("");

  const navigate = useNavigate();

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleUrlChange = (event) => {
    setYoutubeUrl(event.target.value);
    setInputError("");
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleClear = () => {
    setYoutubeUrl("");
    setSummary("");
    setVideoDetails(null);
    setInputError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!youtubeUrl.trim()) {
      setInputError("Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setInputError("Please enter a valid YouTube URL");
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch('http://localhost:8000/api/ytSummary/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Server error:', errorData);
        displayToast(`Error: ${errorData.detail || response.status}`, "error");
        setIsProcessing(false);
        return;
      }

      const data = await response.json();

      if (data && data.videoDetails) {
        setVideoDetails({
          title: data.videoDetails.title,
          channelName: data.videoDetails.channelName,
          duration: data.videoDetails.duration,
          publishDate: data.videoDetails.publishDate,
          thumbnailUrl: data.videoDetails.thumbnailUrl
        });
      }

      setSummary(data.summary);
      displayToast("Video summarized successfully!");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      console.error("Network/Parse error:", error);
      displayToast("Network error. Please try again.", "error");
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      displayToast("Summary copied to clipboard!");
    } catch (error) {
      displayToast("Failed to copy summary", "error");
    }
  };

  const handleDownloadSummary = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${videoDetails?.title || 'video'}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    displayToast("Summary downloaded successfully!");
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Link2 className="h-8 w-8 text-purple-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Summ<span className="text-purple-400">lytic</span>
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
                className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10" onClick={() => navigate(item.href)}>
                <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Video Summarization
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Transform Videos
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Into Insights
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get instant, AI-driven summaries from YouTube videos to save time and extract key information
            </p>
          </div>

          {/* YouTube URL Input */}
          <div className="max-w-2xl mx-auto mb-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Link2 className="h-6 w-6 text-purple-400" />
                </div>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={handleUrlChange}
                  placeholder="Paste YouTube video URL here..."
                  className={`block w-full pl-14 pr-12 py-4 border-2 ${inputError ? "border-red-400/50" : "border-white/30"
                    } rounded-2xl shadow-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 text-lg font-medium hover:bg-white/20 transition-all duration-300`}
                />
                {youtubeUrl && (
                  <button
                    type="button"
                    onClick={() => setYoutubeUrl("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 hover:scale-110 transition-transform"
                  >
                    <X className="h-6 w-6 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>

              {inputError && (
                <p className="text-red-400 text-center font-medium">{inputError}</p>
              )}

              <div className="flex justify-center gap-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`group relative px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isProcessing
                    ? "bg-gray-600/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-lg">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg">Summarize Video</span>
                      </>
                    )}
                  </div>
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  )}
                </button>

                {youtubeUrl && !isProcessing && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-8 py-4 border-2 border-white/30 rounded-2xl text-white font-bold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Video Summary Section */}
          {videoDetails && summary && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-6">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-2/5">
                    <div className="relative pb-[56.25%] bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <img
                        src={videoDetails.thumbnailUrl}
                        alt="Video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover rounded-tl-3xl lg:rounded-bl-3xl lg:rounded-tr-none"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-tl-3xl lg:rounded-bl-3xl lg:rounded-tr-none">
                        <PlayCircle className="w-20 h-20 text-white opacity-80" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 lg:w-3/5">
                    <h3 className="text-xl font-bold text-white line-clamp-2 mb-2">
                      {videoDetails.title}
                    </h3>
                    <p className="text-purple-300 font-medium mb-3">
                      {videoDetails.channelName}
                    </p>
                    <div className="flex space-x-4 text-sm text-gray-300">
                      <span className="bg-white/10 px-3 py-1 rounded-full">{videoDetails.duration}</span>
                      <span className="bg-white/10 px-3 py-1 rounded-full">{videoDetails.publishDate}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-white/20">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">AI Summary</h2>
                  </div>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-line text-gray-200 leading-relaxed text-lg">{summary}</div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/20 flex justify-end space-x-4">
                  <button className="px-6 py-3 text-white border-2 border-white/30 hover:bg-white/20 rounded-xl transition-all duration-300 font-medium backdrop-blur-sm"
                    onClick={handleCopySummary}>
                    Copy Summary
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 font-medium hover:scale-105"
                    onClick={handleDownloadSummary}>
                    Download as Text
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* How It Works Section */}
          {!summary && (
            <div className="max-w-5xl mx-auto mt-20">
              <h2 className="text-3xl font-bold text-center mb-12 text-white">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: Link2, title: "Paste Link", desc: "Simply paste any YouTube video URL to get started", color: "from-purple-500 to-purple-600" },
                  { icon: Loader2, title: "AI Processing", desc: "Our AI analyzes the video content and extracts key points", color: "from-pink-500 to-pink-600" },
                  { icon: Check, title: "Get Summary", desc: "Receive a concise summary with all the essential information", color: "from-blue-500 to-blue-600" }
                ].map((item, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20 text-center hover:scale-105 transition-all duration-300 hover:bg-white/20">
                    <div className={`bg-gradient-to-r ${item.color} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-white">{item.title}</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <p className="text-gray-300">
            &copy; 2025 Summlytic. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Toast */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}