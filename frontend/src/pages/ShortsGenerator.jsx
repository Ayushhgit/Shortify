import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Settings,
  User,
  Video,
  Check,
  Download,
  Share,
  Link as LinkIcon,
  X,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Toast from "../components/Toast";

export default function ShortsGenerator() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputError, setInputError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [videoDetails, setVideoDetails] = useState(null);
  const clipsRef = useRef(null);

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setInputError("");
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();

    if (!url.trim()) {
      setInputError("Please enter a YouTube URL");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setInputError("Please enter a valid YouTube URL");
      return;
    }

    try {
      setIsProcessing(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVideoDetails({
        title: "How to Make Perfect Pasta | Complete Tutorial",
        channelName: "Cooking Masters",
        duration: "18:45",
        publishDate: "May 10, 2025",
        thumbnailUrl: "/api/placeholder/640/360"
      });

      setSubmitted(true);
      displayToast("Shorts generated successfully!");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      displayToast("Error processing video. Please try again.", "error");
      console.error("Error:", error);
    }
  };

  const handleReset = () => {
    setUrl("");
    setSubmitted(false);
    setVideoDetails(null);
    setInputError("");
  };

  useEffect(() => {
    if (submitted && clipsRef.current) {
      clipsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitted]);

  const clips = Array.from({ length: 4 }).map((_, i) => ({
    id: i + 1,
    title: `Clip #${i + 1}`,
    duration: `${Math.floor(Math.random() * 50) + 10}s`,
    highlight: [
      "Perfect pasta cooking technique",
      "Secret ingredient revealed",
      "Professional chef tips",
      "Common mistakes to avoid"
    ][i],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-indigo-500 mr-2" />
            <span className="text-xl font-bold text-gray-900">
              Short<span className="text-indigo-500">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/shortify">
              <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
                <Home className="h-5 w-5 text-gray-600" />
              </button>
            </a>
            <Link to="/Profile">
              <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
                <User className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 flex ${submitted ? "flex-col pt-24" : "items-center justify-center"} px-4 sm:px-6 lg:px-8`}>
        <div className={`max-w-7xl mx-auto w-full ${submitted ? "" : "py-30"}`}>
          <div className="w-full">
            {/* Heading */}
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
                Short<span className="text-indigo-500">ify</span>
              </h1>
              <p className="mt-3 text-lg text-gray-600">
                Convert YouTube videos into scroll-stopping Shorts
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center mb-10">
              <div className={`flex items-center ${url ? "text-indigo-500" : "text-gray-500"}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${url ? "border-indigo-500 bg-indigo-100" : "border-gray-300"}`}>
                  {url ? <Check className="h-5 w-5" /> : "1"}
                </div>
                <span className="ml-2 font-medium">Paste URL</span>
              </div>
              <div className="h-1 w-12 mx-4 bg-gray-200"></div>
              <div className={`flex items-center ${submitted ? "text-indigo-500" : "text-gray-500"}`}>
                <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${submitted ? "border-indigo-500 bg-indigo-100" : "border-gray-300"}`}>
                  {submitted ? <Check className="h-5 w-5" /> : "2"}
                </div>
                <span className="ml-2 font-medium">Generate</span>
              </div>
              <div className="h-1 w-12 mx-4 bg-gray-200"></div>
              <div className="flex items-center text-gray-500">
                <div className="rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-300">3</div>
                <span className="ml-2 font-medium">Download</span>
              </div>
            </div>

            {/* Input Section */}
            <div className="max-w-xl mx-auto mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={handleUrlChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Paste YouTube URL here..."
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      inputError ? "border-red-300" : "border-gray-300"
                    } rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white`}
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {inputError && (
                  <p className="text-sm text-red-600 mt-1">{inputError}</p>
                )}

                <div className="flex justify-center gap-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`flex items-center justify-center px-5 py-3 rounded-xl font-medium transition ${
                      isProcessing
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                  {submitted && !isProcessing && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Video Details Section (appears after processing) */}
            {videoDetails && submitted && (
              <div className="max-w-3xl mx-auto mb-8 animate-fade-in">
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
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
                      <h3 className="text-lg font-semibold line-clamp-2">
                        {videoDetails.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {videoDetails.channelName}
                      </p>
                      <div className="flex space-x-4 text-xs text-gray-500 mt-2">
                        <span>{videoDetails.duration}</span>
                        <span>{videoDetails.publishDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Clips Section */}
            {submitted && (
              <div ref={clipsRef} className="mt-12 animate-fade-in pb-16">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-indigo-700">
                    Clips from your video
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Auto-generated Shorts in 9:16 format
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {clips.map((clip, index) => (
                    <div
                      key={clip.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow hover:shadow-md transition animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-sm relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 rounded-lg"></div>
                        <div className="absolute bottom-2 left-2 text-white text-xs">
                          {clip.duration}
                        </div>
                        <PlayCircle className="w-12 h-12 text-white/80" />
                      </div>
                      <h4 className="font-medium text-sm mb-1">{clip.title}</h4>
                      <p className="text-xs text-gray-600 mb-3">{clip.highlight}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <button
                            className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            className="p-2 bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition"
                            title="Share"
                          >
                            <Share size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works Section */}
            {!submitted && (
              <div className="max-w-4xl mx-auto mt-16">
                <h2 className="text-2xl font-bold text-center mb-8">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <LinkIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Paste Link</h3>
                    <p className="text-gray-600">
                      Simply paste any YouTube video URL to get started
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
                    <p className="text-gray-600">
                      Our AI analyzes the video and creates engaging short clips
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                    <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                      <Check className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Get Shorts</h3>
                    <p className="text-gray-600">
                      Download ready-to-upload shorts for any platform
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white flex items-center border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center w-full">
          <p className="text-sm text-gray-600">
            &copy; 2025 Shortify. All rights reserved.
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

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}