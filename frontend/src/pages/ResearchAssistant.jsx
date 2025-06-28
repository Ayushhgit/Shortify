import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Download,
  Search,
  BookOpen,
  Brain,
  Sparkles,
  Home,
  Settings,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { getToken } from '../firebase';

const ResearchAssistantChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your research assistant. Ask me about any topic and I'll provide you with comprehensive summaries from web sources and research papers.",
      timestamp: new Date(),
      sources: [],
      papers: [],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState("user_" + Math.random().toString(36).substr(2, 9));
  const [sessionId] = useState("session_" + Math.random().toString(36).substr(2, 9));
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const navigate = useNavigate();
  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async (e) => {
    const idToken = await getToken();
    if (!idToken) {
      console.error("User not authenticated");
      displayToast("Authentication failed. Please try logging in again.", "error");
      return;
    }
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("https://kwixlab.com/api/research/agent/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          query: inputValue,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant",
        content: data.summary,  // Use the summary from ResearchResponse
        timestamp: new Date(),
        sources: data.sources || [],
        papers: data.papers || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "There was an error fetching the response.",
        timestamp: new Date(),
        sources: [],
        papers: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      // Clear backend memory for this session
      await fetch(`https://kwixlab.com/api/research/clear-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
      });

      // Reset frontend messages
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm your research assistant. Ask me about any topic and I'll provide you with comprehensive summaries from web sources and research papers.",
          timestamp: new Date(),
          sources: [],
          papers: [],
        },
      ]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const exportChat = () => {
    const chatData = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      sources: msg.sources || [],
      papers: msg.papers || [],
    }));

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatMessageContent = (content) => {
    return content.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mb-2 mt-4 text-white">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mb-3 mt-4 text-white">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mb-4 mt-4 text-white">{line.slice(2)}</h1>;
      }

      // Bold text **text**
      if (line.match(/\*\*(.*?)\*\*/)) {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return (
          <p key={i} className="mb-2 text-gray-200 leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ?
                <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong> :
                part
            )}
          </p>
        );
      }

      // Numbered lists
      if (line.match(/^\d+\.\s/)) {
        return <li key={i} className="ml-6 mb-1 text-gray-200 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
      }

      // Bullet points
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 mb-1 text-gray-200 list-disc">{line.slice(2)}</li>;
      }

      // Regular paragraphs
      if (line.trim()) {
        return <p key={i} className="mb-2 text-gray-200 leading-relaxed">{line}</p>;
      }

      // Empty lines
      return <br key={i} />;
    });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === "user";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}
      >
        <div
          className={`flex max-w-4xl ${isUser ? "flex-row-reverse" : "flex-row"
            }`}
        >
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 ml-3"
              : "bg-gradient-to-r from-indigo-500 to-cyan-500 mr-3"
              } shadow-lg`}
          >
            {isUser ? (
              <User size={18} className="text-white" />
            ) : (
              <Bot size={18} className="text-white" />
            )}
          </div>

          <div
            className={`rounded-2xl px-6 py-4 backdrop-blur-xl shadow-lg border ${isUser
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400/30"
              : "bg-white/10 text-gray-100 border-white/20"
              }`}
          >
            <div className="prose prose-sm max-w-none">
              <div className="prose prose-sm max-w-none text-gray-200">
                {formatMessageContent(message.content)}
              </div>
            </div>

            {/*{!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center">
                  <ExternalLink size={14} className="mr-2" />
                  Web Sources
                </h4>
                <div className="space-y-3">
                  {message.sources.slice(0, 3).map((source, i) => (
                    <div
                      key={i}
                      className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 font-medium text-sm"
                      >
                        {source.title}
                      </a>
                      <p className="text-gray-300 mt-1 text-xs line-clamp-2">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}*/}

            {!isUser && message.papers && message.papers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="text-sm font-semibold text-violet-300 mb-3 flex items-center">
                  <FileText size={14} className="mr-2" />
                  Research Papers
                </h4>
                <div className="space-y-3">
                  {message.papers.slice(0, 3).map((paper, i) => (
                    <div
                      key={i}
                      className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-300 hover:text-violet-200 font-medium text-sm"
                      >
                        {paper.title}
                      </a>
                      <p className="text-gray-300 mt-1 text-xs">
                        {paper.authors
                          ? paper.authors.join(", ")
                          : "Unknown authors"}
                      </p>
                      {paper.published_date && (
                        <p className="text-gray-400 text-xs">
                          {paper.published_date}
                        </p>
                      )}
                      {paper.citations > 0 && (
                        <p className="text-gray-400 text-xs">
                          {paper.citations} citations
                        </p>
                      )}
                      <p className="text-gray-300 mt-1 text-xs line-clamp-3">
                        {paper.abstract}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-400 mt-3">
              {new Date(message.timestamp).toLocaleString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
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
              Research<span className="text-purple-400">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportChat}
              className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10 flex items-center space-x-2"
            >
              <Download size={16} className="text-white/80" />
              <span className="text-white/80 text-sm hidden sm:inline">
                Export
              </span>
            </button>
            <button
              onClick={clearChat}
              className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10 flex items-center space-x-2"
            >
              <Trash2 size={16} className="text-white/80" />
              <span className="text-white/80 text-sm hidden sm:inline">
                Clear
              </span>
            </button>

            <div className="flex items-center gap-2">
              {[
                { icon: Home, label: "Home", href: "/shortify" },
                { icon: User, label: "Profile", href: "/profile" },
                { icon: Settings, label: "Settings", href: "/settings" },
              ].map(({ icon: Icon, label, href }) => (
                <button
                  key={label}
                  aria-label={label}
                  title={label}
                  onClick={() => navigate(href)}
                  className="group p-3 rounded-xl hover:bg-gray-800/60 transition-all duration-300 hover:shadow-lg"
                >
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 pt-32 pb-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Research Assistant
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Your Personal
            <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Research Assistant
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
            Get comprehensive research summaries with citations from web sources
            and academic papers
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="relative z-10 px-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Messages */}
            <div className="h-[600px] overflow-y-auto px-6 py-6 space-y-4">
              {messages.length === 1 && (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl">
                      <Search className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Ready to Research
                  </h3>
                  <p className="text-gray-300 max-w-md mx-auto mb-6">
                    Ask me about any topic and I'll provide comprehensive
                    summaries from web sources and research papers.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-sm">
                    <span className="bg-white/10 text-purple-300 px-3 py-1 rounded-full">
                      machine learning
                    </span>
                    <span className="bg-white/10 text-cyan-300 px-3 py-1 rounded-full">
                      quantum computing
                    </span>
                    <span className="bg-white/10 text-indigo-300 px-3 py-1 rounded-full">
                      climate change
                    </span>
                    <span className="bg-white/10 text-violet-300 px-3 py-1 rounded-full">
                      CRISPR gene editing
                    </span>
                  </div>
                </div>
              )}

              {messages.map((message, index) => renderMessage(message, index))}

              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 mr-3 flex items-center justify-center shadow-lg">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20">
                      <div className="flex items-center space-x-3">
                        <Loader2
                          size={18}
                          className="animate-spin text-cyan-400"
                        />
                        <span className="text-gray-200 font-medium">
                          Researching your topic...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-xl">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <MessageCircle className="h-5 w-5 text-purple-400" />
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about any research topic... e.g., 'LSTM RNNs', 'quantum computing', 'climate change'"
                    className="block w-full pl-12 pr-4 py-4 border-2 border-white/30 rounded-2xl shadow-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/10 backdrop-blur-sm placeholder-gray-400 text-white text-lg font-medium hover:bg-white/20 transition-all duration-300"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        sendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="group relative px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-r from-purple-500 to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="flex items-center space-x-2">
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Researching...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span className="text-sm">Send</span>
                      </>
                    )}
                  </div>
                  {!isLoading && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  )}
                </button>
              </div>

              <div className="flex justify-center mt-4">
                <p className="text-xs text-gray-400">
                  Try asking about: "machine learning algorithms", "CRISPR gene
                  editing", "renewable energy storage"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <p className="text-gray-300 text-center">
            Made with ❤️ and ☕ for researchers everywhere.
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

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ResearchAssistantChat;
