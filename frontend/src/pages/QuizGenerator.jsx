import React, { useState, useEffect } from 'react';
import { ChevronDown, Brain, FileText, Calculator, CheckCircle, AlertCircle, Loader2, Home, User, Settings, Sparkles, Database } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from '../firebase';

const QuizGenerator = () => {
  const [formData, setFormData] = useState({
    numQuestions: 5,
    difficulty: 'medium',
    topic: '',
    questionTypes: {
      mcq: true,
      qna: false,
      numerical: false
    }
  });

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [animateResult, setAnimateResult] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const navigate = useNavigate();
  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const generateQuiz = async () => {
    const idToken = await getToken();
    if (!idToken) {
      console.error("User not authenticated");
      displayToast("Authentication failed. Please try logging in again.", "error");
      return;
    }
    if (!formData.topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    const selectedTypes = Object.entries(formData.questionTypes)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type);

    if (selectedTypes.length === 0) {
      setError('Please select a question type');
      return;
    }

    setLoading(true);
    setError('');
    setStep(2);

    try {
      const response = await fetch('http://localhost:8000/quiz/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          num_questions: formData.numQuestions,
          difficulty: formData.difficulty,
          topic: formData.topic,
          question_types: selectedTypes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format from server');
      }

      setQuiz(data);
      setStep(3);
      setAnimateResult(true);

    } catch (err) {
      let errorMessage = 'Error generating quiz. Please try again.';

      // Handle different types of errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check if the API is running.';
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Server error: ${err.message}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Error generating quiz:', err);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (type) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: {
        mcq: type === 'mcq',
        qna: type === 'qna',
        numerical: type === 'numerical'
      }
    }));
  };

  const QuestionCard = ({ question, index }) => {
    const getIcon = () => {
      switch (question.type) {
        case 'mcq': return <CheckCircle className="w-6 h-6 text-emerald-400" />;
        case 'qna': return <FileText className="w-6 h-6 text-orange-400" />;
        case 'numerical': return <Calculator className="w-6 h-6 text-rose-400" />;
        default: return <Brain className="w-6 h-6 text-gray-400" />;
      }
    };

    const getTypeColor = () => {
      switch (question.type) {
        case 'mcq': return 'border-emerald-400/30 bg-emerald-500/10';
        case 'qna': return 'border-orange-400/30 bg-orange-500/10';
        case 'numerical': return 'border-rose-400/30 bg-rose-500/10';
        default: return 'border-gray-400/30 bg-gray-500/10';
      }
    };

    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-3xl p-8 border ${getTypeColor()} transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-xl">
              {getIcon()}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-300 uppercase tracking-wide block">
                {question.type === 'mcq' ? 'Multiple Choice' :
                  question.type === 'qna' ? 'Q&A' : 'Numerical'}
              </span>
              <span className="text-xs text-gray-400">Question {index + 1}</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">
          {question.question}
        </h3>

        {question.type === 'mcq' && question.options && (
          <div className="space-y-3 mb-6">
            {question.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-200">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-400/50 flex items-center justify-center text-sm font-bold text-emerald-400">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-gray-300 text-lg">{option}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold text-emerald-300">Answer:</span>
          </div>
          <p className="text-emerald-200 text-lg mb-4">{question.answer}</p>
          {question.explanation && (
            <div className="pt-4 border-t border-emerald-400/30">
              <span className="text-lg font-semibold text-emerald-300 block mb-2">Explanation:</span>
              <p className="text-emerald-200 leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Brain className="h-8 w-8 text-indigo-400 mr-3 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Quiz<span className="text-indigo-400">Master</span>
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6 animate-pulse">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Quiz Generation
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Generate Smart
              <span className="block bg-gradient-to-r from-indigo-400 via-emerald-400 to-orange-400 bg-clip-text text-transparent">
                Quiz Questions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create custom quizzes with AI-powered questions tailored to your topic and difficulty level
            </p>
          </div>

          {step === 1 && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-8 hover:bg-white/15 transition-all duration-300">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <div className="p-3 bg-indigo-500/20 rounded-xl mr-4">
                    <Brain className="w-8 h-8 text-indigo-400" />
                  </div>
                  Quiz Configuration
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-lg font-semibold text-gray-300 mb-4">
                      Number of Questions
                    </label>
                    <div className="relative">
                      <select
                        name="numQuestions"
                        value={formData.numQuestions}
                        onChange={handleInputChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none backdrop-blur-sm text-lg hover:bg-white/15 transition-all duration-200"
                      >
                        <option value={1} style={{ backgroundColor: '#1e293b', color: 'white' }}>1 Question</option>
                        <option value={2} style={{ backgroundColor: '#1e293b', color: 'white' }}>2 Questions</option>
                        <option value={3} style={{ backgroundColor: '#1e293b', color: 'white' }}>3 Questions</option>
                        <option value={4} style={{ backgroundColor: '#1e293b', color: 'white' }}>4 Questions</option>
                        <option value={5} style={{ backgroundColor: '#1e293b', color: 'white' }}>5 Questions</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-300 mb-4">
                      Difficulty Level
                    </label>
                    <div className="relative">
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none backdrop-blur-sm text-lg hover:bg-white/15 transition-all duration-200"
                      >
                        <option value="easy" style={{ backgroundColor: '#1e293b', color: 'white' }}>Easy</option>
                        <option value="medium" style={{ backgroundColor: '#1e293b', color: 'white' }}>Medium</option>
                        <option value="hard" style={{ backgroundColor: '#1e293b', color: 'white' }}>Hard</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="block text-lg font-semibold text-gray-300 mb-4">
                    Topic or Context
                  </label>
                  <textarea
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="Enter the topic you want to generate questions about (e.g., 'JavaScript fundamentals', 'World War II', 'Calculus derivatives')"
                    rows="4"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 backdrop-blur-sm text-lg resize-none hover:bg-white/15 transition-all duration-200"
                  />
                </div>

                <div className="mt-8">
                  <label className="block text-lg font-semibold text-gray-300 mb-6">
                    Question Types
                  </label>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div
                      className={`p-6 border-2 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${formData.questionTypes.mcq
                        ? 'border-emerald-400/70 bg-emerald-500/30'
                        : 'border-white/20 bg-white/10 hover:border-emerald-400/30'
                        }`}
                      onClick={() => handleCheckboxChange('mcq')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                          <CheckCircle className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-white block">
                            Multiple Choice
                          </span>
                          <span className="text-sm text-gray-400">
                            Questions with options
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-6 border-2 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${formData.questionTypes.qna
                        ? 'border-orange-400/70 bg-orange-500/30'
                        : 'border-white/20 bg-white/10 hover:border-orange-400/30'
                        }`}
                      onClick={() => handleCheckboxChange('qna')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-orange-500/20 rounded-xl">
                          <FileText className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-white block">
                            Q&A
                          </span>
                          <span className="text-sm text-gray-400">
                            Open-ended questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-6 border-2 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${formData.questionTypes.numerical
                        ? 'border-rose-400/70 bg-rose-500/30'
                        : 'border-white/20 bg-white/10 hover:border-rose-400/30'
                        }`}
                      onClick={() => handleCheckboxChange('numerical')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-rose-500/20 rounded-xl">
                          <Calculator className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                          <span className="text-lg font-semibold text-white block">
                            Numerical
                          </span>
                          <span className="text-sm text-gray-400">
                            Math & calculations
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 flex items-center space-x-3 text-red-300 bg-red-500/20 p-4 rounded-2xl border border-red-400/30 animate-pulse">
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-lg">{error}</span>
                  </div>
                )}

                <button
                  onClick={generateQuiz}
                  disabled={loading}
                  className="w-full mt-8 bg-gradient-to-r from-indigo-500 via-emerald-500 to-orange-500 hover:from-indigo-600 hover:via-emerald-600 hover:to-orange-600 disabled:from-indigo-400 disabled:via-emerald-400 disabled:to-orange-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-lg"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <Brain className="w-6 h-6" />
                    <span>Generate Quiz</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 2 && loading && (
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-6">
                <div className="relative">
                  <Brain className="w-20 h-20 text-indigo-400 mx-auto animate-pulse" />
                  <div className="absolute inset-0 w-20 h-20 mx-auto animate-spin">
                    <div className="w-full h-full border-4 border-transparent border-t-indigo-400 rounded-full"></div>
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white">
                  Generating Your Quiz
                </h2>
                <p className="text-gray-300 text-xl">
                  Our AI is crafting personalized questions for your topic...
                </p>
              </div>

              {/* Loading Progress */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="space-y-4">
                    {[
                      "Analyzing your topic...",
                      "Generating question content...",
                      "Creating answer explanations...",
                      "Finalizing quiz structure...",
                    ].map((text, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full transition-all duration-500 ${index < 2
                            ? "bg-indigo-400"
                            : index === 2
                              ? "bg-indigo-400 animate-pulse"
                              : "bg-gray-600"
                            }`}
                        ></div>
                        <span className="text-gray-300">{text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6 w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && quiz && (
            <div
              className={`space-y-8 transition-all duration-1000 ${animateResult
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-10"
                }`}
            >
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-bold text-white">
                  Quiz Generated Successfully
                </h2>
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-lg animate-pulse">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {quiz.questions?.length || 0} questions • {formData.difficulty} difficulty
                </div>
              </div>

              <div className="space-y-8">
                {quiz.questions?.map((question, index) => (
                  <QuestionCard key={index} question={question} index={index} />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setQuiz(null);
                    setError('');
                    setAnimateResult(false);
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-emerald-500 to-orange-500 text-white rounded-xl font-semibold hover:scale-105 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5" />
                    <span>Generate Another Quiz</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <p className="text-gray-300 text-center">
            Made with ❤️ and 🧠 for better learning.
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
};

export default QuizGenerator;