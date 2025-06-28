import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Home,
  Settings,
  User,
  BookOpen,
  Loader2,
  Check,
  X,
  Sparkles,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
} from "lucide-react";
import { getToken } from '../firebase';
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

// Toast Component

// Chat Component
const ChatWithDocument = ({ documentContent, isVisible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const idToken = await getToken();
      if (!idToken) {
        console.error("User not authenticated");
        displayToast("Authentication failed. Please try logging in again.", "error");
        return;
      }

      const response = await fetch("https://kwixlab.com/api/article/chat-simple", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          article_content: documentContent
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { type: "ai", content: data.response || "Sorry, I couldn't process that." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { type: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Chat with Article</h3>
              <p className="text-sm text-gray-400">Ask questions about your Article</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation about your Article!</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${message.type === "user"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 border border-gray-700"
                }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your document..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function ArticleSummarizer() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [articleUrl, setArticleUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState("");
  const [articleDetails, setArticleDetails] = useState(null);
  const [inputError, setInputError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [articleContent, setArticleContent] = useState("");
  const navigate = useNavigate();

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleUrlChange = (event) => {
    setArticleUrl(event.target.value);
    setInputError("");
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleClear = () => {
    setArticleUrl("");
    setSummary("");
    setArticleDetails(null);
    setInputError("");
    setArticleContent("");
  };

  const handleSubmit = async (event) => {
    const idToken = await getToken();
    if (!idToken) {
      console.error("User not authenticated");
      displayToast("Authentication failed. Please try logging in again.", "error");
      return;
    }
    event.preventDefault();

    if (!articleUrl.trim()) {
      setInputError("Please enter an article URL");
      return;
    }

    if (!isValidUrl(articleUrl)) {
      setInputError("Please enter a valid URL");
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(
        "https://kwixlab.com/api/article/summarize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            url: articleUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        console.error("Server error:", errorData);
        displayToast(`Error: ${errorData.detail || response.status}`, "error");
        setIsProcessing(false);
        return;
      }

      const data = await response.json();

      if (data && data.articleDetails) {
        setArticleDetails({
          title: data.articleDetails.title,
          author: data.articleDetails.author,
          publishDate: data.articleDetails.publishDate,
          domain: data.articleDetails.domain,
          readTime: data.articleDetails.readTime,
        });
      }

      setSummary(data.summary);
      // Store the article content for chat (you might need to modify your API to return this)
      setArticleContent(data.content || data.summary);
      displayToast("Article summarized successfully!");
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      console.error("Network/Parse error:", error);
      displayToast("Network error. Please try again.", "error");
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      displayToast("Summary copied to clipboard!");
    } catch (error) {
      displayToast("Failed to copy summary", "error");
    }
  };

  const handleDownloadSummary = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${articleDetails?.title?.replace(/[^a-z0-9]/gi, "_") || "article"
      }_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    displayToast("Summary downloaded successfully!");
  };

  const handleChatOpen = () => {
    if (!articleContent) {
      displayToast("Please summarize an article first", "error");
      return;
    }
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <FileText className="h-8 w-8 text-indigo-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Article<span className="text-indigo-400">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[{ icon: Home, path: "/" }, { icon: User, path: "/profile" }, { icon: Settings, path: "/settings" }].map(
              (item, index) => (
                <button
                  key={index}
                  className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Article Summarization
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              Turn Articles
              <span className="block bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Into Insights
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get instant, AI-driven summaries from any web article to save time
              and extract key information
            </p>
          </div>

          {/* Article URL Input */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={articleUrl}
                  onChange={handleUrlChange}
                  placeholder="Paste article URL here..."
                  className={`block w-full pl-14 pr-12 py-4 border-2 ${inputError ? "border-red-400/50" : "border-white/30"
                    } rounded-2xl shadow-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 text-lg font-medium hover:bg-white/20 transition-all duration-300`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit(e);
                    }
                  }}
                />
                {articleUrl && (
                  <button
                    type="button"
                    onClick={() => setArticleUrl("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 hover:scale-110 transition-transform"
                  >
                    <X className="h-6 w-6 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>

              {inputError && (
                <p className="text-red-400 text-center font-medium">
                  {inputError}
                </p>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className={`group relative px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isProcessing
                    ? "bg-gray-600/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-cyan-500"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-lg">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg">Summarize Article</span>
                      </>
                    )}
                  </div>
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  )}
                </button>

                {articleUrl && !isProcessing && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-8 py-4 border-2 border-white/30 rounded-2xl text-white font-bold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Article Summary Section */}
          {articleDetails && summary && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-6">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white line-clamp-2 mb-3">
                        {articleDetails.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 mb-4">
                        {articleDetails.author && (
                          <span className="bg-white/15 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                            By {articleDetails.author}
                          </span>
                        )}
                        {articleDetails.domain && (
                          <span className="bg-white/15 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                            {articleDetails.domain}
                          </span>
                        )}
                        {articleDetails.readTime && (
                          <span className="bg-white/15 text-violet-300 px-3 py-1 rounded-full text-sm font-medium">
                            {articleDetails.readTime} min read
                          </span>
                        )}
                        {articleDetails.publishDate && (
                          <span className="bg-white/15 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                            {articleDetails.publishDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 p-3 bg-white/15 hover:bg-white/25 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <ExternalLink className="h-5 w-5 text-white" />
                    </a>
                  </div>

                  <div className="border-t border-white/20 pt-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        AI Summary
                      </h2>
                    </div>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-line text-gray-200 leading-relaxed text-lg">
                        {summary}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/20 flex justify-between items-center">
                  <button
                    onClick={handleChatOpen}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-medium hover:scale-105"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with Article
                  </button>

                  <div className="flex space-x-4">
                    <button
                      className="flex items-center px-6 py-3 text-white border-2 border-white/30 hover:bg-white/20 rounded-xl transition-all duration-300 font-medium backdrop-blur-sm"
                      onClick={handleCopySummary}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Summary
                    </button>
                    <button
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 font-medium hover:scale-105"
                      onClick={handleDownloadSummary}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download as Text
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How It Works Section */}
          {!summary && (
            <div className="max-w-5xl mx-auto mt-20">
              <h2 className="text-3xl font-bold text-center mb-12 text-white">
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: FileText,
                    title: "Paste Link",
                    desc: "Simply paste any article URL from news sites, blogs, or publications",
                    color: "from-indigo-500 to-indigo-600",
                  },
                  {
                    icon: Loader2,
                    title: "AI Processing",
                    desc: "Our AI extracts and analyzes the article content to identify key points",
                    color: "from-cyan-500 to-cyan-600",
                  },
                  {
                    icon: Check,
                    title: "Get Summary",
                    desc: "Receive a concise summary with all the essential information and insights",
                    color: "from-violet-500 to-violet-600",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20 text-center hover:scale-105 transition-all duration-300 hover:bg-white/20"
                  >
                    <div
                      className={`bg-gradient-to-r ${item.color} rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6`}
                    >
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Chat Component */}
      <ChatWithDocument
        documentContent={articleContent}
        isVisible={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <p className="text-gray-300 text-center">Made with ❤️ and ☕.</p>
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
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}