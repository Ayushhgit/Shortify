import React, { useState, useRef } from 'react';
import { ChevronDown, Video, Download, Play, AlertCircle, Loader2, Home, User, Settings, Sparkles, FileVideo } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from "../firebase";

const API_BASE_URL = "http://kwixlab.com:8000";

const LoadingSpinner = () => (
    <div className="relative">
        <Video className="w-6 h-6 text-blue-400 animate-pulse" />
        <div className="absolute inset-0 w-6 h-6 animate-spin">
            <div className="w-full h-full border-2 border-transparent border-t-blue-400 rounded-full"></div>
        </div>
    </div>
);

// A dedicated component to display errors cleanly
const ErrorDisplay = ({ message }) => {
    if (!message) return null;
    return (
        <div className="mt-6 flex items-center space-x-3 text-red-300 bg-red-500/20 p-4 rounded-2xl border border-red-400/30 animate-pulse">
            <AlertCircle className="w-6 h-6" />
            <span className="text-lg">{message}</span>
        </div>
    );
};

export default function ClipGenerator() {
    const [topic, setTopic] = useState("how diamonds are formed in Minecraft");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [step, setStep] = useState(1);
    const [animateResult, setAnimateResult] = useState(false);
    const videoRef = useRef(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const navigate = useNavigate();

    const displayToast = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const handleSubmit = async (event) => {
        const idToken = await getToken();
        if (!idToken) {
            console.error("User not authenticated");
            displayToast("Authentication failed. Please try logging in again.", "error");
            return;
        }
        event.preventDefault();

        if (!topic.trim()) {
            setError("Please enter a topic to generate a video.");
            return;
        }

        // Reset UI state for the new request
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setStep(2);

        try {
            const response = await fetch(`${API_BASE_URL}/clip/generate-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || `Request failed with status: ${response.status}`);
            }

            const result = await response.json();
            const fullVideoUrl = `${API_BASE_URL}/clip${result.video_url}`;
            setVideoUrl(fullVideoUrl);
            setStep(3);
            setAnimateResult(true);

        } catch (err) {
            console.error("An error occurred during video generation:", err);
            setError(err.message || "An unknown error occurred. Make sure the backend is running and reachable.");
            setStep(1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        const safeTopic = topic.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        link.setAttribute('download', `video_${safeTopic}.mp4`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-10 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
                </div>
            </div>

            {/* Header */}
            <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
                <div className="flex justify-between items-center h-16 px-6">
                    <div className="flex items-center">
                        <div className="relative">
                            <Video className="h-8 w-8 text-blue-400 mr-3 animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-xl font-bold text-white">
                            Clip<span className="text-blue-400">Over</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {[
                            { icon: Home, href: "/shortify" },
                            { icon: User, href: "/profile" },
                            { icon: Settings, href: "/settings" },
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
                    {step === 1 && (
                        <>
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6 animate-pulse">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    AI-Powered Video Generation
                                </div>
                                <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                                    Create Amazing
                                    <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Video Content
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                                    Generate professional videos with AI-powered voiceover and captions from any topic
                                </p>
                            </div>

                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8 hover:bg-white/15 transition-all duration-300">
                                    <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                                        <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                                            <Video className="w-8 h-8 text-blue-400" />
                                        </div>
                                        Video Configuration
                                    </h2>

                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-300 mb-4">
                                                Video Topic
                                            </label>
                                            <textarea
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="Enter your video topic (e.g., 'the history of ancient Rome', 'how photosynthesis works', 'introduction to machine learning')"
                                                rows="4"
                                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm text-lg resize-none hover:bg-white/15 transition-all duration-200"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* Video Features */}
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="p-6 border-2 border-blue-400/30 bg-blue-500/20 rounded-2xl">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                                        <Video className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-semibold text-white block">
                                                            AI Voiceover
                                                        </span>
                                                        <span className="text-sm text-gray-400">
                                                            Natural voice narration
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 border-2 border-purple-400/30 bg-purple-500/20 rounded-2xl">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                                        <FileVideo className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-semibold text-white block">
                                                            Auto Captions
                                                        </span>
                                                        <span className="text-sm text-gray-400">
                                                            Synchronized subtitles
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 border-2 border-pink-400/30 bg-pink-500/20 rounded-2xl">
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-3 bg-pink-500/20 rounded-xl">
                                                        <Download className="w-6 h-6 text-pink-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-semibold text-white block">
                                                            HD Export
                                                        </span>
                                                        <span className="text-sm text-gray-400">
                                                            High quality MP4
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <ErrorDisplay message={error} />

                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="w-full mt-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 disabled:from-blue-400 disabled:via-purple-400 disabled:to-pink-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg"
                                    >
                                        <div className="flex items-center justify-center space-x-3">
                                            <Video className="w-6 h-6" />
                                            <span>Generate Video</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Loading State */}
                    {step === 2 && isLoading && (
                        <div className="max-w-2xl mx-auto text-center space-y-8">
                            <div className="space-y-6">
                                <div className="relative">
                                    <Video className="w-20 h-20 text-blue-400 mx-auto animate-pulse" />
                                    <div className="absolute inset-0 w-20 h-20 mx-auto animate-spin">
                                        <div className="w-full h-full border-4 border-transparent border-t-blue-400 rounded-full"></div>
                                    </div>
                                </div>
                                <h2 className="text-4xl font-bold text-white">
                                    Creating Your Video
                                </h2>
                                <p className="text-gray-300 text-xl">
                                    Our AI is generating your masterpiece with voiceover and captions...
                                </p>
                            </div>

                            {/* Loading Progress */}
                            <div className="space-y-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <div className="space-y-4">
                                        {[
                                            "Analyzing your topic...",
                                            "Generating script content...",
                                            "Creating voiceover audio...",
                                            "Adding captions and effects...",
                                            "Finalizing video export..."
                                        ].map((text, index) => (
                                            <div key={index} className="flex items-center space-x-3">
                                                <div
                                                    className={`w-4 h-4 rounded-full transition-all duration-500 ${index < 3
                                                        ? "bg-blue-400"
                                                        : index === 3
                                                            ? "bg-blue-400 animate-pulse"
                                                            : "bg-gray-600"
                                                        }`}
                                                ></div>
                                                <span className="text-gray-300">{text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-6 w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 animate-pulse" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Video Result */}
                    {step === 3 && videoUrl && !isLoading && (
                        <div
                            className={`space-y-8 transition-all duration-1000 ${animateResult
                                ? "opacity-100 transform translate-y-0"
                                : "opacity-0 transform translate-y-10"
                                }`}
                        >
                            <div className="text-center space-y-6">
                                <h2 className="text-4xl font-bold text-white">
                                    Your Video is Ready!
                                </h2>
                                <div className="inline-flex items-center px-6 py-3 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold text-lg animate-pulse">
                                    <Play className="w-5 h-5 mr-2" />
                                    AI Generated • HD Quality
                                </div>
                            </div>

                            <div className="max-w-4xl mx-auto">
                                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                                    <div className="aspect-video bg-black/50 rounded-2xl overflow-hidden border-2 border-white/20 mb-6">
                                        <video
                                            ref={videoRef}
                                            src={videoUrl}
                                            controls
                                            autoPlay
                                            className="w-full h-full"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
                                        >
                                            <div className="flex items-center justify-center space-x-3">
                                                <Download className="w-5 h-5" />
                                                <span>Download MP4</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setStep(1);
                                                setVideoUrl(null);
                                                setError(null);
                                                setAnimateResult(false);
                                            }}
                                            className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
                                        >
                                            <div className="flex items-center justify-center space-x-3">
                                                <Video className="w-5 h-5" />
                                                <span>Create Another Video</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
                    <p className="text-gray-300 text-center">
                        Made with ❤️ and 🎬 for creative storytelling.
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