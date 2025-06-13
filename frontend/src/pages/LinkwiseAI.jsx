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
    CheckCircle
} from 'lucide-react';

const LinkwiseAI = () => {
    const [activeTab, setActiveTab] = useState('analyzer');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);

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

    const handleProfileAnalysis = async (e) => {
        e.preventDefault();

        if (!validateProfileForm()) return;

        setLoading(true);
        setError('');

        try {
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

            const result = await makeAPICall('/analyze-profile', cleanPayload);
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

    const makeAPICall = async (endpoint, data) => {
        try {
            // DEBUG: Log the data being sent to API
            console.log('Making API call to:', `${API_BASE}${endpoint}`);
            console.log('With data:', JSON.stringify(data, null, 2));

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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

    const handleContentGeneration = async (e) => {
        e.preventDefault();

        if (!validateContentForm()) return;

        setLoading(true);
        setError('');

        try {
            const payload = {
                ...contentForm,
                skills: contentForm.skills.split(',').map(s => s.trim())
            };

            const result = await makeAPICall('/generate-content', payload);
            console.log('API Response:', result); // Add this line

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                Linkwise AI
                            </h1>
                            <p className="text-gray-600 mt-1">Optimize your LinkedIn presence with AI-powered insights</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Sparkles className="w-4 h-4" />
                            <span>Powered by Advanced AI</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm p-2 mb-8">
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
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-600 text-sm">{error}</div>
                        </div>
                    </div>
                )}

                {/* General Form Error */}
                {formErrors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-600 text-sm">{formErrors.general}</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        {activeTab === 'analyzer' && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Analyze Your Profile</h2>
                                </div>

                                <form onSubmit={handleProfileAnalysis} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            LinkedIn Profile URL
                                        </label>
                                        <input
                                            type="url"
                                            value={profileForm.linkedin_url}
                                            onChange={(e) => handleProfileInputChange('linkedin_url', e.target.value)}
                                            placeholder="https://linkedin.com/in/your-profile"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        {formErrors.linkedin_url && (
                                            <p className="text-red-600 text-xs mt-1">{formErrors.linkedin_url}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">OR fill in the details manually below</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.name}
                                                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                                                placeholder="Your full name"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                                            <input
                                                type="text"
                                                value={profileForm.headline}
                                                onChange={(e) => handleProfileInputChange('headline', e.target.value)}
                                                placeholder="Your current headline"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">About Section</label>
                                        <textarea
                                            rows={3}
                                            value={profileForm.about}
                                            onChange={(e) => handleProfileInputChange('about', e.target.value)}
                                            placeholder="Your current about section..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                                        <textarea
                                            rows={3}
                                            value={profileForm.experience}
                                            onChange={(e) => handleProfileInputChange('experience', e.target.value)}
                                            placeholder="Your work experience and achievements..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                                        <input
                                            type="text"
                                            value={profileForm.skills}
                                            onChange={(e) => handleProfileInputChange('skills', e.target.value)}
                                            placeholder="JavaScript, React, Node.js, etc. (comma-separated)"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Analyzing...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <Target className="w-4 h-4" />
                                                Analyze Profile
                                            </div>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'generator' && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Generate Content</h2>
                                </div>

                                <form onSubmit={handleContentGeneration} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                                        <input
                                            type="text"
                                            value={contentForm.skills}
                                            onChange={(e) => handleContentInputChange('skills', e.target.value)}
                                            placeholder="JavaScript, React, Leadership, etc. (comma-separated)"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        {formErrors.skills && (
                                            <p className="text-red-600 text-xs mt-1">{formErrors.skills}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                                            <input
                                                type="text"
                                                value={contentForm.role}
                                                onChange={(e) => handleContentInputChange('role', e.target.value)}
                                                placeholder="Software Engineer, Product Manager, etc."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                            {formErrors.role && (
                                                <p className="text-red-600 text-xs mt-1">{formErrors.role}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                                            <select
                                                value={contentForm.tone}
                                                onChange={(e) => handleContentInputChange('tone', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value="professional">Professional</option>
                                                <option value="friendly">Friendly</option>
                                                <option value="technical">Technical</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Career Goal</label>
                                        <textarea
                                            rows={3}
                                            value={contentForm.career_goal}
                                            onChange={(e) => handleContentInputChange('career_goal', e.target.value)}
                                            placeholder="Describe your career aspirations and goals..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        {formErrors.career_goal && (
                                            <p className="text-red-600 text-xs mt-1">{formErrors.career_goal}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Generating...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                <Sparkles className="w-4 h-4" />
                                                Generate Content
                                            </div>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Results Display */}
                    <div className="bg-white rounded-xl shadow-sm p-6" ref={resultRef}>
                        {!results && !loading && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    {activeTab === 'analyzer' ? (
                                        <Target className="w-8 h-8 text-gray-400" />
                                    ) : (
                                        <FileText className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {activeTab === 'analyzer' ? 'Ready to Analyze' : 'Ready to Generate'}
                                </h3>
                                <p className="text-gray-500">
                                    {activeTab === 'analyzer'
                                        ? 'Fill in your profile details to get AI-powered optimization suggestions'
                                        : 'Provide your information to generate compelling LinkedIn content'
                                    }
                                </p>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing...</h3>
                                <p className="text-gray-500">AI is analyzing your information</p>
                            </div>
                        )}

                        {results?.type === 'analysis' && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Profile Analysis Results</h2>
                                </div>

                                {/* Score Display */}
                                <div className="mb-8">
                                    <ScoreDisplay score={results.data.score} />
                                </div>

                                {/* Strengths */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-green-600" />
                                        Strengths
                                    </h3>
                                    <div className="space-y-2">
                                        {results.data.strengths.map((strength, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">{strength}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Weaknesses */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-orange-600" />
                                        Areas for Improvement
                                    </h3>
                                    <div className="space-y-2">
                                        {results.data.weaknesses.map((weakness, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                                                <ChevronRight className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-700">{weakness}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Suggestions */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-600" />
                                        AI Suggestions
                                    </h3>
                                    <div className="space-y-3">
                                        {results.data.suggestions.map((suggestion, index) => (
                                            <div key={index} className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                                                <p className="text-gray-700">{suggestion}</p>
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => handleCopy(suggestion, `suggestion-${index}`)}
                                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
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
                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => handleDownload(
                                            `Profile Analysis Results\n\nScore: ${results.data.score}/100\n\nStrengths:\n${results.data.strengths.map(s => `• ${s}`).join('\n')}\n\nAreas for Improvement:\n${results.data.weaknesses.map(w => `• ${w}`).join('\n')}\n\nSuggestions:\n${results.data.suggestions.map(s => `• ${s}`).join('\n')}`,
                                            'linkedin-profile-analysis.txt'
                                        )}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        New Analysis
                                    </button>
                                </div>
                            </div>
                        )}

                        {results?.type === 'content' && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Generated Content</h2>
                                </div>

                                {/* Headlines */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-purple-600" />
                                        LinkedIn Headlines
                                    </h3>
                                    <div className="space-y-3">
                                        {(results.data.headlines || []).map((headline, index) => (
                                            <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                <p className="text-gray-800 font-medium mb-3">{headline}</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopy(headline, `headline-${index}`)}
                                                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 bg-white rounded"
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
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        About Sections
                                    </h3>
                                    <div className="space-y-4">
                                        {(results.data.about_sections || []).map((about, index) => (
                                            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="text-sm text-blue-600 font-medium mb-2">Version {index + 1}</div>
                                                <p className="text-gray-800 whitespace-pre-wrap mb-3">{about}</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopy(about, `about-${index}`)}
                                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-white rounded"
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
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-green-600" />
                                        LinkedIn Posts
                                    </h3>
                                    <div className="space-y-4">
                                        {(results.data.posts || []).map((post, index) => (
                                            <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-sm text-green-600 font-medium mb-2">Post {index + 1}</div>
                                                <p className="text-gray-800 whitespace-pre-wrap mb-3">{post}</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCopy(post, `post-${index}`)}
                                                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 bg-white rounded"
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
                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={() => handleDownload(
                                            `LinkedIn Content Generated\n\nHeadlines:\n${results.data.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\nAbout Sections:\n${results.data.about_sections.map((a, i) => `Version ${i + 1}:\n${a}`).join('\n\n')}\n\nPosts:\n${results.data.posts.map((p, i) => `Post ${i + 1}:\n${p}`).join('\n\n')}`,
                                            'linkedin-generated-content.txt'
                                        )}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
    );
};

export default LinkwiseAI;