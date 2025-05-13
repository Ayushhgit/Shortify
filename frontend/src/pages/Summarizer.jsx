import React, { useState } from "react";
import { Link2, Home, Settings, User, PlayCircle, Link, Loader2, Check, X } from "lucide-react";
import Toast from "../components/Toast";

export default function YouTubeSummarizer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [inputError, setInputError] = useState("");

  // Display toast notification
  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Handle URL input change
  const handleUrlChange = (event) => {
    setYoutubeUrl(event.target.value);
    setInputError("");
  };

  // Validate YouTube URL
  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  // Clear all data
  const handleClear = () => {
    setYoutubeUrl("");
    setSummary("");
    setVideoDetails(null);
    setInputError("");
  };

  // Handle form submission
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
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful response with video details and summary
      setVideoDetails({
        title: "Understanding AI: A Comprehensive Overview",
        channelName: "Tech Insights",
        duration: "14:22",
        publishDate: "May 5, 2025",
        thumbnailUrl: "/api/placeholder/640/360"
      });
      
      setSummary("This video provides a comprehensive overview of artificial intelligence and its applications. Key points include:\n\n• The evolution of AI from rule-based systems to machine learning and deep learning\n• How neural networks mimic human brain functionality\n• The importance of training data quality and potential biases\n• Practical applications in healthcare, transportation, and customer service\n• Ethical considerations and challenges in AI development\n• Future trends including multimodal AI systems and human-AI collaboration\n\nThe creator emphasizes that while AI has made tremendous progress, truly general artificial intelligence remains a challenge for the future. The video concludes by discussing the importance of responsible AI development practices.");
      
      displayToast("Video summarized successfully!");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      displayToast("Error processing video. Please try again.", "error");
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link2 className="h-8 w-8 text-green-500 mr-2" />
              <span className="text-xl font-bold text-gray-900">
                Summ<span className="text-green-500">lytic</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/shortify">
                <button 
                  className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition" 
                  aria-label="Home">
                  <Home className="h-5 w-5 text-gray-600" />
                </button>
              </a>
              <button 
                className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition" 
                aria-label="User profile">
                <User className="h-5 w-5 text-gray-600" />
              </button>
              <button 
                className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition" 
                aria-label="Settings">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
            Summ<span className="text-green-500">lytic</span>
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Transform YouTube videos into concise, actionable summaries.
          </p>
        </div>

        {/* YouTube URL Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={youtubeUrl}
                onChange={handleUrlChange}
                placeholder="Paste YouTube video URL here"
                className={`block w-full pl-10 pr-4 py-3 border ${inputError ? 'border-red-300' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 bg-white`}
              />
              {youtubeUrl && (
                <button
                  type="button"
                  onClick={() => setYoutubeUrl("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {inputError && (
              <p className="text-sm text-red-600 mt-1">{inputError}</p>
            )}
            
            <div className="flex justify-center gap-4">
              <button
                type="submit"
                disabled={isProcessing}
                className={`flex items-center justify-center py-2 px-6 rounded-md font-medium transition 
                  ${isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Summarize Video'
                )}
              </button>
              
              {youtubeUrl && !isProcessing && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 px-6 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Video Preview & Summary Results */}
        {videoDetails && summary && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 mb-6">
              {/* Video Details */}
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5">
                  <div className="relative pb-[56.25%] bg-gray-200">
                    <img 
                      src={videoDetails.thumbnailUrl} 
                      alt="Video thumbnail" 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-16 h-16 text-white opacity-80" />
                    </div>
                  </div>
                </div>
                <div className="p-4 md:w-3/5">
                  <h3 className="text-lg font-semibold line-clamp-2">{videoDetails.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{videoDetails.channelName}</p>
                  <div className="flex space-x-4 text-xs text-gray-500 mt-2">
                    <span>{videoDetails.duration}</span>
                    <span>{videoDetails.publishDate}</span>
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="p-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line">{summary}</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button className="text-gray-700 border border-gray-300 hover:bg-gray-100 py-2 px-4 rounded transition text-sm">
                  Copy Summary
                </button>
                <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition text-sm">
                  Download as Text
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Features Section */}
        {!summary && (
          <div className="max-w-4xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Link className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Paste Link</h3>
                <p className="text-gray-600">Simply paste any YouTube video URL to get started</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
                <p className="text-gray-600">Our AI analyzes the video content and extracts key points</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Get Summary</h3>
                <p className="text-gray-600">Receive a concise summary with all the essential information</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white flex items-center border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">&copy; 2025 Shortify. All rights reserved.</p>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}