import React, { useState, useEffect } from "react";
import {Search,Home,User,Settings,Upload,Zap,Target,TrendingUp,CheckCircle,AlertCircle,FileText,Sparkles,Award,Brain,Rocket,} from "lucide-react";
import { useNavigate } from "react-router-dom";
const roles = [
  {
    id: "frontend",
    name: "Frontend Developer",
    icon: "💻",
    color: "from-blue-500 to-purple-600",
  },
  {
    id: "backend",
    name: "Backend Developer",
    icon: "⚙️",
    color: "from-green-500 to-teal-600",
  },
  {
    id: "data",
    name: "Data Scientist",
    icon: "📊",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "ai",
    name: "AI/ML Engineer",
    icon: "🧠",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "fullstack",
    name: "Full Stack Developer",
    icon: "🚀",
    color: "from-indigo-500 to-blue-600",
  },
  {
    id: "devops",
    name: "DevOps Engineer",
    icon: "☁️",
    color: "from-gray-500 to-slate-600",
  },
  {
    id: "pm",
    name: "Product Manager",
    icon: "📈",
    color: "from-emerald-500 to-green-600",
  },
];

const ResumeAnalyzer = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState(1);
  const [animateResult, setAnimateResult] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!resumeFile || !selectedRole) {
      alert("Please upload a resume and select a role.");
      return;
    }

    const formData = new FormData();
    formData.append("file", resumeFile);
    formData.append("role", selectedRole.name);

    try {
      setLoading(true);
      setStep(3);

      // TODO: Replace with actual API endpoint
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const result = await response.json();
      setResult(result);
      setAnimateResult(true);
      setStep(4);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Something went wrong. Please try again.");
      setStep(2); // Go back to previous step on error
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
        setStep(2);
      }
    }
  };

  const ScoreCircle = ({ score }) => {
    const radius = 45;
    const stroke = 6;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;

    // Ensure score is a number and clamp it between 0 and 100
    const validScore = Math.max(0, Math.min(100, Number(score) || 0));
    const strokeDashoffset = circumference - (validScore / 100) * circumference;
    const strokeDasharray = circumference;

    return (
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-2000 ease-out ${
              validScore >= 80
                ? "text-green-500"
                : validScore >= 60
                ? "text-yellow-500"
                : "text-red-500"
            }`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-800">{score}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Search className="h-8 w-8 text-emerald-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Rez<span className="text-emerald-400">AI</span>me
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
                <item.icon className="h-5 w-5 text-white/80 hover:text-white"  />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Resume Analysis
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Unlock Your
              <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Career Potential
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get instant, AI-driven insights to optimize your resume and land
              your dream job
            </p>
          </div>

          {step === 1 && (
            <div className="max-w-4xl mx-auto space-y-12">
              {/* Role Selection */}
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <Target className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Choose Your Target Role
                  </h2>
                </div>
                <div className="relative max-w-md mx-auto">
                  <select
                    value={selectedRole?.id || ""}
                    onChange={(e) => {
                      const role = roles.find((r) => r.id === e.target.value);
                      setSelectedRole(role);
                    }}
                    className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent appearance-none cursor-pointer hover:bg-white/20 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-900 text-white">
                      -- Select a Role --
                    </option>
                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                        className="bg-gray-900 text-white"
                      >
                        {role.icon} {role.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-white/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {selectedRole && (
                  <div className="max-w-md mx-auto mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-emerald-400/30 animate-fadeIn">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`text-3xl p-3 rounded-xl bg-gradient-to-r ${selectedRole.color}`}
                      >
                        {selectedRole.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {selectedRole.name}
                        </h3>
                        <p className="text-emerald-300 text-sm">
                          Role selected successfully!
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-emerald-400 ml-auto" />
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Area */}
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <Upload className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Upload Your Resume
                  </h2>
                </div>
                <div
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 max-w-lg mx-auto ${
                    dragActive
                      ? "border-emerald-400 bg-emerald-500/20"
                      : resumeFile
                      ? "border-green-400 bg-green-500/20"
                      : "border-white/30 bg-white/10 hover:border-emerald-400/50 hover:bg-white/20"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      setResumeFile(e.target.files[0]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    {resumeFile ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                        <div>
                          <p className="text-green-300 font-semibold text-lg">
                            File uploaded successfully!
                          </p>
                          <p className="text-gray-300">{resumeFile.name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <FileText className="w-16 h-16 text-white/60 mx-auto" />
                        <div>
                          <p className="text-white font-semibold text-lg">
                            Drop your PDF resume here
                          </p>
                          <p className="text-gray-300">
                            or click to browse files
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              {selectedRole && resumeFile && (
                <div className="text-center animate-fadeIn">
                  <button
                    onClick={() => setStep(2)}
                    className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">Continue to Analysis</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedRole && resumeFile && (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">
                  Ready to Analyze
                </h2>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-300">Selected Role:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{selectedRole.icon}</span>
                      <span className="text-white font-semibold">
                        {selectedRole.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Resume File:</span>
                    <span className="text-white font-semibold">
                      {resumeFile.name}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="group relative px-12 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6" />
                  <span className="text-lg">Analyze Resume</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </button>
            </div>
          )}

          {step === 3 && loading && (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-6">
                <Brain className="w-20 h-20 text-emerald-400 mx-auto animate-pulse" />
                <h2 className="text-3xl font-bold text-white">
                  Analyzing Your Resume
                </h2>
                <p className="text-gray-300 text-lg">
                  Our AI is examining your resume against industry standards...
                </p>
              </div>

              {/* Loading Progress */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="space-y-4">
                    {[
                      "Extracting key information...",
                      "Analyzing skills alignment...",
                      "Comparing with role requirements...",
                      "Generating recommendations...",
                    ].map((text, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            index < 2
                              ? "bg-emerald-400"
                              : index === 2
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-gray-600"
                          }`}
                        ></div>
                        <span className="text-gray-300">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div
              className={`space-y-8 transition-all duration-1000 ${
                animateResult
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-10"
              }`}
            >
              {/* Score Overview */}
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-bold text-white">
                  Analysis Complete
                </h2>
                <div className="flex justify-center">
                  <ScoreCircle score={result.score} />
                </div>
                <div className="max-w-2xl mx-auto">
                  <div
                    className={`inline-flex items-center px-6 py-3 rounded-full font-semibold text-lg ${
                      result.score >= 80
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : result.score >= 60
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    <Award className="w-5 h-5 mr-2" />
                    {result.score >= 80
                      ? "Excellent Match!"
                      : result.score >= 60
                      ? "Good Match"
                      : "Needs Improvement"}
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-green-400/30">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Strengths</h3>
                  </div>
                  <ul className="space-y-4">
                    {result.strengths?.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-orange-400/30">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Improvements
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {result.improvements?.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Skills Analysis */}
              {(result.keywords || result.recommendedSkills) && (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/30">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Skills Analysis
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    {result.keywords && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Matched Skills{" "}
                          {result.matchedSkills &&
                            result.totalSkills &&
                            `(${result.matchedSkills}/${result.totalSkills})`}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.keywords.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm border border-emerald-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.recommendedSkills && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Recommended Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {result.recommendedSkills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {result.summary && (
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Summary</h3>
                  </div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                onClick={() => {
                    setStep(1);
                    setResult(null);
                    setResumeFile(null);
                    setSelectedRole(null);
                    setAnimateResult(false);
                  }}
                 className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <Rocket className="w-5 h-5" />
                    <span>Analyze Another Resume</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
