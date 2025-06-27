import React, { useState, useRef } from 'react';
import {
    User,
    Briefcase,
    MessageSquare,
    TrendingUp,
    FileText,
    Copy,
    Download,
    RefreshCw,
    Sparkles,
    Target,
    Users,
    Award,
    ChevronRight,
    ExternalLink,
    CheckCircle,
    Home,
    Settings,
    Brain
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from '../firebase';

const LinkwiseAI = () => {
    const [activeTab, setActiveTab] = useState('analyzer');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const displayToast = (message, type = "success") => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    // Form states
    const [profileForm, setProfileForm] = useState({
        linkedin_url: '',
        name: '',
        headline: '',
        about: '',
        experience: '',
        skills: ''
    });

    const [contentForm, setContentForm] = useState({
        skills: '',
        role: '',
        career_goal: '',
        tone: 'professional'
    });

    const [formErrors, setFormErrors] = useState({});

    const navigate = useNavigate();

    const resultRef = useRef(null);

    const API_BASE = 'http://localhost:8000/linkwise';

    const validateProfileForm = () => {
        const errors = {};

        if (!profileForm.linkedin_url && !profileForm.name) {
            errors.general = "Either LinkedIn URL or manual profile data is required";
        }

        if (profileForm.linkedin_url && !isValidUrl(profileForm.linkedin_url)) {
            errors.linkedin_url = "Please enter a valid URL";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateContentForm = () => {
        const errors = {};

        if (!contentForm.skills.trim()) {
            errors.skills = "Skills are required";
        }

        if (!contentForm.role.trim()) {
            errors.role = "Role is required";
        }

        if (!contentForm.career_goal.trim()) {
            errors.career_goal = "Career goal is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const makeAPICall = async (endpoint, data, idToken) => {
        try {
            // DEBUG: Log the data being sent to API
            console.log('Making API call to:', `${API_BASE}${endpoint}`);
            console.log('With data:', JSON.stringify(data, null, 2));

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${idToken}`,
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                console.error('Full validation errors:', errorData.detail);

                // DEBUG: Show detailed validation errors
                if (errorData.detail && Array.isArray(errorData.detail)) {
                    console.error('Detailed validation errors:');
                    errorData.detail.forEach((error, index) => {
                        console.error(`Error ${index + 1}:`, error);
                    });
                }

                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check if the API is running.');
            }
            throw error;
        }
    };

    // Update handleProfileAnalysis to pass idToken
    const handleProfileAnalysis = async (e) => {
        e.preventDefault();

        if (!validateProfileForm()) return;

        setLoading(true);
        setError('');

        try {
            const idToken = await getToken();
            if (!idToken) {
                console.error("User not authenticated");
                displayToast("Authentication failed. Please try logging in again.", "error");
                return;
            }

            // Clean and prepare the payload - ONLY include non-empty fields
            const cleanPayload = {};

            // Only include fields that have meaningful values
            if (profileForm.linkedin_url && profileForm.linkedin_url.trim()) {
                cleanPayload.linkedin_url = profileForm.linkedin_url.trim();
            }

            if (profileForm.name && profileForm.name.trim()) {
                cleanPayload.name = profileForm.name.trim();
            }

            if (profileForm.headline && profileForm.headline.trim()) {
                cleanPayload.headline = profileForm.headline.trim();
            }

            if (profileForm.about && profileForm.about.trim()) {
                cleanPayload.about = profileForm.about.trim();
            }

            if (profileForm.experience && profileForm.experience.trim()) {
                cleanPayload.experience = profileForm.experience.trim();
            }

            // Handle skills array properly
            if (profileForm.skills) {
                let skillsArray;
                if (typeof profileForm.skills === 'string') {
                    skillsArray = profileForm.skills
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                } else if (Array.isArray(profileForm.skills)) {
                    skillsArray = profileForm.skills.filter(s => s && s.trim());
                }

                if (skillsArray && skillsArray.length > 0) {
                    cleanPayload.skills = skillsArray;
                }
            }

            // Ensure at least one field is present
            if (Object.keys(cleanPayload).length === 0) {
                throw new Error('Please fill in at least one field');
            }

            console.log('Clean payload being sent:', JSON.stringify(cleanPayload, null, 2));

            // Pass idToken as third parameter
            const result = await makeAPICall('/analyze-profile', cleanPayload, idToken);
            setResults({ type: 'analysis', data: result });

            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update handleContentGeneration similarly
    const handleContentGeneration = async (e) => {
        e.preventDefault();

        if (!validateContentForm()) return;

        setLoading(true);
        setError('');

        try {
            const idToken = await getToken();
            if (!idToken) {
                console.error("User not authenticated");
                displayToast("Authentication failed. Please try logging in again.", "error");
                return;
            }

            const payload = {
                ...contentForm,
                skills: contentForm.skills.split(',').map(s => s.trim())
            };

            // Pass idToken as third parameter
            const result = await makeAPICall('/generate-content', payload, idToken);
            console.log('API Response:', result);

            if (!result.headlines || !result.about_sections || !result.posts) {
                throw new Error('Invalid response format from server');
            }

            setResults({ type: 'content', data: result });

            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleDownload = (content, filename) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const ScoreDisplay = ({ score }) => {
        const validScore = Math.min(Math.max(score || 0, 0), 100);
        const normalizedRadius = 45;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDasharray = `${circumference} ${circumference}`;
        const strokeDashoffset = circumference - (validScore / 100) * circumference;

        const getScoreColor = (score) => {
            if (score >= 80) return 'text-green-600 bg-green-100';
            if (score >= 60) return 'text-yellow-600 bg-yellow-100';
            return 'text-red-600 bg-red-100';
        };

        const getScoreLabel = (score) => {
            if (score >= 80) return 'Excellent';
            if (score >= 60) return 'Good';
            return 'Needs Improvement';
        };

        return (
            <div className="text-center">
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}/100
                </div>
                <p className="mt-2 text-lg font-medium text-gray-700">{getScoreLabel(score)}</p>
            </div>
        );
    };

    const tabs = [
        { id: 'analyzer', label: 'Profile Analyzer', icon: User },
        { id: 'generator', label: 'Content Generator', icon: Sparkles }
    ];

    const handleProfileInputChange = (field, value) => {
        setProfileForm(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleContentInputChange = (field, value) => {
        setContentForm(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-10 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
                </div>
            </div>

            {/* Header */}
            <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
                <div className="flex justify-between items-center h-16 px-6">
                    <div className="flex items-center">
                        <div className="relative">
                            <Users className="h-8 w-8 text-cyan-500 mr-3" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-xl font-bold text-white">
                            Link<span className="text-cyan-500">wise</span>AI
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
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI-Powered LinkedIn Optimization
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
                            Optimize Your
                            <span className="block bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                                LinkedIn Presence
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Get AI-powered insights to enhance your LinkedIn profile and generate compelling content
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 mb-8 max-w-2xl mx-auto border border-white/20">
                        <div className="flex space-x-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setResults(null);
                                            setError('');
                                            setFormErrors({});
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-6 max-w-4xl mx-auto">
                            <div className="flex items-center">
                                <div className="text-rose-300 text-sm">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* General Form Error */}
                    {formErrors.general && (
                        <div className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-6 max-w-4xl mx-auto">
                            <div className="flex items-center">
                                <div className="text-rose-300 text-sm">{formErrors.general}</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                        {/* Input Form */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                            {activeTab === 'analyzer' && (
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Analyze Your Profile</h2>
                                    </div>

                                    <form onSubmit={handleProfileAnalysis} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                                LinkedIn Profile URL
                                            </label>
                                            <input
                                                type="url"
                                                value={profileForm.linkedin_url}
                                                onChange={(e) => handleProfileInputChange('linkedin_url', e.target.value)}
                                                placeholder="https://linkedin.com/in/your-profile"
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                            />
                                            {formErrors.linkedin_url && (
                                                <p className="text-rose-400 text-xs mt-2">{formErrors.linkedin_url}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">OR fill in the details manually below</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">Name</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.name}
                                                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                                                    placeholder="Your full name"
                                                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">Headline</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.headline}
                                                    onChange={(e) => handleProfileInputChange('headline', e.target.value)}
                                                    placeholder="Your current headline"
                                                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">About Section</label>
                                            <textarea
                                                rows={4}
                                                value={profileForm.about}
                                                onChange={(e) => handleProfileInputChange('about', e.target.value)}
                                                placeholder="Your current about section..."
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">Experience</label>
                                            <textarea
                                                rows={4}
                                                value={profileForm.experience}
                                                onChange={(e) => handleProfileInputChange('experience', e.target.value)}
                                                placeholder="Your work experience and achievements..."
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">Skills</label>
                                            <input
                                                type="text"
                                                value={profileForm.skills}
                                                onChange={(e) => handleProfileInputChange('skills', e.target.value)}
                                                placeholder="JavaScript, React, Node.js, etc. (comma-separated)"
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-cyan-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Analyzing...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3">
                                                    <Target className="w-5 h-5" />
                                                    Analyze Profile
                                                </div>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'generator' && (
                                <div>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Generate Content</h2>
                                    </div>

                                    <form onSubmit={handleContentGeneration} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">Skills</label>
                                            <input
                                                type="text"
                                                value={contentForm.skills}
                                                onChange={(e) => handleContentInputChange('skills', e.target.value)}
                                                placeholder="JavaScript, React, Leadership, etc. (comma-separated)"
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                            />
                                            {formErrors.skills && (
                                                <p className="text-rose-400 text-xs mt-2">{formErrors.skills}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">Current Role</label>
                                                <input
                                                    type="text"
                                                    value={contentForm.role}
                                                    onChange={(e) => handleContentInputChange('role', e.target.value)}
                                                    placeholder="Software Engineer, Product Manager, etc."
                                                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                                />
                                                {formErrors.role && (
                                                    <p className="text-rose-400 text-xs mt-2">{formErrors.role}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-3">Tone</label>
                                                <select
                                                    value={contentForm.tone}
                                                    onChange={(e) => handleContentInputChange('tone', e.target.value)}
                                                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent appearance-none cursor-pointer"
                                                >
                                                    <option value="professional" className="bg-gray-900 text-white">Professional</option>
                                                    <option value="friendly" className="bg-gray-900 text-white">Friendly</option>
                                                    <option value="technical" className="bg-gray-900 text-white">Technical</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-3">Career Goal</label>
                                            <textarea
                                                rows={4}
                                                value={contentForm.career_goal}
                                                onChange={(e) => handleContentInputChange('career_goal', e.target.value)}
                                                placeholder="Describe your career aspirations and goals..."
                                                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
                                            />
                                            {formErrors.career_goal && (
                                                <p className="text-rose-400 text-xs mt-2">{formErrors.career_goal}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Generating...
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3">
                                                    <Sparkles className="w-5 h-5" />
                                                    Generate Content
                                                </div>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Results Display */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20" ref={resultRef}>
                            {!results && !loading && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {activeTab === 'analyzer' ? (
                                            <Target className="w-10 h-10 text-white/60" />
                                        ) : (
                                            <FileText className="w-10 h-10 text-white/60" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        {activeTab === 'analyzer' ? 'Ready to Analyze' : 'Ready to Generate'}
                                    </h3>
                                    <p className="text-gray-300 text-lg">
                                        {activeTab === 'analyzer'
                                            ? 'Fill in your profile details to get AI-powered optimization suggestions'
                                            : 'Provide your information to generate compelling LinkedIn content'
                                        }
                                    </p>
                                </div>
                            )}

                            {loading && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                        <Brain className="w-10 h-10 text-white animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">Processing...</h3>
                                    <p className="text-gray-300 text-lg">AI is analyzing your information</p>

                                    {/* Loading Progress */}
                                    <div className="mt-8 space-y-4">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                            <div className="space-y-4">
                                                {[
                                                    "Extracting key information...",
                                                    "Analyzing profile elements...",
                                                    "Comparing with best practices...",
                                                    "Generating recommendations...",
                                                ].map((text, index) => (
                                                    <div key={index} className="flex items-center space-x-3">
                                                        <div
                                                            className={`w-4 h-4 rounded-full ${index < 2
                                                                ? "bg-cyan-400"
                                                                : index === 2
                                                                    ? "bg-cyan-400 animate-pulse"
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

                            {results?.type === 'analysis' && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Profile Analysis Results</h2>
                                    </div>

                                    {/* Score Display */}
                                    <div className="flex justify-center mb-8">
                                        <ScoreDisplay score={results.data.score} />
                                    </div>

                                    {/* Strengths */}
                                    <div className="bg-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <Award className="w-5 h-5 text-cyan-400" />
                                            Strengths
                                        </h3>
                                        <div className="space-y-3">
                                            {results.data.strengths.map((strength, index) => (
                                                <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-cyan-500/20">
                                                    <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-200">{strength}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Weaknesses */}
                                    <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-amber-400" />
                                            Areas for Improvement
                                        </h3>
                                        <div className="space-y-3">
                                            {results.data.weaknesses.map((weakness, index) => (
                                                <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-amber-500/20">
                                                    <ChevronRight className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <span className="text-gray-200">{weakness}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Suggestions */}
                                    <div className="bg-indigo-500/10 backdrop-blur-sm rounded-2xl p-6 border border-indigo-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-indigo-400" />
                                            AI Suggestions
                                        </h3>
                                        <div className="space-y-4">
                                            {results.data.suggestions.map((suggestion, index) => (
                                                <div key={index} className="p-4 bg-white/5 rounded-xl border border-indigo-500/20 border-l-4 border-l-indigo-400">
                                                    <p className="text-gray-200 mb-3">{suggestion}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCopy(suggestion, `suggestion-${index}`)}
                                                            className="flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200 font-medium px-3 py-1 bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            {copiedIndex === `suggestion-${index}` ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                            {copiedIndex === `suggestion-${index}` ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                        <button
                                            onClick={() => handleDownload(
                                                `Profile Analysis Results\n\nScore: ${results.data.score}/100\n\nStrengths:\n${results.data.strengths.map(s => `• ${s}`).join('\n')}\n\nAreas for Improvement:\n${results.data.weaknesses.map(w => `• ${w}`).join('\n')}\n\nSuggestions:\n${results.data.suggestions.map(s => `• ${s}`).join('\n')}`,
                                                'linkedin-profile-analysis.txt'
                                            )}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:scale-105"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Report
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResults(null);
                                                setProfileForm({
                                                    linkedin_url: '',
                                                    name: '',
                                                    headline: '',
                                                    about: '',
                                                    experience: '',
                                                    skills: ''
                                                });
                                            }}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-2xl hover:from-cyan-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            New Analysis
                                        </button>
                                    </div>
                                </div>
                            )}

                            {results?.type === 'content' && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Generated Content</h2>
                                    </div>

                                    {/* Headlines */}
                                    <div className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <Briefcase className="w-5 h-5 text-purple-400" />
                                            LinkedIn Headlines
                                        </h3>
                                        <div className="space-y-4">
                                            {(results.data.headlines || []).map((headline, index) => (
                                                <div key={index} className="p-4 bg-white/5 rounded-xl border border-purple-500/20">
                                                    <p className="text-gray-200 font-medium mb-3">{headline}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCopy(headline, `headline-${index}`)}
                                                            className="flex items-center gap-2 text-xs text-purple-300 hover:text-purple-200 font-medium px-3 py-1 bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            {copiedIndex === `headline-${index}` ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                            {copiedIndex === `headline-${index}` ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* About Sections */}
                                    <div className="bg-cyan-500/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-cyan-400" />
                                            About Sections
                                        </h3>
                                        <div className="space-y-4">
                                            {(results.data.about_sections || []).map((about, index) => (
                                                <div key={index} className="p-4 bg-white/5 rounded-xl border border-cyan-500/20">
                                                    <div className="text-sm text-cyan-400 font-medium mb-2">Version {index + 1}</div>
                                                    <p className="text-gray-200 whitespace-pre-wrap mb-3">{about}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCopy(about, `about-${index}`)}
                                                            className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200 font-medium px-3 py-1 bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            {copiedIndex === `about-${index}` ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                            {copiedIndex === `about-${index}` ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Posts */}
                                    <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                                            LinkedIn Posts
                                        </h3>
                                        <div className="space-y-4">
                                            {(results.data.posts || []).map((post, index) => (
                                                <div key={index} className="p-4 bg-white/5 rounded-xl border border-emerald-500/20">
                                                    <div className="text-sm text-emerald-400 font-medium mb-2">Post {index + 1}</div>
                                                    <p className="text-gray-200 whitespace-pre-wrap mb-3">{post}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCopy(post, `post-${index}`)}
                                                            className="flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200 font-medium px-3 py-1 bg-white/10 rounded-lg transition-colors"
                                                        >
                                                            {copiedIndex === `post-${index}` ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                            {copiedIndex === `post-${index}` ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 pt-6">
                                        <button
                                            onClick={() => handleDownload(
                                                `LinkedIn Content Generated\n\nHeadlines:\n${results.data.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nAbout Sections:\n${results.data.about_sections.map((a, i) => `Version ${i + 1}:\n${a}`).join('\n\n')}\n\nPosts:\n${results.data.posts.map((p, i) => `Post ${i + 1}:\n${p}`).join('\n\n')}`,
                                                'linkedin-generated-content.txt'
                                            )}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 hover:scale-105"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download All Content
                                        </button>
                                        <button
                                            onClick={() => {
                                                setResults(null);
                                                setContentForm({
                                                    skills: '',
                                                    role: '',
                                                    career_goal: '',
                                                    tone: 'professional'
                                                });
                                            }}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Generate New Content
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
                    <p className="text-gray-300 text-center">
                        Made with ❤️ and ☕ | Powered by AI.
                    </p>
                </div>
            </footer>

            <Toast
                show={showToast}
                message={toastMessage}
                type={toastType}
                onClose={() => setShowToast(false)}
            />

            {/* Custom Styles */}
            <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default LinkwiseAI;