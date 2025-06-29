import React, { useState, useEffect, useRef } from 'react';

const NotFound = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchActive, setGlitchActive] = useState(false);
  const [particles, setParticles] = useState([]);
  const [userName, setUserName] = useState('Houston');
  const containerRef = useRef(null);

  // Firebase Auth check
  useEffect(() => {
    // Check if Firebase is available
    if (typeof window !== 'undefined' && window.firebase && window.firebase.auth) {
      const unsubscribe = window.firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // Use displayName first, then email name, then fallback to Houston
          const name = user.displayName || 
                      (user.email ? user.email.split('@')[0] : null) || 
                      'Houston';
          setUserName(name);
        } else {
          setUserName('Houston');
        }
      });

      return () => unsubscribe();
    } else {
      // Fallback if Firebase is not available
      setUserName('Houston');
    }
  }, []);

  // Generate random particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          duration: Math.random() * 10 + 5,
          delay: Math.random() * 5,
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
    }, 4000 + Math.random() * 2000);

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
      className="absolute rounded-full bg-white"
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
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0 bg-grid-pattern animate-pulse"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <Particle key={particle.id} particle={particle} />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <FloatingElement delay={0} duration={6} x={10} y={20} className="opacity-30">
        <div className="w-20 h-20 border-2 border-cyan-400 rotate-45 animate-spin-slow rounded-lg backdrop-blur-sm" />
      </FloatingElement>
      <FloatingElement delay={2} duration={8} x={85} y={15} className="opacity-25">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50" />
      </FloatingElement>
      <FloatingElement delay={1} duration={7} x={15} y={75} className="opacity-40">
        <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rotate-12 animate-bounce rounded-md" />
      </FloatingElement>
      <FloatingElement delay={3} duration={5} x={80} y={70} className="opacity-30">
        <div className="w-14 h-14 border-2 border-emerald-400 rounded-full animate-ping" />
      </FloatingElement>

      {/* Enhanced mouse follower effect */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 opacity-30 blur-3xl transition-all duration-500 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(168,85,247,0.3) 35%, rgba(236,72,153,0.2) 70%, transparent 100%)',
          transform: `scale(${1 + Math.sin(Date.now() * 0.001) * 0.1})`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-4">
        {/* Enhanced glitch effect container for 404 */}
        <div className="relative mb-8 perspective-1000">
          <h1 
            className={`text-8xl md:text-9xl lg:text-[12rem] font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent select-none transition-all duration-200 ${
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
            404
          </h1>
          
          {/* Enhanced glitch overlay */}
          {glitchActive && (
            <>
              <h1 
                className="absolute inset-0 text-8xl md:text-9xl lg:text-[12rem] font-black text-red-500 opacity-60 animate-pulse"
                style={{ 
                  transform: 'translate(3px, -3px)',
                  mixBlendMode: 'screen',
                  filter: 'blur(1px)'
                }}
              >
                404
              </h1>
              <h1 
                className="absolute inset-0 text-8xl md:text-9xl lg:text-[12rem] font-black text-cyan-400 opacity-40 animate-pulse"
                style={{ 
                  transform: 'translate(-2px, 2px)',
                  mixBlendMode: 'overlay'
                }}
              >
                404
              </h1>
            </>
          )}
        </div>

        {/* Enhanced error message with dynamic user name */}
        <div className="mb-12 space-y-6 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white animate-fade-in bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {userName}, we have a problem
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 animate-fade-in-delay leading-relaxed">
            The page you're looking for has drifted into the void of cyberspace
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full animate-fade-in-delay-2" />
        </div>

        {/* Enhanced interactive buttons */}
        <div className="flex flex-col sm:flex-row gap-6 items-center mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>Return to Base</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">🚀</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="group px-10 py-5 border-2 border-gray-400/50 text-gray-300 font-bold text-lg rounded-2xl transition-all duration-300 hover:border-cyan-400 hover:text-cyan-400 hover:shadow-lg hover:shadow-cyan-400/25 hover:bg-cyan-400/10 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
              <span>Go Back</span>
            </span>
          </button>
        </div>

        {/* Enhanced decorative elements */}
        <div className="flex space-x-12 text-4xl">
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0s' }}>⚡</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '0.5s' }}>🚀</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1s' }}>⭐</div>
          <div className="animate-bounce hover:scale-125 transition-transform cursor-pointer" style={{ animationDelay: '1.5s' }}>🌟</div>
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
          from { opacity: 0; transform: scaleX(0); }
          to { opacity: 1; transform: scaleX(1); }
        }
        
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
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
          animation: fade-in-delay-2 1s ease-out 1.2s forwards;
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
};

export default NotFound;