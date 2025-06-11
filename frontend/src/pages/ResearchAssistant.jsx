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
} from "lucide-react";

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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
  e.preventDefault();
  if (!inputValue.trim() || isLoading) return;

  const userMessage = {
    role: 'user',
    content: inputValue,
    timestamp: new Date()
  };

  setMessages(prev => [...prev, userMessage]);
  setInputValue('');
  setIsLoading(true);

  try {
    const response = await fetch('http://localhost:8000/api/agent/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: inputValue  // ✅ Correct key as per Swagger
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();

    const assistantMessage = {
      role: 'assistant',
      content: data.result || 'No response content.',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = {
      role: 'assistant',
      content: "There was an error fetching the response.",
      timestamp: new Date(),
      sources: [],
      papers: []
    };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};


  const clearChat = async () => {
    try {
      await fetch(`/api/chat/history/${userId}`, { method: "DELETE" });
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm your research assistant. Ask me about any topic and I'll provide you with comprehensive summaries from web sources and research papers.",
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

  const renderMessage = (message, index) => {
    const isUser = message.role === "user";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex max-w-4xl ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? "bg-blue-600 ml-3" : "bg-gray-600 mr-3"
            }`}
          >
            {isUser ? (
              <User size={16} className="text-white" />
            ) : (
              <Bot size={16} className="text-white" />
            )}
          </div>

          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900 border border-gray-200"
            }`}
          >
            <div className="prose prose-sm max-w-none">
              {message.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <h1
                      key={i}
                      className="text-xl font-bold mb-2 text-gray-900"
                    >
                      {line.slice(2)}
                    </h1>
                  );
                } else if (line.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-lg font-semibold mb-2 mt-4 text-gray-800"
                    >
                      {line.slice(3)}
                    </h2>
                  );
                } else if (line.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-md font-semibold mb-1 mt-3 text-gray-700"
                    >
                      {line.slice(4)}
                    </h3>
                  );
                } else if (line.startsWith("**") && line.endsWith("**")) {
                  return (
                    <p key={i} className="font-semibold mb-1">
                      {line.slice(2, -2)}
                    </p>
                  );
                } else if (line.startsWith("- ")) {
                  return (
                    <li key={i} className="ml-4 mb-1">
                      {line.slice(2)}
                    </li>
                  );
                } else if (line.trim()) {
                  return (
                    <p key={i} className="mb-2">
                      {line}
                    </p>
                  );
                }
                return <br key={i} />;
              })}
            </div>

            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <ExternalLink size={14} className="mr-1" />
                  Web Sources
                </h4>
                <div className="space-y-2">
                  {message.sources.slice(0, 3).map((source, i) => (
                    <div
                      key={i}
                      className="bg-white p-2 rounded border text-xs"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {source.title}
                      </a>
                      <p className="text-gray-600 mt-1 line-clamp-2">
                        {source.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isUser && message.papers && message.papers.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FileText size={14} className="mr-1" />
                  Research Papers
                </h4>
                <div className="space-y-2">
                  {message.papers.slice(0, 3).map((paper, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded border text-xs"
                    >
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {paper.title}
                      </a>
                      <p className="text-gray-600 mt-1">
                        {paper.authors
                          ? paper.authors.join(", ")
                          : "Unknown authors"}
                      </p>
                      {paper.published_date && (
                        <p className="text-gray-500 text-xs">
                          {paper.published_date}
                        </p>
                      )}
                      {paper.citations > 0 && (
                        <p className="text-gray-500 text-xs">
                          {paper.citations} citations
                        </p>
                      )}
                      <p className="text-gray-600 mt-1 line-clamp-3">
                        {paper.abstract}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Research Assistant
            </h1>
            <p className="text-sm text-gray-600">
              Get comprehensive research summaries with citations
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={exportChat}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-1"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={clearChat}
              className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center space-x-1"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {messages.map((message, index) => renderMessage(message, index))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 mr-3 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-gray-600" />
                    <span className="text-gray-600">
                      Researching your topic...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about any research topic... e.g., 'LSTM RNNs', 'quantum computing', 'climate change'"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  sendMessage(e);
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{isLoading ? "Researching..." : "Send"}</span>
            </button>
          </div>

          <div className="flex justify-center mt-2">
            <p className="text-xs text-gray-500">
              Try: "machine learning algorithms", "CRISPR gene editing",
              "renewable energy storage"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchAssistantChat;
