import React, { useState, useEffect } from "react";
import {
  Link, Brain, FileText, Share2, Clock, Database, Users, BookOpen, Award, MessageSquare,
  UserPlus, Library, ClipboardList, Bell, Mail, ChevronRight, Zap, RefreshCw, Target
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import Header from "../components/Header.jsx";

// Step Component 
const WorkflowStep = ({ number, title, description, icon }) => {
  return (
    <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-500 group">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
        {React.cloneElement(icon, { className: "h-6 w-6 text-blue-400" })}
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4 shadow-lg shadow-blue-500/25">
        {number}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-gray-300 text-center">{description}</p>
    </div>
  );
};

// Benefit Card Component
const BenefitCard = ({ title, description, icon }) => {
  return (
    <div className="flex items-start p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-500 group">
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3 rounded-xl mr-4 flex-shrink-0 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
        {React.cloneElement(icon, { className: "h-8 w-8 text-blue-400" })}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
};

// Use Case Component
const UseCase = ({ title, icon, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`p-5 rounded-xl transition-all duration-500 cursor-pointer border ${isHovered
        ? "bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-600 text-white border-blue-500/50 shadow-xl shadow-blue-500/25 scale-105"
        : "bg-white/5 backdrop-blur-xl text-white border-white/10 hover:bg-white/10"
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`mb-3 transition-all duration-300 ${isHovered ? "text-white" : "text-blue-400"}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className={`text-sm transition-all duration-300 ${isHovered ? "text-white/90" : "text-gray-300"}`}>
        {description}
      </p>
    </div>
  );
};

// Tab Button Component
const TabButton = ({ label, active, onClick, id }) => {
  return (
    <button
      className={`px-6 py-3 font-medium text-base transition-all duration-300 rounded-full ${active
        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
        : "text-gray-400 hover:text-white hover:bg-white/10 border border-white/10"
        }`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
      aria-controls={`panel-${id}`}
    >
      {label}
    </button>
  );
};

// How It Works Tab
const HowItWorksTab = () => {
  const steps = [
    {
      icon: <Link />,
      title: "Paste Video/PDF Link",
      description: "Upload PDF or paste a YouTube link to begin the summarization process.",
    },
    {
      icon: <Brain />,
      title: "AI-Powered Insight Extraction",
      description: "Our AI scans content to identify key concepts, trends, and important moments.",
    },
    {
      icon: <FileText />,
      title: "Summary + Highlights",
      description: "Receive concise summaries and highlights, with optional video clips of key moments.",
    },
    {
      icon: <Share2 />,
      title: "Share with Team",
      description: "Export and share summaries or video clips with your team via email or Slack.",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {steps.map((step, index) => (
          <WorkflowStep
            key={index}
            number={index + 1}
            title={step.title}
            description={step.description}
            icon={step.icon}
          />
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 md:mb-0 md:mr-6">
            <Award className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise-Grade Security</h3>
            <p className="text-gray-300">
              All your content is processed with military-grade encryption, and we're SOC 2 and GDPR compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Benefits Tab
const BenefitsTab = () => {
  const benefits = [
    {
      icon: <Clock />,
      title: "Save Hours of Content Digestion",
      description: "Transform hours of video content or lengthy documents into digestible summaries in minutes.",
    },
    {
      icon: <Database />,
      title: "Centralize Knowledge",
      description: "Create a searchable repository of insights from all your company's content.",
    },
    {
      icon: <Users />,
      title: "Simplify Onboarding",
      description: "Help new team members get up to speed quickly with concise summaries of important materials.",
    },
    {
      icon: <Zap />,
      title: "Active Learning",
      description: "Turn passive video watching into active learning with highlights and key takeaways.",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {benefits.map((benefit, index) => (
          <BenefitCard
            key={index}
            title={benefit.title}
            description={benefit.description}
            icon={benefit.icon}
          />
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-indigo-500/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="mb-4 md:mb-0 md:mr-6">
            <Target className="w-12 h-12 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Boost Team Productivity by up to 40%
            </h3>
            <p className="text-gray-300">
              Our customers report significant time savings and improved information retention when using Shortify for
              corporate knowledge management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Use Cases Tab
const UseCasesTab = () => {
  const useCases = [
    {
      icon: <BookOpen />,
      title: "Training Summaries",
      description: "Convert lengthy training videos into concise learning modules.",
    },
    {
      icon: <MessageSquare />,
      title: "Meeting Recaps",
      description: "Summarize recorded meetings into actionable highlights.",
    },
    {
      icon: <UserPlus />,
      title: "Onboarding Kits",
      description: "Create digestible content packages for new team members.",
    },
    {
      icon: <Library />,
      title: "Knowledge Libraries",
      description: "Build searchable repositories of corporate knowledge.",
    },
    {
      icon: <ClipboardList />,
      title: "Policy Digest",
      description: "Simplify complex policies into understandable summaries.",
    },
    {
      icon: <Bell />,
      title: "Team Updates",
      description: "Keep everyone informed with essential information only.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {useCases.map((useCase, index) => (
        <UseCase
          key={index}
          title={useCase.title}
          description={useCase.description}
          icon={useCase.icon}
        />
      ))}
    </div>
  );
};

export default function CorporateSection() {
  const [activeTab, setActiveTab] = useState("how-it-works");
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const tabComponents = {
    "how-it-works": HowItWorksTab,
    "benefits": BenefitsTab,
    "use-cases": UseCasesTab,
  };
  const ActiveTab = tabComponents[activeTab];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden relative pt-32 px-4 md:px-8 lg:px-16">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orb following mouse */}
        <div
          className="absolute w-[800px] h-[800px] opacity-30 transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />

        {/* Static gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-cyan-900/5" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-purple-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-t from-blue-600/10 to-transparent rounded-full blur-3xl" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none z-0" />
      </div>
      <Header />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-1/3 w-64 h-64 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-extrabold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-cyan-200">
              Work Smarter, Not Harder with
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              AI Summaries
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform lengthy content into actionable insights. Help your team save time and boost productivity.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-12 gap-4">
          <TabButton
            label="How It Works"
            active={activeTab === "how-it-works"}
            onClick={() => setActiveTab("how-it-works")}
            id="how-it-works"
          />
          <TabButton
            label="Benefits"
            active={activeTab === "benefits"}
            onClick={() => setActiveTab("benefits")}
            id="benefits"
          />
          <TabButton
            label="Use Cases"
            active={activeTab === "use-cases"}
            onClick={() => setActiveTab("use-cases")}
            id="use-cases"
          />
        </div>

        {/* Tab Content */}
        <div id={`panel-${activeTab}`} role="tabpanel" className="mb-16">
          <ActiveTab />
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md mx-auto">
            <h4 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              Ready to Transform Your Workflow?
            </h4>
            <a href="/features/pdf-summarizer"> <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 flex items-center mx-auto mb-3">
              Start Your Smart Journey
              <ChevronRight className="ml-2 h-5 w-5" />
            </button> </a>
            <p className="text-sm text-gray-400">Start your smart journey today.</p>
          </div>
        </div>
      </div>
      {/*footer*/}
      <footer className="relative z-10 mt-10"> 
            <div className="mx-auto max-w-7xl px-4 py-10">
              <div className="bg-gray-800/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-6 sm:px-8 py-8">
                
                {/* Mobile Layout - Hidden on Desktop */}
                <div className="lg:hidden flex flex-col space-y-8">
                  
                  {/* Brand Section - Mobile */}
                  <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-white mb-3">
                      Kwix<span className="text-green-500">Lab</span>
                    </h1>
                    <div className="text-gray-300 text-sm leading-relaxed h-6">
                      <Typewriter
                        words={[
                          "Your all-in-one AI-powered platform for video, document, and productivity tools.",
                          "Generate viral YouTube Shorts in seconds with AI.",
                          "Summarize YouTube videos into bite-sized insights instantly.",
                          "Get instant PDF and article summaries with a single click.",
                          "Analyze resumes and generate tailored cover letters effortlessly.",
                          "Boost your productivity with AI-powered assignment and research tools.",
                          "Transform data into insights with our smart Data Analyzer.",
                          "Optimize your professional presence with the LinkedIn Helper.",
                        ]}
                        typeSpeed={50}
                        deleteSpeed={40}
                        delaySpeed={1000}
                      />
                    </div>
                  </div>
      
                  {/* Legal and Contact Section - Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-lg mx-auto">
                    
                    {/* Legal Section */}
                    <div className="text-center">
                      <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
                      <div className="space-y-3">
                        <div>
                          <a 
                            href="/refund-policy" 
                            className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                          >
                            Refund Policy
                          </a>
                        </div>
                        <div>
                          <a 
                            href="/terms-of-service" 
                            className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                          >
                            Terms of Service
                          </a>
                        </div>
                        <div>
                          <a 
                            href="/privacy-policy" 
                            className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                          >
                            Privacy Policy
                          </a>
                        </div>
                      </div>
                    </div>
      
                    {/* Contact Section */}
                    <div className="text-center">
                      <h2 className="text-lg font-semibold text-white mb-4">Contact Us</h2>
                      <div className="flex items-center justify-center space-x-2 text-gray-300">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a 
                          href="mailto:info@kwixlab.com"
                          className="text-sm hover:text-green-500 transition-colors duration-200 break-all"
                        >
                          info@kwixlab.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
      
                {/* Desktop Layout - Hidden on Mobile */}
                <div className="hidden lg:block">
                  <div className="flex justify-between items-start">
                    
                    {/* Brand Section for Desktop */}
                    <div className="flex-1 max-w-2xl">
                      <h1 className="text-3xl font-extrabold text-white mb-3">
                        Kwix<span className="text-green-500">Lab</span>
                      </h1>
                      <div className="text-gray-300 text-md leading-relaxed h-6">
                        <Typewriter
                          words={[
                            "Your all-in-one AI-powered platform for video, document, and productivity tools.",
                            "Generate viral YouTube Shorts in seconds with AI.",
                            "Summarize YouTube videos into bite-sized insights instantly.",
                            "Get instant PDF and article summaries with a single click.",
                            "Analyze resumes and generate tailored cover letters effortlessly.",
                            "Boost your productivity with AI-powered assignment and research tools.",
                            "Transform data into insights with our smart Data Analyzer.",
                            "Optimize your professional presence with the LinkedIn Helper.",
                          ]}
                          typeSpeed={50}
                          deleteSpeed={40}
                          delaySpeed={1000}
                        />
                      </div>
                    </div>
                    
                    {/* Legal and Contact for Desktop */}
                    <div className="flex gap-12">
                      
                      {/* Legal Section */}
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
                        <div className="space-y-3">
                          <div>
                            <a 
                              href="/refund-policy" 
                              className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                            >
                              Refund Policy
                            </a>
                          </div>
                          <div>
                            <a 
                              href="/terms-of-service" 
                              className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                            >
                              Terms of Service
                            </a>
                          </div>
                          <div>
                            <a 
                              href="/privacy-policy" 
                              className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                            >
                              Privacy Policy
                            </a>
                          </div>
                        </div>
                      </div>
      
                      {/* Contact Section */}
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-4">Contact Us</h2>
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <a 
                            href="mailto:info@kwixlab.com"
                            className="text-sm hover:text-green-500 transition-colors duration-200"
                          >
                            info@kwixlab.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
      
              {/* Bottom Copyright */}
              <div className="text-center mt-6 text-sm text-gray-300">
                © 2025 KwixLab. All Rights Reserved.
              </div>
            </div>
          </footer>
    </div>
  );
}