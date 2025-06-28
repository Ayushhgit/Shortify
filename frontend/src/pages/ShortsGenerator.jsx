import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Settings,
  User,
  Video, ArrowRight, Clock, AlertCircle,
  Check,
  Sparkles, RotateCcw, Shield,
  Download,
  Share,
  Link as LinkIcon,
  X,
  Zap,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from "../firebase";

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
  const [clips, setClips] = useState([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");

  const navigate = useNavigate();

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}.*$/;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
    setInputError("");
  };

  // Extract YouTube video ID from URL
  const extractVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Fetch YouTube video metadata using oEmbed
  const fetchVideoMetadata = async (url) => {
    try {
      const videoId = extractVideoId(url);
      if (!videoId) throw new Error("Could not extract video ID");

      const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oEmbedUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch video metadata");
      }

      const data = await response.json();

      return {
        title: data.title,
        channelName: data.author_name,
        thumbnailUrl: data.thumbnail_url,
        duration: "N/A", // oEmbed doesn't provide duration
        publishDate: new Date().toLocaleDateString(),
      };
    } catch (error) {
      console.error("Error fetching video metadata:", error);
      // Return default values if metadata fetching fails
      return {
        title: "YouTube Video",
        channelName: "YouTube Channel",
        duration: "N/A",
        publishDate: new Date().toLocaleDateString(),
        thumbnailUrl: "/assets/yt.webp",
      };
    }
  };

  // Get dynamic progress messages based on progress percentage
  const getProgressMessage = (progress) => {
    const messages = {
      0: "Initializing task...",
      5: "Task received by server...",
      10: "Analyzing YouTube URL...",
      15: "Extracting video information...",
      20: "Downloading video content...",
      35: "Video download in progress...",
      50: "Processing audio stream...",
      60: "Analyzing energy levels...",
      70: "Detecting best segments...",
      80: "Creating short clips...",
      90: "Finalizing output...",
      95: "Almost there...",
      100: "Processing complete!",
    };

    // Find the closest message
    let currentMessage = messages[0];
    for (const [threshold, message] of Object.entries(messages)) {
      if (progress >= parseInt(threshold)) {
        currentMessage = message;
      }
    }

    return currentMessage;
  };

  const handleSubmit = async (event) => {
    try {
      const idToken = await getToken();
      if (!idToken) {
        console.error("User not authenticated");
        displayToast(
          "Authentication failed. Please try logging in again.",
          "error"
        );
        return;
      }

      if (event) event.preventDefault();

      if (!url.trim()) {
        setInputError("Please enter a YouTube URL");
        return;
      }

      if (!isValidYouTubeUrl(url)) {
        setInputError("Please enter a valid YouTube URL");
        return;
      }

      setIsProcessing(true);
      setSubmitted(false);
      setVideoDetails(null);
      setProcessingProgress(0);
      setProcessingMessage(getProgressMessage(0));

      // Ensure URL has protocol
      let formattedUrl = url.trim();
      if (
        !formattedUrl.startsWith("http://") &&
        !formattedUrl.startsWith("https://")
      ) {
        formattedUrl = "https://" + formattedUrl;
      }

      // Fetch video metadata in parallel with processing
      const metadataPromise = fetchVideoMetadata(formattedUrl);

      // Debug logging
      console.log("Original URL:", url);
      console.log("Formatted URL:", formattedUrl);
      console.log("Is valid YouTube URL:", isValidYouTubeUrl(formattedUrl));

      // Request body structure - simplified to match what server expects
      const requestBody = {
        url: formattedUrl,
        use_whisper: true,
        use_gpt: true,
      };

      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      // Initial progress
      setProcessingProgress(5);
      setProcessingMessage(getProgressMessage(5));

      // Step 1: Send URL to backend
      const response = await fetch(
        "https://kwixlab.com/api/shorts/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      setProcessingProgress(10);
      setProcessingMessage(getProgressMessage(10));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log("Error data:", errorData); // Log full error for debugging

          // Handle Pydantic validation errors
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail
                .map((err) => `${err.loc?.join(".")} ${err.msg}`)
                .join(", ");
            } else if (typeof errorData.detail === "string") {
              errorMessage = errorData.detail;
            } else {
              errorMessage = JSON.stringify(errorData.detail);
            }
          }
        } catch (e) {
          console.error("Failed to parse error response");
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { task_id } = data;

      if (!task_id) throw new Error("Failed to get task ID.");

      // Step 2: Poll the task status with progress updates
      let status = "pending";
      let result = null;
      let pollCount = 0;

      while (status !== "completed") {
        const pollRes = await fetch(
          `https://kwixlab.com/api/shorts/status/${task_id}`
        );

        if (!pollRes.ok) {
          throw new Error(`HTTP error! status: ${pollRes.status}`);
        }

        const statusData = await pollRes.json();
        status = statusData.status;

        // Update progress based on backend status
        if (statusData.progress) {
          setProcessingProgress(statusData.progress);
          setProcessingMessage(getProgressMessage(statusData.progress));
        } else {
          // Estimate progress based on time elapsed
          const estimatedProgress = Math.min(15 + pollCount * 5, 90);
          setProcessingProgress(estimatedProgress);
          setProcessingMessage(getProgressMessage(estimatedProgress));
        }

        if (status === "completed") {
          result = statusData.result;
          setProcessingProgress(95);
          setProcessingMessage(getProgressMessage(95));
          break;
        } else if (status === "failed") {
          throw new Error(statusData.error || "Task failed on the server");
        }

        pollCount++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Step 3: Get the metadata we were fetching in parallel
      const metadata = await metadataPromise;
      setVideoDetails(metadata);

      setProcessingProgress(100);
      setProcessingMessage(getProgressMessage(100));

      setClips(result.clips);
      setSubmitted(true);
      displayToast("Shorts generated successfully!");
    } catch (error) {
      console.error("Error:", error);
      displayToast(`Failed to generate shorts: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setSubmitted(false);
    setVideoDetails(null);
    setInputError("");
    setClips([]);
  };

  useEffect(() => {
    if (submitted && clipsRef.current) {
      clipsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitted]);

  // Skeleton loader component
  const ClipSkeleton = () => (
    <div className="bg-white border rounded-xl shadow p-4 animate-pulse">
      <div className="rounded-lg w-full aspect-[9/16] bg-gray-300"></div>
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
      <div className="flex justify-between mt-3">
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );

  // Progress Bar component
  const ProgressBar = ({ progress, message }) => (
    <div className="mt-4 space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-indigo-400 opacity-20 animate-pulse"></div>
        </div>
      </div>
      <p className="text-sm text-gray-600 text-center font-medium">{message}</p>
      <p className="text-xs text-gray-500 text-center">{progress}% complete</p>
    </div>
  );

  return (
    <div className="min-h-screen flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      {/* Add CSS animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out forwards;
          }
        `,
        }}
      />

      {/*Background animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Video className="h-8 w-8 text-purple-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Short<span className="text-purple-400">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[
              { icon: Home, path: "/shortify" },
              { icon: User, path: "/profile" },
              { icon: Settings, path: "/settings" },
            ].map((item, index) => (
              <button
                key={index}
                className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 flex ${submitted ? "flex-col pt-24" : "items-center justify-center"
          } px-4 sm:px-6 lg:px-8`}
      >
        <div className={`max-w-7xl mx-auto w-full ${submitted ? "" : "py-30"}`}>
          <div className="w-full">
            {/* Heading */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">
                  Powered by Advanced AI
                </span>
              </div>
              <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-white to-purple-400 text-transparent bg-clip-text tracking-tight mb-6">
                Short
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  ify
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Experience the future of content with smart clip detection,
                instant highlights, and engagement-boosting edits.
              </p>
            </div>

            {/* Step Indicator */}
            <div className="flex justify-center items-center mb-10">
              <div
                className={`flex items-center ${url ? "text-indigo-500" : "text-gray-500"
                  }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${url ? "border-indigo-500 bg-indigo-100" : "border-gray-300"
                    }`}
                >
                  {url ? <Check className="h-5 w-5" /> : "1"}
                </div>
                <span className="ml-2 font-medium">Paste URL</span>
              </div>
              <div className="h-1 w-12 mx-4 bg-gray-200"></div>
              <div
                className={`flex items-center ${submitted ? "text-indigo-500" : "text-gray-500"
                  }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${submitted
                    ? "border-indigo-500 bg-indigo-100"
                    : "border-gray-300"
                    }`}
                >
                  {submitted ? <Check className="h-5 w-5" /> : "2"}
                </div>
                <span className="ml-2 font-medium">Generate</span>
              </div>
              <div className="h-1 w-12 mx-4 bg-gray-200"></div>
              <div className="flex items-center text-gray-500">
                <div className="rounded-full h-8 w-8 flex items-center justify-center border-2 border-gray-300">
                  3
                </div>
                <span className="ml-2 font-medium">Download</span>
              </div>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-16">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input Container */}
                <div className="relative group">
                  {/* Animated background glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Input field */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <LinkIcon className="h-5 w-5 text-indigo-500" />
                        </div>
                      </div>

                      <input
                        type="text"
                        value={url}
                        onChange={handleUrlChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Paste your YouTube URL here..."
                        className={`block w-full pl-20 pr-16 py-5 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-300 text-white ${inputError ? "text-red-400" : ""
                          }`}
                      />

                      {/* Clear button */}
                      {url && (
                        <button
                          type="button"
                          onClick={() => setUrl("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-6 group/clear"
                        >
                          <div className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200">
                            <X className="h-5 w-5 text-gray-400 group-hover/clear:text-white" />
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Animated border bottom */}
                    <div className={`h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transform origin-left transition-transform duration-300 ${url ? "scale-x-100" : "scale-x-0"
                      }`}></div>
                  </div>
                </div>

                {/* Error message */}
                {inputError && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{inputError}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${isProcessing
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                      }`}
                  >
                    {/* Button background animation */}
                    {!isProcessing && (
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    )}

                    <div className="relative flex items-center justify-center gap-3">
                      {isProcessing ? (
                        <>
                          <div className="relative">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse opacity-50"></div>
                          </div>
                          <span>Processing Magic...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5 group-hover:animate-pulse" />
                          <span>Generate Shorts</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </>
                      )}
                    </div>
                  </button>

                  {/* Reset button */}
                  {submitted && !isProcessing && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="group px-6 py-4 border-2 border-red-300 text-red-600 rounded-2xl hover:bg-red-50 hover:border-red-400 transition-all duration-300 font-semibold flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Enhanced Progress Bar */}
                {isProcessing && (
                  <div className="mt-8 space-y-4">
                    {/* Progress container */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
                      {/* Progress header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-ping opacity-50"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {processingMessage}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-600">
                          {processingProgress}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
                          style={{ width: `${processingProgress}%` }}
                        >
                          {/* Moving shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                        </div>
                      </div>

                      {/* Processing steps */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className={`text-center p-2 rounded-lg transition-colors duration-300 ${processingProgress >= 33 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                          <div className="flex items-center justify-center gap-1">
                            {processingProgress >= 33 ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>Analyzing</span>
                          </div>
                        </div>
                        <div className={`text-center p-2 rounded-lg transition-colors duration-300 ${processingProgress >= 66 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                          <div className="flex items-center justify-center gap-1">
                            {processingProgress >= 66 ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>Creating</span>
                          </div>
                        </div>
                        <div className={`text-center p-2 rounded-lg transition-colors duration-300 ${processingProgress >= 100 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                          <div className="flex items-center justify-center gap-1">
                            {processingProgress >= 100 ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span>Finalizing</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Trust indicators */}
              <div className="mt-12 flex justify-center items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Secure Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Lightning Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-500" />
                  <span>HD Quality</span>
                </div>
              </div>
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

            {/* Skeleton Loader */}
            {isProcessing && (
              <div ref={clipsRef} className="mt-12 pb-16">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-indigo-700">
                    Generating your shorts...
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    This may take a few moments
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <ClipSkeleton key={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Generated Clips Section */}
            {submitted && clips.length > 0 && !isProcessing && (
              <div ref={clipsRef} className="mt-12 animate-fade-in pb-16">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-indigo-700">
                    Clips from your video
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Auto-generated Shorts in 9:16 format
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {clips.map((clip, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 hover:shadow-md transition p-4"
                    >
                      <video
                        controls
                        className="rounded-lg w-full aspect-[9/16] bg-black"
                        src={`https://kwixlab.com${clip.url}`}
                      />
                      <div className="mt-3 text-sm text-gray-700">
                        <div>
                          ⏱ {clip.start} - {clip.end}
                        </div>
                        <div>
                          🎯 Confidence: {(clip.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <a
                          href={`https://kwixlab.com${clip.url}`}
                          download
                          className="text-indigo-600 hover:underline"
                        >
                          <Download className="inline w-4 h-4 mr-1" /> Download
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://kwixlab.com${clip.url}`
                            );
                            displayToast(
                              "Link copied to clipboard!",
                              "success"
                            );
                          }}
                          className="hover:text-indigo-600"
                        >
                          <Share className="inline w-4 h-4 mr-1" /> Copy Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How It Works Section */}
            {!submitted && (
              <div className="max-w-6xl mx-auto mt-20">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-6">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-indigo-400 font-medium text-sm uppercase tracking-wide">
                      Simple Process
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent mb-4">
                    How It Works
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Transform your long-form content into viral shorts in just
                    three simple steps
                  </p>
                </div>

                <div className="relative">
                  {/* Connection Line */}
                  <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                    <div className="flex justify-between items-center px-8">
                      <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 to-indigo-400"></div>
                      <div className="w-32 h-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-purple-300"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {/* Step 1 */}
                    <div className="group relative">
                      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        {/* Step Number */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                            1
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="relative mb-6">
                          <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/50 dark:to-indigo-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <LinkIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          {/* Floating particles */}
                          <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                        </div>

                        <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                          Paste Your Link
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Simply paste any YouTube video URL and our AI will
                          instantly analyze your content for the best moments
                        </p>

                        {/* Decorative element */}
                        <div className="mt-6 flex justify-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-1 bg-indigo-300 rounded-full"></div>
                            <div className="w-4 h-1 bg-indigo-400 rounded-full"></div>
                            <div className="w-2 h-1 bg-indigo-300 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="group relative">
                      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        {/* Step Number */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                            2
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="relative mb-6">
                          <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                          </div>
                          {/* Animated sparkles */}
                          <div className="absolute -top-1 -right-1 w-3 h-3">
                            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                          </div>
                        </div>

                        <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                          AI Magic Processing
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Our advanced AI analyzes your video, identifies viral
                          moments, and creates engaging short clips
                          automatically
                        </p>

                        {/* Processing indicator */}
                        <div className="mt-6 flex justify-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-1 bg-purple-300 rounded-full animate-pulse"></div>
                            <div
                              className="w-2 h-1 bg-purple-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-1 bg-purple-500 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="group relative">
                      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300">
                        {/* Step Number */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                            3
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="relative mb-6">
                          <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                          {/* Success indicator */}
                          <div className="absolute -bottom-1 -right-1">
                            <Check className="w-4 h-4 text-green-500 bg-white dark:bg-gray-900 rounded-full p-0.5" />
                          </div>
                        </div>

                        <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                          Download & Share
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          Get your perfectly crafted shorts ready for TikTok,
                          Instagram, YouTube, and all major platforms
                        </p>

                        {/* Platform indicators */}
                        <div className="mt-6 flex justify-center">
                          <div className="flex space-x-1">
                            <div className="w-2 h-1 bg-green-300 rounded-full animate-pulse"></div>
                            <div
                              className="w-2 h-1 bg-green-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-1 bg-green-500 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="h-16 flex items-center justify-center border-t border-gray-900 bg-gray-950/90 backdrop-blur-xl mt-16">
        <div className="flex items-center gap-2 text-gray-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Made with ❤️ and ☕.</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

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

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
