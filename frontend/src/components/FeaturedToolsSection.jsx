import React from 'react';
import {
  FileText,
  Video,
  Youtube,
  BarChart3,
  Target,
  Search,
  BookText,
  FileImage,
  Settings,
  Edit
} from "lucide-react";

const FeaturedToolsSection = () => {
  const topRowTools = [
    { 
      icon: FileText, 
      name: 'Resume Analyzer', 
      bgColor: 'bg-blue-500',
      iconBg: 'bg-blue-500'
    },
    { 
      icon: Video, 
      name: 'YouTube Clipper', 
      bgColor: 'bg-purple-500',
      iconBg: 'bg-purple-500'
    },
    { 
      icon: Youtube, 
      name: 'Youtube Summarizer', 
      bgColor: 'bg-green-500',
      iconBg: 'bg-green-500'
    },
    { 
      icon: BarChart3, 
      name: 'Auto EDA Tool', 
      bgColor: 'bg-orange-500',
      iconBg: 'bg-orange-500'
    },
    { 
      icon: Target, 
      name: 'Assignment Helper', 
      bgColor: 'bg-red-500',
      iconBg: 'bg-red-500'
    },
  ];

  const bottomRowTools = [
    { 
      icon: Search, 
      name: 'Research Assistant', 
      bgColor: 'bg-blue-500',
      iconBg: 'bg-blue-500'
    },
    { 
      icon: BookText, 
      name: 'Document Summarizer', 
      bgColor: 'bg-purple-500',
      iconBg: 'bg-purple-500'
    },
    { 
      icon: FileImage, 
      name: 'Article Summarizer', 
      bgColor: 'bg-green-500',
      iconBg: 'bg-green-500'
    },
    { 
      icon: Settings, 
      name: 'LinkedIn Builder', 
      bgColor: 'bg-indigo-500',
      iconBg: 'bg-indigo-500'
    },
    { 
      icon: Edit, 
      name: 'Cover Letter Generator', 
      bgColor: 'bg-teal-500',
      iconBg: 'bg-teal-500'
    }
  ];

  const ToolCard = ({ icon: Icon, name, bgColor, iconBg }) => (
    <div className={`flex-shrink-0 ${bgColor} backdrop-blur-md backdrop-saturate-150 rounded-2xl p-6 mx-3 min-w-[240px] border border-white/20 hover:border-white/40 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 cursor-pointer group glass-effect`}>
      <div className="flex items-center gap-4">
        <div className={`${iconBg} backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/10`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-white text-base leading-tight">{name}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-16 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 "></div>
      
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">Featured Tools</h2>
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Top Row - Moving Right to Left */}
        <div className="mb-6 overflow-hidden">
          <div className="flex animate-scroll-left whitespace-nowrap">
            {[...topRowTools, ...topRowTools, ...topRowTools].map((tool, index) => (
              <ToolCard
                key={`top-${index}`}
                icon={tool.icon}
                name={tool.name}
                bgColor={tool.bgColor}
                iconBg={tool.iconBg}
              />
            ))}
          </div>
        </div>

        {/* Bottom Row - Moving Left to Right */}
        <div className="overflow-hidden">
          <div className="flex animate-scroll-right whitespace-nowrap">
            {[...bottomRowTools, ...bottomRowTools, ...bottomRowTools].map((tool, index) => (
              <ToolCard
                key={`bottom-${index}`}
                icon={tool.icon}
                name={tool.name}
                bgColor={tool.bgColor}
                iconBg={tool.iconBg}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 5s linear infinite;
        }

        .animate-scroll-right {
          animation: scroll-right 5s linear infinite;
        }

        

        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .glass-effect:hover {
          background: rgba(255, 255, 255, 0.35);
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.45);
        }
      `}</style>
    </section>
  );
};

export default FeaturedToolsSection;