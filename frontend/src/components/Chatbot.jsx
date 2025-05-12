import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Smile, Paperclip, ArrowDownCircle } from 'lucide-react';

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
      const response = await fetch('http://localhost:8000/chat', {
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

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messageContainerRef.current && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Only auto-scroll for bot messages
      if (lastMessage.sender === 'bot') {
        // Give DOM time to render the message
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
        <div className="w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-400 text-white p-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Shortify Assistant</h3>
                <span className="text-xs opacity-80 flex items-center">
                  <span className="w-2 h-2 bg-green-200 rounded-full mr-1 animate-pulse"></span>
                  Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Message container */}
          <div
            ref={messageContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  data-message-id={msg.id}
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-green-500 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-[10px] block text-right mt-1 opacity-70">
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
              className="absolute bottom-[60px] right-4 bg-gray-800 text-white rounded-full p-1 shadow-lg opacity-70 hover:opacity-100"
            >
              <ArrowDownCircle className="h-5 w-5" />
            </button>
          )}

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-center bg-white rounded-full border border-gray-300 pr-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 p-3 text-sm focus:outline-none"
                placeholder="Type a message..."
              />
              <div className="flex items-center space-x-1">
                <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100">
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={inputValue.trim() === ''}
                  className={`p-2 rounded-full ${
                    inputValue.trim() === ''
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-white bg-green-500 hover:bg-green-400'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-gray-500">Powered by GroqCloud</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className={`${
          isOpen ? 'bg-gray-600' : 'bg-green-500 hover:bg-green-400'
        } text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-105 relative`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
          </>
        )}
      </button>
    </div>
  );
}