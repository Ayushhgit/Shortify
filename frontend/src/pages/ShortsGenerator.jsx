import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Settings,
  User,
  Video,
  Clock,
  Sparkles,
  Shield,
  Zap,
  PlayCircle,
  Bell,
  ArrowRight,
} from "lucide-react";

export default function ShortsComingSoon() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchActive, setGlitchActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const containerRef = useRef(null);

  // Generate random particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 25; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.4 + 0.1,
          duration: Math.random() * 8 + 4,
          delay: Math.random() * 3,
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
      setTimeout(() => setGlitchActive(false), 120);
    }, 6000 + Math.random() * 3000);

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(glitchInterval);
    };
  }, []);

  const handleNotifySubmit = () => {
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

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
      className="absolute rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
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
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black"
    >
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-violet-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <FloatingElement delay={0} duration={6} x={10} y={20} className="opacity-30">
        <div className="w-20 h-20 border-2 border-purple-400 rotate-45 animate-spin-slow rounded-lg backdrop-blur-sm" />
      </FloatingElement>
      <FloatingElement delay={2} duration={8} x={85} y={15} className="opacity-25">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
      </FloatingElement>
      <FloatingElement delay={1} duration={7} x={15} y={75} className="opacity-40">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rotate-12 animate-bounce rounded-md shadow-lg shadow-purple-500/50" />
      </FloatingElement>
      <FloatingElement delay={3} duration={5} x={80} y={70} className="opacity-30">
        <div className="w-14 h-14 border-2 border-cyan-400 rounded-full animate-ping" />
      </FloatingElement>

      {/* Enhanced mouse follower effect */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-20 blur-3xl transition-all duration-500 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(6,182,212,0.3) 35%, rgba(236,72,153,0.2) 70%, transparent 100%)',
          transform: `scale(${1 + Math.sin(Date.now() * 0.001) * 0.1})`,
        }}
      />

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-2xl bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center">
            <div className="relative">
              <Video className="h-8 w-8 text-purple-400 mr-3" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-white">
              Short<span className="text-purple-400">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {[
              { icon: Home, path: "/shortify" },
              { icon: User, path: "/profile" },
              { icon: Settings, path: "/settings" },
            ].map((item, index) => (
              <button
                key={index}
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
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-purple-500/30 rounded-full px-6 py-3 mb-8 animate-fade-in mt-5">
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
              filter: glitchActive ? 'hue-rotate(180deg) saturate(2) brightness(1.2)' : 'none',
              textShadow: glitchActive 
                ? '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(236, 72, 153, 0.4)' 
                : '0 0 40px rgba(139, 92, 246, 0.3)',
              transform: glitchActive ? 'translateZ(20px) rotateX(5deg)' : 'translateZ(0) rotateX(0deg)',
            }}
          >
            Short
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ify
            </span>
          </h1>
          
          {/* Enhanced glitch overlay */}
          {glitchActive && (
            <>
              <h1 
                className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-bold text-cyan-400 opacity-40 animate-pulse"
                style={{ 
                  transform: 'translate(2px, -2px)',
                  mixBlendMode: 'screen',
                  filter: 'blur(1px)'
                }}
              >
                Shortify
              </h1>
              <h1 
                className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-bold text-pink-400 opacity-30 animate-pulse"
                style={{ 
                  transform: 'translate(-1px, 1px)',
                  mixBlendMode: 'overlay'
                }}
              >
                Shortify
              </h1>
            </>
          )}
        </div>

        {/* Enhanced description */}
        <div className="mb-12 space-y-6 max-w-3xl animate-fade-in-delay">
          <h2 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text">
            The Future of Content is Almost Here
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            Experience the future of content with smart clip detection, instant highlights, and engagement-boosting edits powered by advanced AI
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-cyan-400 mx-auto rounded-full animate-fade-in-delay-2" />
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mb-12 animate-fade-in-delay">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-300 text-sm">Advanced AI analyzes your content to find the most engaging moments</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <PlayCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Shorts</h3>
            <p className="text-gray-300 text-sm">Generate multiple short clips from any YouTube video in seconds</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">HD Quality</h3>
            <p className="text-gray-300 text-sm">Professional quality output ready for all major platforms</p>
          </div>
        </div>

        

        {/* Enhanced decorative elements */}
        <div className="flex space-x-12 text-4xl animate-fade-in-delay-2">
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0s' }}>⚡</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.5s' }}>🚀</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1s' }}>⭐</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1.5s' }}>🎬</div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 h-16 flex items-center justify-center border-t border-gray-900 bg-gray-950/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-gray-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm"> © 2025 KwixLab. All Rights Reserved.</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

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
          0% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 0.1; transform: scale(1); }
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