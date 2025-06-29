import React, { useState, useRef, useEffect } from 'react';
import { BotMessageSquare,Bot, X, Send, Smile, Paperclip, ArrowDownCircle } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messageContainerRef = useRef(null);
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_input: userMessage.text}),
      });

      const data = await response.json();

      const botMessage= {
        id: Date.now() +1,
        text: data.response,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.log('Error sending message:', err);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, something went wrong",
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messageContainerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.sender === 'bot') {
        setTimeout(() => {
          const messageElements = messageContainerRef.current.querySelectorAll('[data-message-id]');
          const lastElement = messageElements[messageElements.length - 1];
          if (lastElement) {
            lastElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  };

  const handleScroll = () => {
    const ref = messageContainerRef.current;
    if (ref) {
      const { scrollHeight, scrollTop, clientHeight } = ref;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="w-80 h-[420px] backdrop-blur-xl bg-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/20 flex flex-col overflow-hidden transition-all duration-500 ease-out">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-pink-400/5 to-cyan-400/10 animate-pulse" />
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600/80 via-pink-500/80 to-purple-600/80 backdrop-blur-sm text-white p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mr-3 backdrop-blur-sm border border-white/30">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                  KwixLab Assistant
                </h3>
                <span className="text-xs opacity-90 flex items-center">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 p-2 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message container */}
          <div
            ref={messageContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  data-message-id={msg.id}
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 text-white rounded-tr-lg border-white/20 shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                      : 'bg-white/80 text-gray-800 rounded-tl-lg border-white/30 shadow-[0_4px_16px_rgba(255,255,255,0.1)]'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <span className={`text-[10px] block text-right mt-2 ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-[80px] right-6 bg-black/60 backdrop-blur-sm text-white rounded-full p-2 shadow-lg border border-white/20 transition-all duration-300 hover:bg-black/80 hover:scale-110"
            >
              <ArrowDownCircle className="h-5 w-5" />
            </button>
          )}

          {/* Input area */}
          <div className="relative border-t border-white/10 p-4 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-2xl border border-white/30 pr-2 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 p-4 text-sm focus:outline-none bg-transparent placeholder-gray-500"
                placeholder="Type your message..."
              />
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleSendMessage}
                  disabled={inputValue.trim() === ''}
                  className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${
                    inputValue.trim() === ''
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-[0_4px_16px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-xs text-white/60 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                Powered by GroqCloud
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-modern floating button */}
      <button
        className={`
          group
          relative
          overflow-hidden
          ${isOpen 
            ? 'w-16 h-16 bg-gradient-to-r from-red-500 via-pink-500 to-red-600' 
            : 'w-16 h-16 bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500'
          }
          rounded-2xl
          shadow-[0_0_40px_rgba(0,0,0,0.3)]
          transition-all
          duration-700
          ease-out
          hover:scale-110
          hover:rotate-6
          hover:shadow-[0_0_60px_rgba(0,0,0,0.4)]
          before:absolute
          before:inset-0
          before:rounded-2xl
          before:bg-gradient-to-r
          ${isOpen
            ? 'before:from-red-400 before:via-pink-400 before:to-red-500'
            : 'before:from-emerald-300 before:via-cyan-400 before:to-blue-400'
          }
          before:opacity-0
          before:transition-opacity
          before:duration-700
          hover:before:opacity-100
          after:absolute
          after:inset-0.5
          after:rounded-xl
          ${isOpen
            ? 'after:bg-gradient-to-r after:from-red-500 after:via-pink-500 after:to-red-600'
            : 'after:bg-gradient-to-r after:from-emerald-400 after:via-cyan-500 after:to-blue-500'
          }
          after:transition-all
          after:duration-700
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className={`
            absolute w-32 h-32 rounded-full blur-xl opacity-30
            ${isOpen ? 'bg-red-300' : 'bg-cyan-300'}
            animate-pulse
            -top-16 -left-16
          `} />
          <div className={`
            absolute w-24 h-24 rounded-full blur-lg opacity-20
            ${isOpen ? 'bg-pink-300' : 'bg-emerald-300'}
            animate-pulse
            -bottom-12 -right-12
          `} />
        </div>

        {/* Glass morphism overlay */}
        <div className="
          absolute inset-0
          bg-white/10
          backdrop-blur-sm
          rounded-2xl
          border
          border-white/20
          transition-all
          duration-700
          group-hover:bg-white/20
          group-hover:border-white/30
        " />

        {/* Icon container */}
        <div className="
          relative z-10
          flex items-center justify-center
          w-full h-full
          text-white
          transition-all
          duration-500
          group-hover:scale-110
        ">
          <div className={`
            transform transition-all duration-500 ease-out
            ${isOpen ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}
          `}>
            {isOpen ? (
              <X className="w-7 h-7 drop-shadow-lg" />
            ) : (
              <BotMessageSquare className="w-7 h-7 drop-shadow-lg" />
            )}
          </div>
        </div>

        {/* Ripple effect */}
        <div className={`
          absolute inset-0
          rounded-2xl
          ${isOpen
            ? 'bg-gradient-to-r from-red-400/0 via-pink-400/30 to-red-400/0'
            : 'bg-gradient-to-r from-emerald-400/0 via-cyan-400/30 to-blue-400/0'
          }
          opacity-0
          group-active:opacity-100
          group-active:animate-ping
          transition-opacity
          duration-300
        `} />

        {/* Glow effect */}
        <div className={`
          absolute -inset-2
          rounded-3xl
          ${isOpen
            ? 'bg-gradient-to-r from-red-500/20 via-pink-500/30 to-red-500/20'
            : 'bg-gradient-to-r from-emerald-500/20 via-cyan-500/30 to-blue-500/20'
          }
          blur-lg
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-700
          -z-10
        `} />
      </button>
    </div>
  );
}