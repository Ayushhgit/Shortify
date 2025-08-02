import React, { useState, useEffect, useRef } from 'react';
import {
  Link2, Home,
  Settings, User,
  Clock,
  Sparkles,
  Shield,
  Zap,
  Brain,
  Bell,
  Youtube,
  FileText,
  Download
} from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function YouTubeSummarizerComingSoon() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchActive, setGlitchActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);

  const navigate = useNavigate();

  // Generate random particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 30; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          duration: Math.random() * 8 + 5,
          delay: Math.random() * 4,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 7000 + Math.random() * 4000);

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(glitchInterval);
    };
  }, []);

  const FloatingElement = ({ delay, duration, x, y, children, className = "" }) => (
    <div 
      className={`absolute ${className}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );

  const Particle = ({ particle }) => (
    <div
      className="absolute rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        opacity: particle.opacity,
        animation: `twinkle ${particle.duration}s ease-in-out ${particle.delay}s infinite alternate`,
      }}
    />
  );

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800"
    >
      {/* Animated background - maintaining original YouTube summarizer style */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <FloatingElement delay={0} duration={6} x={12} y={25} className="opacity-30">
        <div className="w-20 h-20 border-2 border-purple-400 rotate-45 animate-spin-slow rounded-lg backdrop-blur-sm" />
      </FloatingElement>
      <FloatingElement delay={2} duration={8} x={85} y={20} className="opacity-25">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
      </FloatingElement>
      <FloatingElement delay={1} duration={7} x={15} y={70} className="opacity-40">
        <Youtube className="w-12 h-12 text-purple-400 animate-bounce" />
      </FloatingElement>
      <FloatingElement delay={3} duration={5} x={80} y={75} className="opacity-30">
        <div className="w-14 h-14 border-2 border-pink-400 rounded-full animate-ping" />
      </FloatingElement>

      {/* Enhanced mouse follower effect */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-20 blur-3xl transition-all duration-500 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(236,72,153,0.3) 35%, rgba(59,130,246,0.2) 70%, transparent 100%)',
          transform: `scale(${1 + Math.sin(Date.now() * 0.001) * 0.1})`,
        }}
      />

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Link2 className="h-8 w-8 text-purple-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Summ<span className="text-purple-400">lytic</span>
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
                onClick={() => navigate(item.href)}
                className="p-3 rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
              >
                <item.icon className="h-5 w-5 text-white/80 hover:text-white" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-4 pt-24">
        
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in mt-5">
          <Clock className="h-5 w-5 text-purple-400 animate-pulse" />
          <span className="text-lg font-medium text-purple-300">
            Coming Soon
          </span>
        </div>

        {/* Enhanced glitch effect container for title */}
        <div className="relative mb-8 perspective-1000">
          <h1 
            className={`text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white to-purple-400 text-transparent bg-clip-text tracking-tight select-none transition-all duration-200 mb-4 ${
              glitchActive ? 'animate-pulse' : ''
            }`}
            style={{
              filter: glitchActive ? 'hue-rotate(90deg) saturate(2) brightness(1.3)' : 'none',
              textShadow: glitchActive 
                ? '0 0 30px rgba(147, 51, 234, 0.8), 0 0 60px rgba(236, 72, 153, 0.4)' 
                : '0 0 40px rgba(147, 51, 234, 0.3)',
              transform: glitchActive ? 'translateZ(20px) rotateX(5deg)' : 'translateZ(0) rotateX(0deg)',
            }}
          >
            Summ
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              lytic
            </span>
          </h1>
          
          {/* Enhanced glitch overlay */}
          {glitchActive && (
            <>
              <h1 
                className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-bold text-pink-400 opacity-40 animate-pulse"
                style={{ 
                  transform: 'translate(2px, -2px)',
                  mixBlendMode: 'screen',
                  filter: 'blur(1px)'
                }}
              >
                Summlytic
              </h1>
              <h1 
                className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-bold text-purple-400 opacity-30 animate-pulse"
                style={{ 
                  transform: 'translate(-1px, 1px)',
                  mixBlendMode: 'overlay'
                }}
              >
                Summlytic
              </h1>
            </>
          )}
        </div>

        {/* Enhanced description */}
        <div className="mb-12 space-y-6 max-w-3xl animate-fade-in-delay">
          <h2 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text">
            Transform Videos Into Insights
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Get instant, AI-driven summaries from YouTube videos to save time and extract key information with advanced natural language processing
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto rounded-full animate-fade-in-delay-2" />
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-12 animate-fade-in-delay">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-300 text-sm">Advanced natural language processing extracts key insights and main points</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Summaries</h3>
            <p className="text-gray-300 text-sm">Get comprehensive summaries from any YouTube video in seconds</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Download className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Export & Share</h3>
            <p className="text-gray-300 text-sm">Copy, download, and share your summaries in multiple formats</p>
          </div>
        </div>

        {/* Enhanced decorative elements */}
        <div className="flex space-x-12 text-4xl animate-fade-in-delay-2">
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0s' }}>🎬</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.5s' }}>🧠</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1s' }}>⚡</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1.5s' }}>📝</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/20 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-300">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">© 2025 KwixLab. All Rights Reserved.</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </footer>

      {/* Enhanced CSS animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg) scale(1); }
          100% { transform: translateY(-30px) rotate(180deg) scale(1.1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-delay-2 {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(1); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1.2s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in-delay-2 1.2s ease-out 1.2s forwards;
          opacity: 0;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}