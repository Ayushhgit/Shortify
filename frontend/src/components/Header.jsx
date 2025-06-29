import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Menu, X, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null); // for desktop
  const [hideTimeout, setHideTimeout] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // for mobile
  const [expandedMobileSection, setExpandedMobileSection] = useState(null);
  const navigate = useNavigate();

  const navItems = [
    {
      name: "Features",
      dropdown: [
        {
          category: "VIDEO TOOLS",
          items: [
            { label: "YouTube Clipper", path: "/features/shorts-generator" },
            { label: "YT-Video Summarizer", path: "/features/summarizer" },
            { label: "MineCraft Clip Maker", path: "/features/clip-generator" },
          ],
        },
        {
          category: "DOCUMENT TOOLS",
          items: [
            { label: "PDF Summarizer", path: "/features/pdf-summarizer" },
            {
              label: "Article Summarizer",
              path: "/features/article-summarizer",
            },
            { label: "Resume Analyzer", path: "/features/resume-analyzer" },
            {
              label: "Cover Letter Generator",
              path: "/features/cover-letter-generator",
            },
            {
              label: "InterviewPrep Assitant",
              path: "/features/interview-prep-assistant",
            },
          ],
        },
        {
          category: "PRODUCTIVITY TOOLS",
          items: [
            { label: "Notes Generator", path: "/features/notes-generator" },
            { label: "Research Assistant", path: "/features/research-assistant"},
            { label: "Data Analyzer", path: "/features/eda" },
            { label: "Quiz Generator", path: "/features/quiz-generator" },
            { label: "LinkedIn Helper", path: "/features/linkwise-ai" },
          ],
        },
      ],
    },
    {
      name: "Use Cases",
      dropdown: [
        { label: "Content Creators", path: "/use-cases/creators" },
        { label: "Educators", path: "/use-cases/educators" },
        { label: "Corporate Teams", path: "/use-cases/corporate" },
      ],
    },
    {
      name: "Resources",
      dropdown: [
        { label: "Blog", path: "/resources/blog" },
        { label: "Buy Me a Coffee", path: "https://coff.ee/kwixlab" },
        { label: "Tutorials", path: "/shortify" },
      ],
    },
  ];

  // Handle selection of link
  const handleSelect = (path) => {
    setOpenDropdown(null);
    setMobileNavOpen(false);
    setExpandedMobileSection(null);

    if (path.startsWith("http")) {
      window.open(path, "_blank");
    } else {
      navigate(path);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileNavOpen]);

 const renderDesktopDropdown = (item) => {
  if (item.name === "Features") {
    return (
      <div className="absolute top-full left-0 mt-3 w-[700px] bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-white/20 py-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="grid grid-cols-3 gap-8 px-6">
          {item.dropdown.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {section.category}
                </h3>
              </div>
              <div className="space-y-1">
                {section.items.map((option, index) => (
                  <button
                    key={option.label}
                    onClick={() => handleSelect(option.path)}
                    className="group w-full text-left px-3 py-2.5 text-sm text-gray-800 hover:bg-white/60 hover:backdrop-blur-sm hover:text-green-700 rounded-lg transition-all duration-300 ease-out transform hover:translate-x-1 hover:shadow-sm"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <svg 
                        className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Elegant bottom border */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>
    );
  } else {
    // Enhanced regular dropdown for other nav items
    return (
      <div className="absolute top-full left-0 mt-3 w-52 bg-white/80 backdrop-blur-md shadow-xl rounded-lg border border-white/20 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="py-1">
          {item.dropdown.map((option, index) => (
            <button
              key={option.label}
              onClick={() => handleSelect(option.path)}
              className="group w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-white/60 hover:backdrop-blur-sm hover:text-green-700 transition-all duration-200 ease-out flex items-center justify-between"
              style={{
                animationDelay: `${index * 30}ms`
              }}
            >
              <span className="font-medium">{option.label}</span>
              <svg 
                className="w-3 h-3 text-gray-400 group-hover:text-green-500 transition-all duration-200 opacity-0 group-hover:opacity-100" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }
};

const renderMobileDropdown = (item) => {
  if (item.name === "Features") {
    return (
      <div className="ml-4 mt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
        {item.dropdown.map((section, sectionIndex) => (
          <div key={sectionIndex} className="pb-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-0.5 h-3 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {section.category}
              </h4>
            </div>
            <div className="space-y-2 ml-3">
              {section.items.map((option, index) => (
                <button
                  key={option.label}
                  onClick={() => handleSelect(option.path)}
                  className="group flex items-center justify-between w-full text-left py-2 px-3 text-gray-800 text-sm hover:text-green-600 hover:bg-white/40 hover:backdrop-blur-sm rounded-md transition-all duration-200 ease-out"
                  style={{
                    animationDelay: `${index * 40}ms`
                  }}
                >
                  <span className="font-medium">{option.label}</span>
                  <svg 
                    className="w-3 h-3 text-gray-400 group-hover:text-green-500 transition-all duration-200 opacity-70 group-hover:opacity-100" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    // Enhanced regular mobile dropdown for other nav items
    return (
      <div className="ml-4 mt-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
        {item.dropdown.map((option, index) => (
          <button
            key={option.label}
            onClick={() => handleSelect(option.path)}
            className="group flex items-center justify-between w-full text-left py-2.5 px-3 text-gray-800 text-sm hover:text-green-600 hover:bg-white/40 hover:backdrop-blur-sm rounded-md transition-all duration-200 ease-out"
            style={{
              animationDelay: `${index * 30}ms`
            }}
          >
            <span className="font-medium">{option.label}</span>
            <svg 
              className="w-3 h-3 text-gray-400 group-hover:text-green-500 transition-all duration-200 opacity-70 group-hover:opacity-100" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    );
  }
};

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-gray-800/10 backdrop-blur-lg shadow-xl border border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white">
          <a href="/">
            Kwix<span className="text-green-400">Lab</span>
          </a>
        </h1>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-8 relative">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => {
                if (hideTimeout) clearTimeout(hideTimeout);
                setOpenDropdown(item.name);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => setOpenDropdown(null), 200);
                setHideTimeout(timeout);
              }}
            >
              <div className="flex flex-col">
                <button className="text-white font-semibold hover:text-green-500 transition-colors duration-200 flex items-center">
                  {item.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === item.name && renderDesktopDropdown(item)}
              </div>
            </div>
          ))}
          <a href="/pricing">
            <button className="text-white font-semibold hover:text-green-500 transition-colors duration-200">
              Pricing
            </button>
          </a>
        </nav>

        {/* Desktop Right Section - Coffee Icon + CTA Button */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="h-9 w-9 p-1 rounded-full bg-white shadow-md">
            <a
              href="https://coff.ee/kwixlab"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
                alt="Buy me a coffee"
                className="h-8 w-8"
              />
            </a>
          </div>
          <a href="/shortify">
            <button className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 px-6 rounded-full flex items-center transition-all duration-200 shadow-md hover:shadow-lg">
              <Zap className="mr-2 h-5 w-5" />
              Try KwixLab Now
            </button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 " />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Fixed oval border issue */}
      {mobileNavOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-xl p-4 shadow-lg border border-gray-200 space-y-3 z-50 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.name}>
              <button
                className="w-full text-left flex justify-between items-center font-semibold text-gray-800 py-2"
                onClick={() =>
                  setExpandedMobileSection(
                    expandedMobileSection === item.name ? null : item.name
                  )
                }
              >
                {item.name}
                {expandedMobileSection === item.name ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedMobileSection === item.name &&
                renderMobileDropdown(item)}
            </div>
          ))}
          <button
            onClick={() => handleSelect("/pricing")}
            className="w-full text-left text-gray-800 font-semibold py-2 hover:text-green-500"
          >
            Pricing
          </button>
          <a href="/shortify">
            <button className="w-full mt-3 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center">
              <Zap className="mr-2 h-5 w-5" />
              Try KwixLab Now
            </button>
          </a>
        </div>
      )}
    </header>
  );
}