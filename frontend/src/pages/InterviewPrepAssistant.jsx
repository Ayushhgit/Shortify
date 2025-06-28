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
    MessageCircle,
    Send,
    ChevronDown,
    Upload,
    X,
    File,
    Target,
    CheckCircle,
    AlertCircle,
    Brain,
    Clock,
    Star,
    TrendingUp,
    Search,
    RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from '../firebase';

export default function InterviewPrepAssistant() {
    const [formData, setFormData] = useState({
        resumeFile: null,
        resumeText: "",
        jobFile: null,
        jobText: "",
        company: "",
        role: "",
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExtractingResume, setIsExtractingResume] = useState(false);
    const [isExtractingJob, setIsExtractingJob] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [errors, setErrors] = useState({});
    const [resumeUploadMethod, setResumeUploadMethod] = useState("file");
    const [jobUploadMethod, setJobUploadMethod] = useState("text");
    const [activeTab, setActiveTab] = useState("input");
    const [chatMode, setChatMode] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

    const navigate = useNavigate();

    const displayToast = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    const API_BASE_URL = 'https://kwixlab.com'; // Adjust your backend URL

    const apiCall = async (endpoint, formData) => {
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API call failed');
        }

        return response.json();
    };

    const handleUploadMethodChange = (type, method) => {
        if (type === "resume") {
            setResumeUploadMethod(method);
            if (method === "text") {
                setFormData(prev => ({ ...prev, resumeFile: null }));
            } else if (method === "file") {
                setFormData(prev => ({ ...prev, resumeText: "" }));
            }
        } else {
            setJobUploadMethod(method);
            if (method === "text") {
                setFormData(prev => ({ ...prev, jobFile: null }));
            } else if (method === "file") {
                setFormData(prev => ({ ...prev, jobText: "" }));
            }
        }
        setErrors(prev => ({ ...prev, [type]: "" }));
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

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

        if (file.size > 5 * 1024 * 1024) {
            displayToast("File size must be less than 5MB", "error");
            return;
        }

        if (type === "resume") {
            setFormData((prev) => ({ ...prev, resumeFile: file }));
            displayToast("Resume uploaded successfully!");
        } else {
            setFormData((prev) => ({ ...prev, jobFile: file }));
            displayToast("Job description uploaded successfully!");
        }
    };

    const removeFile = (type) => {
        if (type === "resume") {
            setFormData((prev) => ({ ...prev, resumeFile: null, resumeText: "" }));
        } else {
            setFormData((prev) => ({ ...prev, jobFile: null, jobText: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const hasResumeText = formData.resumeText && formData.resumeText.trim();
        const hasResumeFile = formData.resumeFile;
        const hasJobText = formData.jobText && formData.jobText.trim();
        const hasJobFile = formData.jobFile;

        if (!hasResumeText && !hasResumeFile && !isExtractingResume) {
            newErrors.resume = "Resume content is required";
        }

        if (!hasJobText && !hasJobFile && !isExtractingJob) {
            newErrors.job = "Job description is required";
        }

        if (!formData.company.trim()) newErrors.company = "Company name is required";
        if (!formData.role.trim()) newErrors.role = "Role/position is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAnalyze = async () => {
        if (!validateForm()) {
            displayToast("Please fill in all required fields", "error");
            return;
        }

        setIsAnalyzing(true);
        setAnalysis(null);
        setQuestions([]);

        try {
            const formDataToSend = new FormData();

            // Add files or text
            if (formData.resumeFile) {
                formDataToSend.append('resume_file', formData.resumeFile);
            } else if (formData.resumeText) {
                formDataToSend.append('resume_text', formData.resumeText);
            }

            if (formData.jobFile) {
                formDataToSend.append('job_file', formData.jobFile);
            } else if (formData.jobText) {
                formDataToSend.append('job_text', formData.jobText);
            }

            formDataToSend.append('company', formData.company);
            formDataToSend.append('role', formData.role);

            const result = await apiCall('/interview-prep/analyze', formDataToSend);

            setAnalysis({
                overallMatch: result.overall_match,
                strengths: result.strengths,
                gaps: result.gaps,
                keyWords: result.key_words,
                sessionId: result.session_id
            });

            setActiveTab("analysis");
            displayToast("Analysis completed successfully!");

        } catch (error) {
            displayToast(error.message || "Analysis failed", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateQuestions = async () => {
        if (!analysis?.sessionId) {
            displayToast("Please run analysis first", "error");
            return;
        }

        setIsGeneratingQuestions(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('session_id', analysis.sessionId);
            formDataToSend.append('question_count', '5');
            formDataToSend.append('difficulty_level', 'mixed');
            formDataToSend.append('question_types', 'behavioral');
            formDataToSend.append('question_types', 'technical');
            formDataToSend.append('question_types', 'situational');

            const result = await apiCall('/interview-prep/questions', formDataToSend);

            // Add logging to debug
            console.log('API Response:', result);
            console.log('Questions:', result.questions);
            console.log('Current questions state:', questions);
            console.log('Questions length:', questions.length);
            console.log('Active tab:', activeTab);

            // Set questions and switch to questions tab
            setQuestions(result.questions || []);
            setActiveTab("questions"); // Add this line to automatically switch tabs
            displayToast("Questions generated successfully!");

        } catch (error) {
            console.error('Generate questions error:', error);
            displayToast(error.message || "Failed to generate questions", "error");
        }
        finally {
            setIsGeneratingQuestions(false);
        }
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || !analysis?.sessionId) return;

        const userMessage = { type: "user", content: chatInput };
        setChatMessages(prev => [...prev, userMessage]);
        const currentInput = chatInput;
        setChatInput("");
        setIsChatLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('session_id', analysis.sessionId);
            formDataToSend.append('message', currentInput);

            const result = await apiCall('/interview-prep/chat', formDataToSend);

            const aiResponse = {
                type: "ai",
                content: result.response
            };

            setChatMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            displayToast(error.message || "Chat failed", "error");
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            displayToast("Copied to clipboard!");
        } catch (error) {
            displayToast("Failed to copy", "error");
        }
    };

    const handleDownload = () => {
        const content = `
INTERVIEW PREPARATION REPORT
============================

Company: ${formData.company}
Role: ${formData.role}
Overall Match: ${analysis?.overallMatch}%

STRENGTHS:
${analysis?.strengths.map(s => `• ${s.skill} (${s.match}%): ${s.description}`).join('\n')}

AREAS TO PREPARE:
${analysis?.gaps.map(g => `• ${g.skill} (${g.importance} importance): ${g.suggestion}`).join('\n')}

LIKELY INTERVIEW QUESTIONS:
${questions.map(q => `\n${q.type.toUpperCase()}: ${q.question}\nFramework: ${q.framework}\nTip: ${q.sampleAnswer}`).join('\n\n')}
    `;

        const element = document.createElement("a");
        const file = new Blob([content], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${formData.company}_${formData.role}_interview_prep.txt`.replace(/[^a-z0-9]/gi, "_");
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        displayToast("Report downloaded successfully!");
    };

    const handleClear = () => {
        setFormData({
            resumeFile: null,
            resumeText: "",
            jobFile: null,
            jobText: "",
            company: "",
            role: "",
        });
        setAnalysis(null);
        setQuestions([]);
        setErrors({});
        setActiveTab("input");
        setChatMessages([]);
        setChatMode(false);
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Low": return "text-green-400";
            case "Medium": return "text-yellow-400";
            case "High": return "text-red-400";
            default: return "text-gray-400";
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case "Behavioral": return "bg-blue-500/20 text-blue-400";
            case "Technical": return "bg-purple-500/20 text-purple-400";
            case "Situational": return "bg-green-500/20 text-green-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
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
                            <Brain className="h-8 w-8 text-purple-400 mr-3" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-xl font-bold text-white">
                            Interview<span className="text-purple-400">AI</span>
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
            <main className="relative z-10 pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI-Powered Interview Preparation
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                            Ace Your Next
                            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Interview
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Get personalized interview guidance by analyzing your resume against job requirements
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                            {[
                                { id: "input", label: "Input", icon: Upload },
                                { id: "analysis", label: "Analysis", icon: Target },
                                { id: "questions", label: "Questions", icon: MessageCircle },
                                { id: "chat", label: "AI Chat", icon: Brain }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${activeTab === tab.id
                                        ? "bg-purple-500 text-white shadow-lg"
                                        : "text-gray-300 hover:text-white hover:bg-white/10"
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Tab */}
                    {activeTab === "input" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Job Details</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Company Name */}
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                                            <Building2 className="w-4 h-4 mr-2" />
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => handleInputChange("company", e.target.value)}
                                            placeholder="e.g., Google, Microsoft, Meta"
                                            className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.company ? "border-red-400" : "border-white/30"
                                                } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm`}
                                        />
                                        {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
                                    </div>

                                    {/* Role/Position */}
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
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
                                        {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role}</p>}
                                    </div>

                                    {/* Resume Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Resume/Background *
                                        </label>
                                        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleUploadMethodChange("resume", "file")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${resumeUploadMethod === "file"
                                                    ? "bg-purple-500 text-white"
                                                    : "text-gray-300 hover:text-white"
                                                    }`}
                                            >
                                                <Upload className="w-4 h-4 inline mr-2" />
                                                Upload File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUploadMethodChange("resume", "text")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${resumeUploadMethod === "text"
                                                    ? "bg-purple-500 text-white"
                                                    : "text-gray-300 hover:text-white"
                                                    }`}
                                            >
                                                <FileText className="w-4 h-4 inline mr-2" />
                                                Paste Text
                                            </button>
                                        </div>

                                        {resumeUploadMethod === "file" ? (
                                            <div>
                                                {!formData.resumeFile ? (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.txt"
                                                            onChange={(e) => handleFileUpload(e, "resume")}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <div className="w-full px-4 py-8 rounded-xl border-2 border-dashed border-white/30 text-center hover:border-purple-400 transition-all duration-300 bg-white/5">
                                                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                            <p className="text-gray-300 mb-1">Drop your resume here or click to browse</p>
                                                            <p className="text-gray-400 text-sm">Supports PDF, DOC, DOCX, TXT (max 5MB)</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                                                        <div className="flex items-center">
                                                            <File className="w-5 h-5 text-purple-400 mr-3" />
                                                            <div>
                                                                <p className="text-white font-medium">{formData.resumeFile.name}</p>
                                                                <p className="text-gray-400 text-sm">
                                                                    {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile("resume")}
                                                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                )}
                                                {isExtractingResume && (
                                                    <div className="flex items-center justify-center mt-4 p-4 bg-white/5 rounded-xl">
                                                        <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
                                                        <span className="text-gray-300">Processing resume...</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={formData.resumeText}
                                                onChange={(e) => handleInputChange("resumeText", e.target.value)}
                                                placeholder="Paste your resume content, key experiences, skills, and achievements..."
                                                rows={6}
                                                className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.resume ? "border-red-400" : "border-white/30"
                                                    } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm resize-none`}
                                            />
                                        )}
                                        {errors.resume && <p className="text-red-400 text-sm mt-1">{errors.resume}</p>}
                                    </div>

                                    {/* Job Description Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-3">
                                            Job Description *
                                        </label>
                                        <div className="flex bg-white/10 rounded-xl p-1 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => handleUploadMethodChange("job", "text")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${jobUploadMethod === "text"
                                                    ? "bg-purple-500 text-white"
                                                    : "text-gray-300 hover:text-white"
                                                    }`}
                                            >
                                                <FileText className="w-4 h-4 inline mr-2" />
                                                Paste Text
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUploadMethodChange("job", "file")}
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${jobUploadMethod === "file"
                                                    ? "bg-purple-500 text-white"
                                                    : "text-gray-300 hover:text-white"
                                                    }`}
                                            >
                                                <Upload className="w-4 h-4 inline mr-2" />
                                                Upload File
                                            </button>
                                        </div>

                                        {jobUploadMethod === "text" ? (
                                            <textarea
                                                value={formData.jobText}
                                                onChange={(e) => handleInputChange("jobText", e.target.value)}
                                                placeholder="Paste the job description including requirements, responsibilities, and qualifications..."
                                                rows={6}
                                                className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.job ? "border-red-400" : "border-white/30"
                                                    } text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm resize-none`}
                                            />
                                        ) : (
                                            <div>
                                                {!formData.jobFile ? (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.doc,.docx,.txt"
                                                            onChange={(e) => handleFileUpload(e, "job")}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <div className="w-full px-4 py-8 rounded-xl border-2 border-dashed border-white/30 text-center hover:border-purple-400 transition-all duration-300 bg-white/5">
                                                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                            <p className="text-gray-300 mb-1">Drop job description here or click to browse</p>
                                                            <p className="text-gray-400 text-sm">Supports PDF, DOC, DOCX, TXT (max 5MB)</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/20">
                                                        <div className="flex items-center">
                                                            <File className="w-5 h-5 text-purple-400 mr-3" />
                                                            <div>
                                                                <p className="text-white font-medium">{formData.jobFile.name}</p>
                                                                <p className="text-gray-400 text-sm">
                                                                    {(formData.jobFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile("job")}
                                                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                )}
                                                {isExtractingJob && (
                                                    <div className="flex items-center justify-center mt-4 p-4 bg-white/5 rounded-xl">
                                                        <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
                                                        <span className="text-gray-300">Processing job description...</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {errors.job && <p className="text-red-400 text-sm mt-1">{errors.job}</p>}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className={`flex-1 group relative px-6 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isAnalyzing
                                                ? "bg-gray-600/50 cursor-not-allowed"
                                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center space-x-3">
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span>Analyzing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Target className="h-5 w-5" />
                                                        <span>Analyze Match</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleClear}
                                            className="px-6 py-4 border-2 border-white/30 rounded-2xl text-white font-bold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                                        >
                                            <RefreshCw className="h-5 w-5 inline mr-2" />
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Tips Section */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mr-3">
                                        <Star className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Interview Tips</h2>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        {
                                            icon: Clock,
                                            title: "Research the Company",
                                            tip: "Spend 30-60 minutes understanding their mission, recent news, and culture",
                                            color: "text-blue-400"
                                        },
                                        {
                                            icon: CheckCircle,
                                            title: "Practice STAR Method",
                                            tip: "Structure answers with Situation, Task, Action, Result for behavioral questions",
                                            color: "text-green-400"
                                        },
                                        {
                                            icon: TrendingUp,
                                            title: "Prepare Questions",
                                            tip: "Have 3-5 thoughtful questions about the role, team, and company growth",
                                            color: "text-purple-400"
                                        },
                                        {
                                            icon: AlertCircle,
                                            title: "Technical Preparation",
                                            tip: "Review core concepts and practice coding problems relevant to the role",
                                            color: "text-yellow-400"
                                        }
                                    ].map((tip, index) => (
                                        <div key={index} className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <tip.icon className={`w-6 h-6 ${tip.color} mt-1 flex-shrink-0`} />
                                            <div>
                                                <h3 className="text-white font-semibold mb-1">{tip.title}</h3>
                                                <p className="text-gray-300 text-sm">{tip.tip}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analysis Tab */}
                    {activeTab === "analysis" && analysis && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Overall Match */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mr-3">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Match Analysis</h2>
                                </div>

                                <div className="text-center mb-8">
                                    <div className="relative w-32 h-32 mx-auto mb-4">
                                        <div className="absolute inset-0 rounded-full border-8 border-gray-600/30"></div>
                                        <div
                                            className="absolute inset-0 rounded-full border-8 border-green-400 border-t-transparent animate-pulse"
                                            style={{
                                                transform: `rotate(${(analysis.overallMatch / 100) * 360}deg)`,
                                                clipPath: `polygon(50% 50%, 50% 0%, ${50 + (analysis.overallMatch / 100) * 50}% 0%, ${50 + (analysis.overallMatch / 100) * 50}% 100%, 50% 100%)`
                                            }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">{analysis.overallMatch}%</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-300">Overall Match Score</p>
                                </div>

                                {/* Strengths */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                                        Your Strengths
                                    </h3>
                                    <div className="space-y-3">
                                        {analysis.strengths.map((strength, index) => (
                                            <div key={index} className="bg-white/5 rounded-xl p-4 border border-green-500/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-white font-semibold">{strength.skill}</span>
                                                    <span className="text-green-400 font-bold">{strength.match}%</span>
                                                </div>
                                                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                                                    <div
                                                        className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full"
                                                        style={{ width: `${strength.match}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-gray-300 text-sm">{strength.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Key Words */}
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                        <Search className="w-5 h-5 text-purple-400 mr-2" />
                                        Key Skills Found
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keyWords.map((keyword, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Areas to Improve */}
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="flex items-center mb-6">
                                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mr-3">
                                        <AlertCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Areas to Prepare</h2>
                                </div>

                                <div className="space-y-4">
                                    {analysis.gaps.map((gap, index) => (
                                        <div key={index} className="bg-white/5 rounded-xl p-4 border border-yellow-500/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-white font-semibold">{gap.skill}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${gap.importance === 'High' ? 'bg-red-500/20 text-red-400' :
                                                    gap.importance === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {gap.importance}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 text-sm">{gap.suggestion}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={handleGenerateQuestions}
                                        disabled={isGeneratingQuestions}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {isGeneratingQuestions ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Brain className="w-4 h-4" />
                                        )}
                                        {isGeneratingQuestions ? "Generating..." : "Generate Interview Questions"}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download Report</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("questions")}
                                        className="flex-1 px-6 py-3 border-2 border-white/30 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>View Questions</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions Tab */}
                    {activeTab === "questions" && questions.length > 0 && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mr-3">
                                            <MessageCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Practice Questions</h2>
                                    </div>
                                    <div className="text-gray-300 text-sm">
                                        {questions.length} questions generated
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {questions.map((question) => (
                                        <div key={question.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                            <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(question.type)}`}>
                                                        {question.type}
                                                    </span>
                                                    <span className={`text-sm font-semibold ${getDifficultyColor(question.difficulty)}`}>
                                                        {question.difficulty}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(question.question)}
                                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                                    title="Copy question"
                                                >
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-white font-semibold text-lg mb-2">Question:</h3>
                                                <p className="text-gray-200">{question.question}</p>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="text-purple-400 font-semibold mb-2">Framework:</h4>
                                                <p className="text-gray-300 text-sm">{question.framework}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-green-400 font-semibold mb-2">Approach:</h4>
                                                <p className="text-gray-300 text-sm">{question.sampleAnswer}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={handleDownload}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Download Questions</span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("chat")}
                                        className="px-6 py-3 border-2 border-white/30 rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
                                    >
                                        <Brain className="w-4 h-4" />
                                        <span>Practice with AI</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Tab */}
                    {activeTab === "chat" && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                                <div className="flex items-center justify-between p-6 border-b border-white/10">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-3">
                                            <Brain className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">AI Interview Coach</h2>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-green-400 text-sm">Online</span>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="h-96 overflow-y-auto p-6 space-y-4">
                                    {chatMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 py-16">
                                            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg mb-2">Start a conversation with your AI coach</p>
                                            <p className="text-sm">Ask questions about interview preparation, practice answers, or get feedback</p>
                                        </div>
                                    ) : (
                                        chatMessages.map((message, index) => (
                                            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-2xl ${message.type === 'user'
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/10 text-gray-200 border border-white/20'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {isChatLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 text-gray-200 border border-white/20 p-4 rounded-2xl">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="p-6 border-t border-white/10">
                                    <div className="flex space-x-4">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                                            placeholder="Ask me anything about interview preparation..."
                                            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 backdrop-blur-sm"
                                        />
                                        <button
                                            onClick={handleChatSubmit}
                                            disabled={!chatInput.trim() || isChatLoading}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>Send</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty States */}
                    {activeTab === "analysis" && !analysis && (
                        <div className="text-center py-16">
                            <Target className="h-24 w-24 mx-auto mb-6 text-gray-400 opacity-50" />
                            <h3 className="text-2xl font-bold text-white mb-4">No Analysis Yet</h3>
                            <p className="text-gray-300 mb-8">Upload your resume and job description to get started</p>
                            <button
                                onClick={() => setActiveTab("input")}
                                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300"
                            >
                                Get Started
                            </button>
                        </div>
                    )}

                    {activeTab === "questions" && questions.length === 0 && (
                        <div className="text-center py-16">
                            <MessageCircle className="h-24 w-24 mx-auto mb-6 text-gray-400 opacity-50" />
                            <h3 className="text-2xl font-bold text-white mb-4">No Questions Generated</h3>
                            <p className="text-gray-300 mb-8">Complete the analysis first to get personalized interview questions</p>
                            <button
                                onClick={() => setActiveTab("input")}
                                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:scale-105 transition-all duration-300"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
                    <p className="text-gray-300 text-center">
                        Made with ❤️ and ☕ | Powered by AI
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