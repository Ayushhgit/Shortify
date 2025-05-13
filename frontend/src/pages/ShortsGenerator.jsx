import React, { useState, useRef, useEffect } from "react";
import {
  Home,
  Settings,
  User,
  Video,
  Check,
  Download,
  Share,
} from "lucide-react";

export default function ShortsGenerator() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const clipsRef = useRef(null);

  const handleSubmit = () => {
    if (url.trim()) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setUrl("");
    setSubmitted(false);
  };

  useEffect(() => {
    if (submitted && clipsRef.current) {
      clipsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [submitted]);

  const clips = Array.from({ length: 4 }).map((_, i) => ({
    id: i + 1,
    title: `Clip #${i + 1}`,
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
            <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
              <User className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${!submitted ? "flex items-center justify-center" : "pt-24 pb-16"} px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full`}>
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
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Paste YouTube URL here..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="px-5 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition"
                >
                  Submit
                </button>
                {submitted && (
                  <button
                    onClick={handleReset}
                    className="px-5 py-3 border border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated Clips Section */}
          {submitted && (
            <div ref={clipsRef} className="mt-12">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-indigo-700">
                  Clips from your video
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Auto-generated Shorts in 9:16 format
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {clips.map((clip) => (
                  <div
                    key={clip.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow hover:shadow-md transition"
                  >
                    <div className="aspect-[9/16] bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400 text-sm">
                      {clip.title}
                    </div>
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
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white flex items-center border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center w-full">
          <p className="text-sm text-gray-600">
            &copy; 2025 Shortify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
