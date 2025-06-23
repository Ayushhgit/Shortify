import { useState, useEffect } from "react";
import {
  Home,
  Youtube,
  Video,
  GraduationCap,
  SquareChartGantt,
  FileText,
  Zap,
  User,
  Users,
  Subtitles,
  Clapperboard,
  ClipboardList,
  KeyRound,
  SlidersHorizontal,
  Library,
  Film,
  Mic,
  BarChart3,
  Menu,
  X,
  Edit,
  Droplets,
  Settings,
  Download,
  BookText,
  Pencil,
  Binoculars,
  Sparkles,
  Search,
  ArrowRight,
  FileImage,
  Lightbulb,
  Play,
  Award,
  MessageSquare,
  Upload,
  Palette,
  Paintbrush,
  Eye,
  Coffee,
  Cpu,
  Brain,
  Rocket,
  Target,
  TrendingUp,
  CheckCircle,
  BrainCircuit,
  BookOpen,
  Clock,
  Chrome,
  Zap as Lightning,
} from "lucide-react";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import AuthModalSystem from "../components/AuthModalSystem";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { Linkedin } from "lucide-react";

export default function ShortifyPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [animatedStats, setAnimatedStats] = useState({
    documents: 0,
    hours: 0,
    accuracy: 0,
    processing: 0,
  });
  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const navigate = useNavigate();
  // Animated counter effect
  useEffect(() => {
    const targets = {
      documents: 100,
      hours: 50,
      accuracy: 99.2,
      processing: 10,
    };
    const duration = 2000;
    const interval = 50;
    const steps = duration / interval;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedStats({
        documents: Math.floor(targets.documents * progress),
        hours: Math.floor(targets.hours * progress),
        accuracy: Math.floor(targets.accuracy * progress * 10) / 10,
        processing: Math.floor(targets.processing * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

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
        signOut(auth);
        setUser(null);
        setIsModalOpen(true); // Show login modal
      } else if (currentUser) {
        setUser(currentUser);
        setIsModalOpen(false); // User is logged in, hide modal
        displayToast("✅ Successfully authenticated!");
      } else {
        setUser(null);
        setIsModalOpen(true); // No user, show login modal
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
        return "AI Command Center";
      case "shorts":
        return "YouTube Clips Forger";
      case "summarizer":
        return "Video Summarizer";
      case "pdf":
        return "Document Mind Reader";
      case "resume":
        return "Resume Analyzer";
      case "article":
        return "Article Summarizer";
      case "coverLetter":
        return "Cover Letter Maker";
      case "assignment":
        return "Assignment Helper";
      case "research":
        return "Research Assistant";
      case "autoeda":
        return "Dataset Analyzer";
      case "LinkedIn":
        return "LinkedIn Optimizer";
      case "quiz":
        return "Quiz Generator";
      case "clip":
        return "Clip Maker";
      default:
        return "Shortify";
    }
  };

  const sidebarItems = [
    {
      id: "home",
      icon: Home,
      label: "Command Center",
      gradient: "from-cyan-400 to-blue-500",
      glow: "shadow-cyan-500/25",
    },
    {
      id: "shorts",
      icon: Youtube,
      label: "YouTube Clipper",
      gradient: "from-red-500 to-pink-500",
      glow: "shadow-red-500/25",
    },
    {
      id: "summarizer",
      icon: Video,
      label: "YouTube Summarizer",
      gradient: "from-purple-500 to-indigo-500",
      glow: "shadow-purple-500/25",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "Document Summarizer",
      gradient: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/25",
    },
    {
      id: "resume",
      icon: GraduationCap,
      label: "Resume Analyzer",
      gradient: "from-violet-500 to-purple-600",
      glow: "shadow-violet-500/25",
    },
    {
      id: "article",
      icon: Chrome,
      label: "Article Summary",
      gradient: "from-pink-500 via-purple-600 to-orange-600",
      glow: "shadow-violet-500/25",
    },
    {
      id: "coverLetter",
      icon: SquareChartGantt,
      label: "Cover Letter",
      gradient: "from-violet-500 via-blue-600 to-indigo-600",
      glow: "shadow-violet-500/25",
    },
    {
      id: "assignment",
      icon: Pencil,
      label: "Assignment Helper",
      gradient: "from-yellow-500 via-orange-400 to-amber-200",
      glow: "shadow-violet-500/25",
    },
    {
      id: "research",
      icon: Binoculars,
      label: "Research Assistant",
      gradient: "from-rose-500 via-cyan-600 to-fuchsia-600",
      glow: "shadow-violet-500/25",
    },
    {
      id: "autoeda",
      icon: BarChart3,
      label: "Dataset Analyzer",
      gradient: "from-blue-500 via-cyan-600 to-purple-600",
      glow: "shadow-violet-500/25",
    },
    {
      id: "LinkedIn",
      icon: Linkedin,
      label: "Linkedin Optimizer",
      gradient: "from-violet-500 via-cyan-500 to-blue-500",
      glow: "shadow-purple-500/25",
    },
    {
      id: "quiz",
      icon: BrainCircuit,
      label: "Quiz Generator",
      gradient: "from-pink-500 to-purple-500",
      glow: "shadow-purple-500/25",
    },
    {
      id: "clip",
      icon: Video,
      label: "Clip Maker",
      gradient: "from-emerald-500 via-teal-500 to-green-500",
      glow: "shadow-purple-500/25",
    },
  ];

  const features = [
    {
      title: "AI YouTube Shorts Generator",
      icon: Youtube,
      desc: "Transform long-form videos into viral shorts using advanced AI that understands engagement patterns and optimal timing.",
      gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
      link: "/features/shorts-generator",
      label: "Generate Now",
      badge: "LIVE",
      animation: "pulse",
      bgPattern: "waveform",
    },
    {
      title: "YouTube Video Summarizer",
      icon: Brain,
      desc: "Quantum-speed processing extracts key insights from hours of content in seconds using next-generation NLP algorithms.",
      gradient: "from-purple-500 via-indigo-500 to-blue-500",
      link: "/features/summarizer",
      label: "Analyze Now",
      badge: "LIVE",
      animation: "neural",
      bgPattern: "neural-network",
    },
    {
      title: "AI Document Summarizer",
      icon: BookText,
      desc: "Revolutionary AI transforms complex documents into crystal-clear summaries with human-like comprehension and precision.",
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      link: "/features/pdf-summarizer",
      label: "Process Now",
      badge: "LIVE",
      animation: "scan",
      bgPattern: "grid",
    },
    {
      title: "AI Resume Analyzer",
      icon: Eye,
      desc: "Advanced machine learning analyzes resumes and provides strategic insights to maximize your job application success rate.",
      gradient: "from-violet-500 via-purple-600 to-indigo-600",
      link: "/features/resumeAnalyzer",
      label: "Analyze Now",
      badge: "LIVE",
      animation: "radar",
      bgPattern: "radar",
    },
    {
      title: "AI Article Summarizer",
      icon: Chrome,
      desc: "Summarize long articles into clear, concise points using AI—perfect for quick reading, research, or content repurposing and supports multiple pages.",
      gradient: "from-pink-500 via-purple-600 to-orange-600",
      link: "/features/ArticleSummarizer",
      label: "Summarize Now",
      badge: "LIVE",
      animation: "radar",
      bgPattern: "radar",
    },

    {
      title: "AI Cover Letter Generator",
      icon: SquareChartGantt,
      desc: "Effortlessly generate personalized, job-specific cover letters using AI that tailors content based on your resume and the job role.",
      gradient: "from-violet-500 via-blue-600 to-indigo-600",
      link: "/features/coverLetterGenerator",
      label: "Generate Now",
      badge: "LIVE",
      animation: "radar",
      bgPattern: "radar",
    },
    {
      title: "AI Assignment Helper",
      icon: Pencil,
      desc: "Convert AI-generated answers into realistic handwritten assignments with ruled paper styling – perfect for fast, smart submissions.",
      gradient: "from-yellow-500 via-orange-400 to-amber-200",
      link: "/features/AssignmentHelper",
      label: "Try Now",
      badge: "LIVE",
      animation: "pulse",
      bgPattern: "paper",
    },
    {
      title: "AI Research Assistant",
      icon: Binoculars,
      desc: "AI-powered assistant that searches research papers, summarizes concepts, and answers your academic queries using real citations.",
      gradient: "from-rose-500 via-cyan-600 to-fuchsia-600",
      link: "/features/ResearchAssistant",
      label: "Explore",
      badge: "LIVE",
      animation: "radar",
      bgPattern: "radar",
    },
    {
      title: "Auto EDA",
      icon: BarChart3,
      desc: "Intelligent data exploration that automatically generates insights, visualizations, and statistical summaries from your datasets with zero manual effort.",
      gradient: "from-blue-500 via-cyan-600 to-purple-600",
      link: "/features/EDA",
      label: "Analyze",
      badge: "LIVE",
      animation: "pulse",
      bgPattern: "grid",
    },
    {
      title: "AI LinkedIn Optimizer",
      icon: Linkedin,
      desc: "AI-powered profile optimization that enhances your LinkedIn presence with keyword analysis, content suggestions, and engagement strategies to maximize professional visibility.",
      gradient: "from-blue-600 via-indigo-600 to-purple-700",
      link: "/features/LinkwiseAI",
      label: "Optimize",
      badge: "NEW",
      animation: "bounce",
      bgPattern: "dots",
    },
    {
      title: "AI Clip Generator",
      icon: Video,
      desc: "Transform any topic into an engaging short video, complete with an AI-generated script, natural voiceover, and synchronized captions over a ready to use minecraft gameplay stock video, ready in seconds.",
      gradient: "from-fuchsia-600 via-purple-600 to-indigo-700",
      link: "/tools/ai-video-generator",
      label: "Create Video",
      badge: "POPULAR",
      animation: "pulse",
      bgPattern: "grid",
    },
    {
      title: "AI Quiz Generator",
      icon: BrainCircuit,
      desc: "Instantly create challenging and engaging quizzes on any topic. Our AI generates diverse question types, including MCQ, QnA and Numericals, complete with correct answers to streamline learning.",
      gradient: "from-green-500 via-teal-600 to-cyan-700",
      link: "/tools/quiz-generator",
      label: "Generate Quiz",
      badge: "EDUCATION",
      animation: "none",
      bgPattern: "plus",
    },
  ];

  const stats = [
    {
      value: animatedStats.documents,
      suffix: "+",
      label: "Documents Processed",
      icon: FileText,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      value: animatedStats.hours,
      suffix: "+",
      label: "Hours Saved",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      value: animatedStats.accuracy,
      suffix: "%",
      label: "Accuracy Rate",
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      value: animatedStats.processing,
      suffix: "s",
      label: "Avg Processing",
      icon: Lightning,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Dynamic Mesh Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-slate-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 15,
            top: mousePosition.y / 15,
            transition: "all 0.3s ease-out",
          }}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700 hover:border-cyan-400/50 transition-all duration-300"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Enhanced Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
    lg:translate-x-0 fixed lg:relative z-40 w-80 h-full transition-all duration-300 ease-in-out`}
      >
        <div className="h-full bg-gray-950/98 backdrop-blur-xl border-r border-gray-900 flex flex-col relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />

          {/* Logo Section */}
          <div className="p-8 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <a href="/">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <img src={logo} alt="Logo" />
                </div>{" "}
              </a>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  KwixLab
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  AI-Powered Intelligence
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Fixed height with proper scrolling */}
          <div className="flex-1 p-6 overflow-y-auto">
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
                      ? `bg-gradient-to-r ${item.gradient} shadow-2xl ${item.glow}`
                      : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 hover:shadow-lg"
                      }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 ${isActive
                          ? "bg-white/20 shadow-lg"
                          : "bg-slate-700 group-hover:bg-slate-600"
                          }`}
                      >
                        <Icon
                          size={20}
                          className={isActive ? "text-white" : "text-slate-300"}
                        />
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-semibold ${isActive ? "text-white" : "text-slate-300"
                            }`}
                        >
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30" />
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
                href="https://buymeacoffee.com/"
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
              >
                <Coffee size={18} className="text-gray-300" />
              </a>
              <div className="flex-1" />
              {user ? (
                user.emailVerified ? (
                  <a href="/profile">
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
        {/* Enhanced Header */}
        <div className="h-24 flex-shrink-0 flex items-center justify-between px-8 bg-gray-950/95 backdrop-blur-xl border-b border-gray-900/70">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              {getTitle()}
            </h1>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-lg">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-sm text-emerald-400 font-semibold">
                AI ONLINE
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4"></div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Enhanced Dashboard */}
            {activeTab === "home" && (
              <div className="space-y-12">
                {/* Hero Section with Animated Stats */}
                <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-8 shadow-2xl shadow-cyan-500/10">
                    <Brain className="w-6 h-6 text-cyan-400" />
                    <span className="text-cyan-400 font-bold text-lg">
                      YOUR AI-POWERED SUPPORT ENGINE
                    </span>
                  </div>

                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent mb-6 leading-tight">
                    Intelligence at the Speed of Light
                  </h1>

                  <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Transform any content into actionable insights with our
                    neural-powered AI that processes information faster than
                    human thought while maintaining perfect accuracy.
                  </p>

                  {/* Animated Stats Bar */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, idx) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={idx}
                          className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all duration-500 hover:shadow-2xl"
                        >
                          <div
                            className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <Icon className={`w-6 h-6 ${stat.color}`} />
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                            <div
                              className={`text-3xl font-bold ${stat.color} mb-2`}
                            >
                              {stat.value}
                              {stat.suffix}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                              {stat.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Feature Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => navigate(feature.link)}
                        className="group relative overflow-hidden bg-gray-900/40 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 hover:border-gray-700 transition-all duration-500 hover:transform hover:scale-[1.02] hover:shadow-2xl"
                      >
                        {/* Animated Background Pattern */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                        />

                        {/* Badge */}
                        <div className="absolute top-6 right-6">
                          <div className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            {feature.badge}
                          </div>
                        </div>

                        {/* Icon */}
                        <div
                          className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.gradient} p-5 mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}
                        >
                          <Icon className="w-10 h-10 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-100 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                          {feature.desc}
                        </p>

                        {/* Action Button */}
                        <div

                          onClick={() => navigate(feature.link)}
                          className={`w-full bg-gradient-to-r ${feature.gradient} hover:shadow-2xl text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 group-hover:gap-4 text-lg shadow-lg cursor-pointer`}
                        >

                          <span>{feature.label}</span>
                          <ArrowRight
                            size={20}
                            className="group-hover:translate-x-1 transition-transform duration-300"
                          />
                        </div>
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
                    Advanced AI analyzes your content to create viral-ready
                    shorts with perfect timing, engagement hooks, and cinematic
                    cuts.
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
                        5+
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
                        100+
                      </div>
                      <div className="text-gray-400">Pages/Minute</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-emerald-400 mb-2">
                        96%
                      </div>
                      <div className="text-gray-400">Time Saved</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-teal-400 mb-2">
                        10MB
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
                    Advanced machine learning algorithms analyze your resume and
                    provide actionable insights to maximize your job application
                    success.
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
                        <span>
                          Skills gap analysis with industry benchmarks
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>Keyword density optimization for job roles</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Format and structure improvement suggestions
                        </span>
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
                        <span>
                          Salary range predictions based on experience
                        </span>
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
                        color: "purple",
                      },
                      {
                        step: "02",
                        title: "Deep Analysis",
                        desc: "Multi-layer AI evaluation of content and format",
                        color: "indigo",
                      },
                      {
                        step: "03",
                        title: "Insights & Report",
                        desc: "Detailed recommendations and improvement plan",
                        color: "blue",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="text-center">
                        <div
                          className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}
                        >
                          {item.step}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
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

          {/*Artcile summarizer */}
          {activeTab === "article" && (
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/20 border border-green-500/30 mb-6">
                  <FileText className="w-5 h-5 text-pink-400" />
                  <span className="text-orange-400 font-medium">
                    ARTICLE SUMMARIZER
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Article Summarization
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                  Skip the scroll. Get crisp, bullet-point summaries of any
                  online article using intelligent NLP that captures the essence
                  in seconds.
                </p>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-pink-500/20 rounded-3xl p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-orange-400 mb-2">
                      50+
                    </div>
                    <div className="text-gray-400">
                      Articles Summarized Daily
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      90%
                    </div>
                    <div className="text-gray-400">
                      Avg Time Saved Per Reader
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-400 mb-2">
                      5 secs
                    </div>
                    <div className="text-gray-400">
                      Avg Summary Generation Time
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported Input */}
              <div className="flex justify-center gap-6 text-gray-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  Web URLs Only
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <a href="/features/ArticleSummarizer">
                  <button className="bg-gradient-to-r from-orange-500 via-purple-500 to-pink-500 hover:from-orange-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-green-500/25 flex items-center gap-3 mx-auto">
                    <FileText className="w-6 h-6" />
                    Try Now
                  </button>
                </a>
              </div>
            </div>
          )}
          {/* Cover Letter Generator */}
          {activeTab === "coverLetter" && (
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 mb-6">
                  <SquareChartGantt className="w-5 h-5 text-violet-400" />
                  <span className="text-violet-400 font-medium">
                    AI COVER LETTER WRITER
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-4">
                  Personalized Cover Letters in Seconds
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                  Just upload your resume and job description—our AI crafts a
                  tailored, compelling cover letter that aligns perfectly with
                  your goals and experience.
                </p>
              </div>

              {/* Stats */}
              <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-3xl p-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-violet-400 mb-2">
                      30 sec
                    </div>
                    <div className="text-gray-400">To First Draft</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      99%
                    </div>
                    <div className="text-gray-400">ATS-Friendly Output</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-400 mb-2">
                      3x
                    </div>
                    <div className="text-gray-400">Higher Callback Rate</div>
                  </div>
                </div>
              </div>

              {/* Supported Input */}
              <div className="flex justify-center gap-6 text-gray-400">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Resume (PDF/DOCX)
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Job Description (Text)
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <a href="/features/coverLetterGenerator">
                  <button className="bg-gradient-to-r from-violet-500 via-blue-600 to-indigo-600 hover:from-violet-600 hover:via-blue-700 hover:to-indigo-700 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-violet-500/25 flex items-center gap-3 mx-auto">
                    <SquareChartGantt className="w-6 h-6" />
                    Generate Now
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Research Assistant */}
          {activeTab === "research" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-600/20 border border-emerald-600/30 mb-6">
                  <Search className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-400 font-medium">
                    RESEARCH INTELLIGENCE
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-rose-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Research Assistant
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Advanced AI algorithms that comprehend, analyze, and
                  synthesize information from multiple sources to accelerate
                  your research workflow.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-pink-400 mb-4 flex items-center gap-3">
                    <BookOpen className="w-8 h-8" />
                    Research Capabilities
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Multi-source information synthesis and analysis
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Academic paper summarization with key insights
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Citation formatting and reference management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Fact-checking and source credibility assessment
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-teal-600/10 to-cyan-600/10 border border-teal-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                    <Lightbulb className="w-8 h-8" />
                    Smart Insights
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>Trend analysis and pattern recognition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Knowledge gap identification and recommendations
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>Cross-disciplinary connection mapping</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Rocket className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Research methodology optimization</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-600/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      98%
                    </div>
                    <div className="text-gray-400">Accuracy Rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-rose-400 mb-2">
                      5x
                    </div>
                    <div className="text-gray-400">Faster Research</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      50+
                    </div>
                    <div className="text-gray-400">Source Types</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                      24/7
                    </div>
                    <div className="text-gray-400">AI Assistant</div>
                  </div>
                </div>
              </div>

              {/* Research Process */}
              <div className="bg-gradient-to-br from-teal-600/10 to-emerald-600/10 border border-teal-600/20 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-3">
                  <Cpu className="w-8 h-8" />
                  Research Process
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      step: "01",
                      title: "Query & Discover",
                      desc: "AI understands your research needs and finds relevant sources",
                      color: "rose",
                    },
                    {
                      step: "02",
                      title: "Analyze & Synthesize",
                      desc: "Deep content analysis with cross-referencing and validation",
                      color: "cyan",
                    },
                    {
                      step: "03",
                      title: "Insights & Report",
                      desc: "Comprehensive findings with actionable recommendations",
                      color: "fuchsia",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}
                      >
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {item.title}
                      </h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <a href="/features/ResearchAssistant">
                  <button className="bg-gradient-to-r from-rose-400 via-cyan-600 to-fuchsia-400 hover:from-rose-500 hover:via-cyan-700 hover:to-fuchsia-500 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 flex items-center gap-3 mx-auto group">
                    <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Start Research
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Assignment Maker */}
          {activeTab === "assignment" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-600/20 border border-orange-600/30 mb-6">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">
                    ASSIGNMENT INTELLIGENCE
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-rose-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Assignment Maker
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Upload questions in any format and let AI solve them with
                  customizable formatting, handwriting styles, and downloadable
                  PDF outputs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
                    <Upload className="w-8 h-8" />
                    Input Capabilities
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>PDF question paper recognition and parsing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>
                        DOCX file processing with formatting preservation
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Direct text input with smart question detection
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Image-based question extraction from photos</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-orange-600/10 to-rose-600/10 border border-orange-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-3">
                    <Palette className="w-8 h-8" />
                    Customization Options
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <Paintbrush className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Multiple handwriting fonts and styles</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FileImage className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <span>Blank, ruled, or graph paper backgrounds</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Droplets className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <span>Customizable ink colors and thickness</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Edit className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <span>Real-time editing and formatting controls</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-600/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      95%
                    </div>
                    <div className="text-gray-400">Solution Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-400 mb-2">
                      10x
                    </div>
                    <div className="text-gray-400">Faster Completion</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-rose-400 mb-2">
                      5+
                    </div>
                    <div className="text-gray-400">Font Styles</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      HD
                    </div>
                    <div className="text-gray-400">PDF Quality</div>
                  </div>
                </div>
              </div>

              {/* Assignment Process */}
              <div className="bg-gradient-to-br from-orange-600/10 to-rose-600/10 border border-orange-600/20 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-orange-400 mb-6 flex items-center gap-3">
                  <Cpu className="w-8 h-8" />
                  Assignment Process
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    {
                      step: "01",
                      title: "Upload & Parse",
                      desc: "AI extracts questions from PDF, DOCX, or text input",
                      color: "yellow",
                    },
                    {
                      step: "02",
                      title: "Solve & Generate",
                      desc: "Advanced AI provides accurate solutions with working",
                      color: "orange",
                    },
                    {
                      step: "03",
                      title: "Format & Style",
                      desc: "Choose fonts, colors, and paper styles for natural look",
                      color: "rose",
                    },
                    {
                      step: "04",
                      title: "Edit & Download",
                      desc: "Real-time editing with high-quality PDF export",
                      color: "yellow",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="text-center">
                      <div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}
                      >
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {item.title}
                      </h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-yellow-600/10 to-orange-600/10 border border-yellow-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">
                    Instant PDF Export
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Download completed assignments as high-quality PDFs ready
                    for submission
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-600/10 to-rose-600/10 border border-orange-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-orange-400 mb-2">
                    Smart Recognition
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Advanced OCR technology recognizes complex mathematical
                    equations and diagrams
                  </p>
                </div>

                <div className="bg-gradient-to-br from-rose-600/10 to-yellow-600/10 border border-rose-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-rose-500 to-yellow-500 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-rose-400 mb-2">
                    Live Customization
                  </h4>
                  <p className="text-gray-400 text-sm">
                    Real-time preview with instant font, color, and layout
                    adjustments
                  </p>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/AssignmentHelper">
                  <button className="bg-gradient-to-r from-yellow-400 via-orange-600 to-rose-400 hover:from-yellow-500 hover:via-orange-700 hover:to-rose-500 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-yellow-500/25 flex items-center gap-3 mx-auto group">
                    <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Finish Assignment
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/*Auto EDA */}
          {activeTab === "autoeda" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-medium">
                    AUTO EDA INTELLIGENCE
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Automated Exploratory Data Analysis
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Advanced AI automatically discovers patterns, anomalies, and
                  insights hidden within your datasets with zero manual effort.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      5+
                    </div>
                    <div className="text-gray-400">Auto Visualizations</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      90%
                    </div>
                    <div className="text-gray-400">Analysis Time Saved</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      100+
                    </div>
                    <div className="text-gray-400">Rows Processed</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Statistical Insights
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Comprehensive statistical summaries, distribution analysis,
                    and correlation matrices generated instantly.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      Descriptive Stats
                    </span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                      Correlations
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      Distributions
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Smart Visualizations
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    AI automatically selects optimal chart types and creates
                    publication-ready visualizations for every variable.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      Histograms
                    </span>
                    <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">
                      Scatter Plots
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      Heatmaps
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-gray-200">
                    AI-Powered Insights
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Automatic outlier detection and anomaly identification
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Data quality assessment and missing value analysis
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Feature importance ranking and selection</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Automated hypothesis generation and testing</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/EDA">
                  <button className="bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 hover:from-blue-600 hover:via-cyan-600 hover:to-purple-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 flex items-center gap-3 mx-auto">
                    <BarChart3 className="w-6 h-6" />
                    Start Auto EDA
                    <Zap className="w-6 h-6" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* LinkwiseAI Info Section */}
          {activeTab === "LinkedIn" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-6">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">
                    PROFESSIONAL LINKEDIN OPTIMIZATION
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  AI-Powered LinkedIn Enhancement
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Transform your LinkedIn presence with advanced AI that
                  analyzes, optimizes, and generates compelling professional
                  content tailored to your career goals.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      100+
                    </div>
                    <div className="text-gray-400">Profile Score Points</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-400 mb-2">
                      95%
                    </div>
                    <div className="text-gray-400">Content Quality Boost</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      10x
                    </div>
                    <div className="text-gray-400">Faster Content Creation</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 border border-cyan-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Profile Analysis
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Comprehensive AI-driven analysis of your LinkedIn profile
                    with detailed scoring, strengths identification, and
                    actionable improvement suggestions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                      Profile Scoring
                    </span>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                      Strengths Analysis
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      Optimization Tips
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Content Generation
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    AI creates personalized headlines, about sections, and
                    engaging posts tailored to your skills, role, and career
                    aspirations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                      Headlines
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      About Sections
                    </span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
                      Engaging Posts
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-xl font-semibold text-gray-200">
                    Smart Features & Capabilities
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Automated profile URL analysis and data extraction
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Multi-tone content generation (Professional, Friendly,
                      Technical)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Career goal-aligned content optimization</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>One-click copy and download functionality</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>
                      Comprehensive weakness identification and solutions
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Industry best practices integration</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Profile Scoring System
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Get a comprehensive 0-100 score with color-coded feedback:
                    Excellent (80+), Good (60-79), or Needs Improvement
                    (&lt;60).
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-400">
                        80-100: Excellent Profile
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-400">60-79: Good Profile</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-400">
                        &lt;60: Needs Improvement
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-500/5 to-pink-500/5 border border-rose-500/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-6 h-6 text-rose-400" />
                    <h3 className="text-xl font-semibold text-gray-200">
                      Content Personalization
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Every piece of content is uniquely crafted based on your
                    specific skills, experience, and career objectives for
                    maximum impact.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-rose-400" />
                      <span>Skills-based customization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-rose-400" />
                      <span>Role-specific optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-rose-400" />
                      <span>Goal-aligned messaging</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/LinkwiseAI">
                  <button className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:from-cyan-600 hover:via-indigo-600 hover:to-purple-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 flex items-center gap-3 mx-auto group">
                    <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Optimize Your LinkedIn Now
                    <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>{" "}
                </a>
              </div>
            </div>
          )}

          {/*Clip section*/}
          {activeTab === "clip" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-600/30 mb-6">
                  <Clapperboard className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-medium">
                    INSTANT VIDEO CREATION
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Clip Generator
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Turn any topic into a viral-style short video with AI-generated
                  scripts, voiceovers, background footage, and synchronized captions.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-blue-600/10 to-fuchsia-600/10 border border-blue-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-3">
                    <Sparkles className="w-8 h-8" />
                    Core AI Features
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Engaging script generation from any topic</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                      <span>Natural-sounding text-to-speech voiceovers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Auto-selection of relevant background footage</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>Frame-by-frame subtitle generation & syncing</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-fuchsia-400 mb-4 flex items-center gap-3">
                    <Film className="w-8 h-8" />
                    Output & Customization
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                      <span>Multiple voice styles and language options</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Customizable caption styles and animations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                      <span>Choice of aspect ratios (9:16, 1:1, 16:9)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>High-definition 1080p MP4 video export</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-gradient-to-br from-blue-600/10 to-fuchsia-600/10 border border-blue-600/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      &lt;60s
                    </div>
                    <div className="text-gray-400">Render Time</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                      3+
                    </div>
                    <div className="text-gray-400">AI Models Used</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">
                      10k+
                    </div>
                    <div className="text-gray-400">Stock Videos</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-2">
                      1080p
                    </div>
                    <div className="text-gray-400">HD Quality</div>
                  </div>
                </div>
              </div>

              {/* Video Generation Process */}
              <div className="bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-600/20 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-fuchsia-400 mb-6 flex items-center gap-3">
                  <Cpu className="w-8 h-8" />
                  Our Video Generation Process
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { step: "01", title: "Topic to Script", desc: "AI writes an engaging script based on your input topic", color: "blue" },
                    { step: "02", title: "Text to Voice", desc: "A natural voiceover is generated from the AI script", color: "fuchsia" },
                    { step: "03", title: "Video Assembly", desc: "Footage, audio & captions are synced and compiled", color: "purple" },
                    { step: "04", title: "Final Render", desc: "Your final video is rendered in HD and ready for download", color: "blue" },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}>
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600/10 to-fuchsia-600/10 border border-blue-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 flex items-center justify-center">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-blue-400 mb-2">Stock Footage</h4>
                  <p className="text-gray-400 text-sm">Access to a vast library of high-quality background videos for any topic.</p>
                </div>
                <div className="bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
                    <Subtitles className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-fuchsia-400 mb-2">Burnt-in Captions</h4>
                  <p className="text-gray-400 text-sm">Automatically generated and animated captions are embedded into your video.</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-purple-400 mb-2">One-Click Export</h4>
                  <p className="text-gray-400 text-sm">Download your finished video as a high-quality MP4 file, ready to be shared.</p>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/ClipGenerator">
                  <button className="bg-gradient-to-r from-blue-500 via-fuchsia-500 to-purple-500 hover:from-blue-600 hover:via-fuchsia-600 hover:to-purple-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-fuchsia-500/25 flex items-center gap-3 mx-auto group">
                    <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Start Creating Clips
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </div>
          )}

          {/*Quiz Generator*/}
          {activeTab === "quiz" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/20 border border-green-600/30 mb-6">
                  <BrainCircuit className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">
                    AUTOMATED ASSESSMENT
                  </span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  AI-Powered Quiz Generator
                </h2>
                <p className="text-xl text-gray-400 leading-relaxed">
                  Effortlessly create engaging and challenging quizzes on any subject
                  with diverse question types and automatic answer key generation.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-3">
                    <Lightbulb className="w-8 h-8" />
                    Input Flexibility
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Generate from any topic or subject name</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>Paste in your own text, articles, or notes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Upload documents (PDF, DOCX) for analysis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Specify number of questions and difficulty level</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-teal-600/10 to-cyan-600/10 border border-teal-600/20 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-teal-400 mb-4 flex items-center gap-3">
                    <ClipboardList className="w-8 h-8" />
                    Quiz & Question Features
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>Multiple Choice & True/False questions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Fill-in-the-blank and short answer generation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>Automatic generation of plausible distractors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>Instant answer key creation for easy grading</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Statistics Section */}
              <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-600/20 rounded-3xl p-8 mb-8">
                <div className="grid md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      Instant
                    </div>
                    <div className="text-gray-400">Quiz Creation</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-teal-400 mb-2">
                      5+
                    </div>
                    <div className="text-gray-400">Question Types</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-cyan-400 mb-2">
                      99%
                    </div>
                    <div className="text-gray-400">Factual Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      PDF
                    </div>
                    <div className="text-gray-400"> & DOCX Export</div>
                  </div>
                </div>
              </div>

              {/* Quiz Generation Process */}
              <div className="bg-gradient-to-br from-teal-600/10 to-cyan-600/10 border border-teal-600/20 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-3">
                  <Cpu className="w-8 h-8" />
                  Our Quiz Generation Process
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { step: "01", title: "Provide Content", desc: "Input a topic, paste text, or upload a document for analysis", color: "green" },
                    { step: "02", title: "AI Comprehension", desc: "The AI reads and understands the key concepts in your material", color: "teal" },
                    { step: "03", title: "Question Crafting", desc: "Relevant questions are generated in various formats with answers", color: "cyan" },
                    { step: "04", title: "Review & Export", desc: "Edit your quiz and download it in your desired file format", color: "green" },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 flex items-center justify-center text-white font-bold text-xl`}>
                        {item.step}
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-green-400 mb-2">Multiple Formats</h4>
                  <p className="text-gray-400 text-sm">Export your quizzes and answer keys as printable PDF or editable DOCX files.</p>
                </div>
                <div className="bg-gradient-to-br from-teal-600/10 to-cyan-600/10 border border-teal-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                    <SlidersHorizontal className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-teal-400 mb-2">Adjustable Difficulty</h4>
                  <p className="text-gray-400 text-sm">Fine-tune the complexity of your quizzes to suit any audience, from beginners to experts.</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-600/10 to-green-600/10 border border-cyan-600/20 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-green-500 flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-cyan-400 mb-2">Answer Key Included</h4>
                  <p className="text-gray-400 text-sm">Every quiz comes with a corresponding answer key for quick and easy grading.</p>
                </div>
              </div>

              <div className="text-center">
                <a href="/features/QuizGenerator">
                  <button className="bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 hover:from-green-600 hover:via-teal-600 hover:to-cyan-600 text-white py-4 px-12 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-teal-500/25 flex items-center gap-3 mx-auto group">
                    <BrainCircuit className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Start Building Quizzes
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </div>)}


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
        </div>
      </div>
    </div>
  );
}
