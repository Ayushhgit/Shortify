import { useState, useEffect } from "react";
import {
  Home, Youtube, Video,
  FileText, Zap, User, Github, Menu, X, Sparkles,
  ArrowRight, Play, Download, Eye, Cpu, Brain, Rocket, Target, TrendingUp, CheckCircle
} from "lucide-react";
import { auth } from "../firebase";
import { onAuthStateChanged, sendEmailVerification, signOut, } from "firebase/auth";
import AuthModalSystem from "../components/AuthModalSystem";

export default function ShortifyPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.emailVerified) {
        signOut(auth); // force logout if not verified
        setUser(null);
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAuthSuccess = (user, userData) => {
    setUser(user);
    closeModal();
  };

  const getTitle = () => {
    switch (activeTab) {
      case "home":
        return "Neural Dashboard";
      case "shorts":
        return "Shorts Generator";
      case "summarizer":
        return "YouTube Summarizer";
      case "pdf":
        return "PDF Summarizer";
      case "resume":
        return "Resume Analyzer"
      default:
        return "Shortify";
    }
  };

  const sidebarItems = [
    {
      id: "home",
      icon: Home,
      label: "Dashboard",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "shorts",
      icon: Youtube,
      label: "Shorts Generator",
      gradient: "from-red-500 to-pink-500",
    },
    {
      id: "summarizer",
      icon: Video,
      label: "Video Summarizer",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF Summarizer",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      id: "resume",
      icon: Eye,
      label: "Resume Analyzer",
      gradient: "from-[#8e2de2] to-[#4A00E0]",
    },
  ];

  const features = [
    {
      title: "AI Shorts Generator",
      icon: Youtube,
      desc: "Neural networks analyze your content to create viral-ready shorts with perfect timing and engagement hooks.",
      gradient: "from-red-500 via-pink-500 to-purple-500",
      link: "/features/shorts-generator",
      label: "Try Now",
      badge: "Live",
    },
    {
      title: "YouTube Summarizer",
      icon: Brain,
      desc: "Advanced AI processes hours of video content in seconds, extracting key insights.",
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
      link: "/features/summarizer",
      label: "Try Now",
      badge: "Live",
    },
    {
      title: "PDF Summarizer",
      icon: Cpu,
      desc: "Transform complex documents into crystal-clear summaries using next-gen natural language processing.",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      link: "/features/pdf-summarizer",
      label: "Try Now",
      badge: "Live",
    },
    {
      title: "Resume Analyzer",
      icon: Eye,
      desc: "Analyze your Resume and give you insights about your job description with AI.",
      gradient: "from-[#8e2de2] via-[#8e2de2]/70 to-[#4A00E0]",
      link: "/features/resumeAnalyzer",
      label: "Try Now",
      badge: "Live",
    }
  ];

  const handleFeatureClick = (link) => {
    // For dashboard navigation, switch to the appropriate tab
    if (link === "/features/shorts-generator") {
      setActiveTab("shorts");
    } else if (link === "/features/summarizer") {
      setActiveTab("summarizer");
    } else if (link === "/features/pdf-summarizer") {
      setActiveTab("pdf");
    } else if (link === "/features/resumeAnalyzer") {
      setActiveTab("resume");
    } else {
      // For external links, use window.location
      window.location.href = link;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
          style={{
            left: mousePosition.x / 10,
            top: mousePosition.y / 10,
            transition: "all 0.3s ease-out",
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-full blur-2xl animate-pulse" />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-gray-800/80 backdrop-blur-sm border border-gray-700"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full transition-transform duration-300 ease-in-out`}
      >
        <div className="h-full bg-gray-900/95 backdrop-blur-xl border-r border-gray-800 flex flex-col">
          {/* Logo Section */}
          <div className="p-8 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Shortify
                </h1>
                <p className="text-xs text-gray-400">AI-Powered Content</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6">
            <div className="space-y-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${isActive
                        ? "bg-gradient-to-r " +
                        item.gradient +
                        " shadow-2xl shadow-blue-500/25"
                        : "bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600"
                      }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-gray-700"
                          } transition-colors`}
                      >
                        <Icon
                          size={20}
                          className={isActive ? "text-white" : "text-gray-300"}
                        />
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-medium ${isActive ? "text-white" : "text-gray-300"
                            }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.id === "home" && "Control Center"}
                          {item.id === "shorts" && "Video AI"}
                          {item.id === "summarizer" && "Content AI"}
                          {item.id === "pdf" && "Document AI"}
                          {item.id === "resume" && "Resume AI"}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Section */}
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <a
                href="https://github.com/Ayushhgit"
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
              >
                <Github size={18} className="text-gray-300" />
              </a>
              <div className="flex-1" />
              {user ? (
                user.emailVerified ? (
                  <a href="/Profile">
                    <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <User size={16} />
                      <span className="font-medium">Profile</span>
                    </button>
                  </a>
                ) : (
                  <div className="text-sm text-red-600 flex items-center gap-2"></div>
                )
              ) : (
                <button
                  onClick={openModal}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <span className="font-medium">Login</span>
                  <Zap size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <AuthModalSystem
          onClose={closeModal}
          initialMode="login"
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="h-20 flex-shrink-0 flex items-center justify-between px-8 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {getTitle()}
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Dashboard */}
          {activeTab === "home" && (
            <div className="space-y-8">
              {/* Feature Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="group relative overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-3xl p-8 hover:border-gray-600 transition-all duration-500 hover:transform hover:scale-105"
                    >
                      {/* Background Gradient */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      />

                      {/* Badge */}
                      <div className="absolute top-6 right-6">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${feature.badge === "Live"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : feature.badge === "Beta"
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            }`}
                        >
                          {feature.badge}
                        </div>
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 mb-6 leading-relaxed">
                        {feature.desc}
                      </p>

                      {/* Action Button */}
                      <button
                        onClick={() => handleFeatureClick(feature.link)}
                        className={`w-full bg-gradient-to-r ${feature.gradient} hover:shadow-2xl hover:shadow-blue-500/25 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:gap-4`}
                      >
                        <span>{feature.label}</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shorts Generator */}
          {activeTab === "shorts" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
                  <Youtube className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">
                    AI SHORTS FORGE
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Neural Content Creator
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Advanced AI analyzes your content to create viral-ready shorts
                  with perfect timing, engagement hooks, and cinematic cuts.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-3">
                    <Cpu className="w-8 h-8" />
                    AI Capabilities
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <span>
                        Intelligent moment detection using computer vision
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0" />
                      <span>Automatic subtitle generation and styling</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <span>Engagement optimization algorithms</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <span>Multi-platform format adaptation</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
                    <Rocket className="w-8 h-8" />
                    Workflow
                  </h3>
                  <div className="space-y-4">
                    {[
                      "Paste YouTube URL",
                      "AI analyzes content",
                      "Generate optimized clips",
                      "Preview & customize",
                      "Export & share",
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <span className="text-gray-300">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/shorts-generator">
                  <button className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-red-500/25 flex items-center gap-3 mx-auto">
                    <Play className="w-6 h-6" />
                    Try Now
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Summarizer */}
          {activeTab === "summarizer" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">
                    VIDEO SUMMARIZER
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent mb-4">
                  Advanced Content Intelligence
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Quantum-speed processing extracts key insights from hours of
                  content in seconds using next-generation NLP.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      10x
                    </div>
                    <div className="text-gray-400">Faster Processing</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-400 mb-2">
                      99.8%
                    </div>
                    <div className="text-gray-400">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      50+
                    </div>
                    <div className="text-gray-400">Languages</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/summarizer">
                  <button className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3 mx-auto">
                    <Brain className="w-6 h-6" />
                    Try Now
                    <Sparkles className="w-6 h-6" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* PDF */}
          {activeTab === "pdf" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-6">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">
                    DOCUMENT MIND READER
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                  Intelligent Document Processing
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Revolutionary AI transforms complex documents into
                  crystal-clear summaries with human-like comprehension.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      1000+
                    </div>
                    <div className="text-gray-400">Pages/Minute</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      95%
                    </div>
                    <div className="text-gray-400">Time Saved</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-teal-400 mb-2">
                      ∞
                    </div>
                    <div className="text-gray-400">File Size</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/pdf-summarizer">
                  <button className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center gap-3 mx-auto">
                    <FileText className="w-6 h-6" />
                    Try Now
                    <Cpu className="w-6 h-6" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Resume Analyzer */}
          {activeTab === "resume" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/20 border border-purple-600/30 mb-6">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">
                    CAREER INTELLIGENCE
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Resume Analysis
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Advanced machine learning algorithms analyze your resume and provide
                  actionable insights to maximize your job application success.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
                    <Brain className="w-8 h-8" />
                    AI Analysis Features
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>ATS compatibility scoring and optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span>Skills gap analysis with industry benchmarks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Keyword density optimization for job roles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Format and structure improvement suggestions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-indigo-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-indigo-400 mb-4 flex items-center gap-3">
                    <Target className="w-8 h-8" />
                    Career Insights
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Salary range predictions based on experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Job match scoring for specific positions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <span>Industry-specific recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Rocket className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Career progression pathway mapping</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-600/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      95%
                    </div>
                    <div className="text-gray-400">ATS Pass Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-2">
                      3x
                    </div>
                    <div className="text-gray-400">More Interviews</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-400 mb-2">
                      85%
                    </div>
                    <div className="text-gray-400">Match Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      24/7
                    </div>
                    <div className="text-gray-400">AI Analysis</div>
                  </div>
                </div>
              </div>

              {/* Analysis Process */}
              <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-600/20 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-indigo-400 mb-6 flex items-center gap-3">
                  <Cpu className="w-8 h-8" />
                  Analysis Process
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: "01",
                      title: "Upload & Parse",
                      desc: "AI extracts and structures all resume data",
                      color: "purple"
                    },
                    {
                      step: "02",
                      title: "Deep Analysis",
                      desc: "Multi-layer AI evaluation of content and format",
                      color: "indigo"
                    },
                    {
                      step: "03",
                      title: "Insights & Report",
                      desc: "Detailed recommendations and improvement plan",
                      color: "blue"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}>
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <a href="/features/ResumeAnalyzer">
                  <button className="bg-gradient-to-r from-[#8e2de2] via-purple-600 to-[#4A00E0] hover:from-[#9d3ef3] hover:via-purple-700 hover:to-[#5511f1] text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3 mx-auto group">
                    <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Analyze My Resume
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-16 flex-shrink-0 flex items-center justify-center border-t border-gray-800 bg-gray-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">
              Made with ❤️ and ☕.
            </span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}