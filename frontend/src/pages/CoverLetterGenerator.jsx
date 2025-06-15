import React, { useState } from "react";
import {
  FileText,
  Briefcase,
  Building2,
  User,
  Sparkles,
  Copy,
  Download,
  Loader2,
  Home,
  Settings,
  Mail,
  Send,
  ChevronDown,
  Upload,
  X,
  File,
} from "lucide-react";
import Toast from "../components/Toast";
import { getToken } from '../firebase';
import { useNavigate } from "react-router-dom";

export default function CoverLetterGenerator() {
  const [formData, setFormData] = useState({
    resumeFile: null,
    resumeText: "",
    job: "",
    tone: "professional",
    company: "",
    role: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtractingResume, setIsExtractingResume] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [errors, setErrors] = useState({});
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "text" 

  const navigate = useNavigate();

  const handleUploadMethodChange = (method) => {
    setUploadMethod(method);

    // Clear data when switching methods to avoid confusion
    if (method === "text") {
      setFormData(prev => ({ ...prev, resumeFile: null }));
    } else if (method === "file") {
      setFormData(prev => ({ ...prev, resumeText: "" }));
    }

    // Clear any existing errors
    if (errors.resume) {
      setErrors(prev => ({ ...prev, resume: "" }));
    }
  };

  // Backend API URL - change this to your deployed backend URL
  const API_BASE_URL = "http://localhost:8000";

  const toneOptions = [
    {
      value: "professional",
      label: "Professional",
      desc: "Formal and business-like",
    },
    { value: "friendly", label: "Friendly", desc: "Warm yet professional" },
    {
      value: "enthusiastic",
      label: "Enthusiastic",
      desc: "Energetic and excited",
    },
    {
      value: "confident",
      label: "Confident",
      desc: "Assertive and self-assured",
    },
    { value: "casual", label: "Casual", desc: "Relaxed but respectful" },
  ];

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const validateForm = () => {
    const newErrors = {};

    // Check if we have resume content from either method
    const hasResumeText = formData.resumeText && formData.resumeText.trim();
    const hasResumeFile = formData.resumeFile;
    const isProcessingFile = isExtractingResume;

    if (!hasResumeText && !hasResumeFile && !isProcessingFile) {
      newErrors.resume = "Resume content is required. Please upload a file or paste text.";
    } else if (hasResumeFile && !hasResumeText && !isProcessingFile) {
      newErrors.resume = "File uploaded but content extraction failed. Please try again or paste text manually.";
    } else if (isProcessingFile) {
      newErrors.resume = "Please wait for file processing to complete.";
    }

    if (!formData.job.trim()) newErrors.job = "Job description is required";
    if (!formData.company.trim()) newErrors.company = "Company name is required";
    if (!formData.role.trim()) newErrors.role = "Role/position is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      displayToast("Please upload a PDF, DOC, DOCX, or TXT file", "error");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      displayToast("File size must be less than 5MB", "error");
      return;
    }

    setFormData((prev) => ({ ...prev, resumeFile: file }));
    setIsExtractingResume(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/extract-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to extract resume text");
      }

      const data = await response.json();

      setFormData((prev) => ({ ...prev, resumeText: data.text }));
      displayToast("Resume uploaded and processed successfully!");
    } catch (error) {
      console.error("Error processing resume:", error);
      displayToast(`Error processing resume: ${error.message}`, "error");
      // Don't remove the file, allow manual text entry as fallback
      setFormData((prev) => ({ ...prev, resumeText: `[File uploaded: ${file.name}] - Please paste your resume content manually below or try uploading again.` }));
    } finally {
      setIsExtractingResume(false);
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, resumeFile: null, resumeText: "" }));
  };

  const handleSubmit = async (e) => {
    const idToken = await getToken();
    if (!idToken) {
      console.error("User not authenticated");
      displayToast("Authentication failed. Please try logging in again.", "error");
      return;
    }

    e.preventDefault();

    if (!validateForm()) {
      displayToast("Please fill in all required fields", "error");
      return;
    }

    setIsGenerating(true);
    setGeneratedLetter("");

    try {
      const jsonPayload = {
        resume: formData.resumeText,
        job: formData.job,
        tone: formData.tone,
        company: formData.company,
        role: formData.role,
      };

      console.log('Request payload:', jsonPayload);
      console.log('API URL:', `${API_BASE_URL}/generate-cover-letter`);
      const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonPayload),
      });


      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        console.error('Backend error details:', errorData);
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to generate cover letter`);
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedLetter(data.cover_letter);
        displayToast("Cover letter generated successfully!");
      } else {
        throw new Error(data.message || "Failed to generate cover letter");
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      let errorMessage = error.message;
      if (errorMessage === '[object Object]' || !errorMessage) {
        errorMessage = 'Server validation error. Please check your input data.';
      }
      displayToast(`Error: ${errorMessage}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      displayToast("Cover letter copied to clipboard!");
    } catch (error) {
      displayToast("Failed to copy cover letter", "error");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedLetter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download =
      `${formData.company}_${formData.role}_cover_letter.txt`.replace(
        /[^a-z0-9]/gi,
        "_"
      );
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    displayToast("Cover letter downloaded successfully!");
  };

  const handleClear = () => {
    setFormData({
      resumeFile: null,
      resumeText: "",
      job: "",
      tone: "professional",
      company: "",
      role: "",
    });
    setGeneratedLetter("");
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Mail className="h-8 w-8 text-purple-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Cover<span className="text-purple-400">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[{ icon: Home, path: "/shortify" }, { icon: User, path: "/profile" }, { icon: Settings, path: "/settings" }].map(
              (item, index) => (
                <button
                  key={index}
                  className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                  onClick={() => navigate(item.path)}>
                  <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Cover Letter Generation
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Create Perfect
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cover Letters
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Generate personalized, compelling cover letters tailored to any
              job description and company using AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Form Section */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Cover Letter Details
                </h2>
              </div>

              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    placeholder="e.g., Google, Microsoft, Meta"
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.company ? "border-red-400" : "border-white/30"
                      } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm`}
                  />
                  {errors.company && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.company}
                    </p>
                  )}
                </div>

                {/* Role/Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Role/Position *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager"
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.role ? "border-red-400" : "border-white/30"
                      } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm`}
                  />
                  {errors.role && (
                    <p className="text-red-400 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 items-center">
                    <User className="w-4 h-4 mr-2" />
                    Tone
                  </label>
                  <div className="relative">
                    <select
                      value={formData.tone}
                      onChange={(e) =>
                        handleInputChange("tone", e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm appearance-none cursor-pointer"
                    >
                      {toneOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-gray-800"
                        >
                          {option.label} - {option.desc}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Resume Upload Method Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Resume/Background *
                  </label>
                  <div className="flex bg-white/10 rounded-xl p-1 mb-4">
                    <button
                      type="button"
                      onClick={() => handleUploadMethodChange("file")}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${uploadMethod === "file"
                        ? "bg-purple-500 text-white"
                        : "text-gray-300 hover:text-white"
                        }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUploadMethodChange("text")}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${uploadMethod === "text"
                        ? "bg-purple-500 text-white"
                        : "text-gray-300 hover:text-white"
                        }`}
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Paste Text
                    </button>
                  </div>

                  {uploadMethod === "file" ? (
                    <div>
                      {!formData.resumeFile ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div
                            className={`w-full px-4 py-8 rounded-xl border-2 border-dashed ${errors.resume
                              ? "border-red-400"
                              : "border-white/30"
                              } text-center hover:border-purple-400 transition-all duration-300 bg-white/5`}
                          >
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-300 mb-1">
                              Drop your resume here or click to browse
                            </p>
                            <p className="text-gray-400 text-sm">
                              Supports PDF, DOC, DOCX, TXT (max 5MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                          <div className="flex items-center">
                            <File className="w-5 h-5 text-purple-400 mr-3" />
                            <div>
                              <p className="text-white font-medium">
                                {formData.resumeFile.name}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {(
                                  formData.resumeFile.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeFile}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      )}

                      {isExtractingResume && (
                        <div className="flex items-center justify-center mt-4 p-4 bg-white/5 rounded-xl">
                          <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
                          <span className="text-gray-300">
                            Processing resume...
                          </span>
                        </div>
                      )}

                      {formData.resumeText && (
                        <div className="mt-4">
                          <p className="text-gray-300 text-sm mb-2">
                            Extracted content preview:
                          </p>
                          <div className="max-h-32 overflow-y-auto p-3 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-gray-300 text-sm">
                              {formData.resumeText.substring(0, 200)}...
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={formData.resumeText}
                      onChange={(e) =>
                        handleInputChange("resumeText", e.target.value)
                      }
                      placeholder="Paste your resume content or key experiences, skills, and achievements..."
                      rows={6}
                      className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.resume ? "border-red-400" : "border-white/30"
                        } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm resize-none`}
                    />
                  )}

                  {errors.resume && (
                    <p className="text-red-400 text-sm mt-1">{errors.resume}</p>
                  )}
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={formData.job}
                    onChange={(e) => handleInputChange("job", e.target.value)}
                    placeholder="Paste the full job description including requirements, responsibilities, and qualifications..."
                    rows={6}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.job ? "border-red-400" : "border-white/30"
                      } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm resize-none`}
                  />
                  {errors.job && (
                    <p className="text-red-400 text-sm mt-1">{errors.job}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isGenerating}
                    className={`flex-1 group relative px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isGenerating
                      ? "bg-gray-600/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          <span>Generate Cover Letter</span>
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-4 border-2 border-white/30 rounded-2xl text-white font-bold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 md:p-8 w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Generated Cover Letter
                  </h2>
                </div>

                {generatedLetter && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-all duration-300 hover:scale-110"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-5 w-5 text-white" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-all duration-300 hover:scale-110"
                      title="Download as text file"
                    >
                      <Download className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-[400px] max-h-[70vh] md:max-h-[600px] overflow-y-auto">
                {!generatedLetter && !isGenerating && (
                  <div className="text-center text-gray-400 py-16">
                    <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">
                      Your cover letter will appear here
                    </p>
                    <p className="text-sm">
                      Fill out the form and click "Generate Cover Letter"
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center text-gray-400 py-16">
                    <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin opacity-50" />
                    <p className="text-lg mb-2">
                      Crafting your perfect cover letter...
                    </p>
                    <p className="text-sm">This may take a few moments</p>
                  </div>
                )}

                {generatedLetter && (
                  <div className="bg-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
                    <div className="prose prose-sm md:prose-base max-w-none">
                      <div className="whitespace-pre-line text-gray-200 leading-relaxed text-sm md:text-base">
                        {generatedLetter}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <p className="text-gray-300 text-center">
            Made with ❤️ and ☕ | Powered by AI
          </p>
        </div>
      </footer>

      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
