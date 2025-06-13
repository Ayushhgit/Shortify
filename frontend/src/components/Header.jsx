import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Menu, X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


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
        { label: "YouTube Shorts Generator", path: "/features/shorts-generator" },
        { label: "PDF Summarizer", path: "/features/pdf-summarizer" },
        { label: "Video Summarizer", path: "/features/summarizer" },
        { label: "Resume Analyzer", path: "/features/ResumeAnalyzer" },
        { label: "Article Summarizer", path: "/features/ArticleSummarizer" },
        { label: "Cove Letter Generator", path: "/features/coverLetterGenerator" },
        { label: "Assignment Helper", path: "/features/AssignmentHelper" },
        { label: "Research Assistant", path: "/features/ResearchAssistant" },
        { label: "Data Analyzer", path: "/features/EDA" },
        { label: "LinkedIn Helper", path: "/features/LinkwiseAI" },
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
        { label: "Project-GitHub", path: "https://github.com/ayushhgit/Shortify" },
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
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [mobileNavOpen]);

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-gray-800/10 backdrop-blur-lg shadow-xl border border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white-900">
          <a href='/'>Short<span className="text-green-400">ify</span></a>
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
                <button className="text-white-900 font-semibold hover:text-green-500 transition-colors duration-200 flex items-center">
                  {item.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white shadow-lg rounded-md border border-gray-100 py-1 z-50 text-sm">
                    {item.dropdown.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleSelect(option.path)}
                        className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-100 hover:text-green-600 transition duration-200"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <a href="/pricing">
            <button className="text-white-900 font-semibold hover:text-green-500 transition-colors duration-200">
              Pricing
            </button>
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X className="h-6 w-6 text-white-800" /> : <Menu className="h-6 w-6 text-white-500"  />}
          </button>
        </div>

        {/* CTA Button */}
        <a href="/shortify" className="hidden md:inline-block">
          <button className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 px-6 rounded-full flex items-center transition-all duration-200 shadow-md hover:shadow-lg">
            <Zap className="mr-2 h-5 w-5" />
            Try Shortify Now
          </button>
        </a>
      </div>

      {/* Mobile Menu */}
      {mobileNavOpen && (
        <div className="md:hidden mt-4 rounded-xl bg-white p-4 shadow-lg border border-gray-200 space-y-3">
          {navItems.map((item) => (
            <div key={item.name}>
              <button
                className="w-full text-left flex justify-between items-center font-semibold text-gray-800 py-2"
                onClick={() => setExpandedMobileSection(expandedMobileSection === item.name ? null : item.name)}
              >
                {item.name}
                {expandedMobileSection === item.name ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedMobileSection === item.name && (
                <div className="ml-3 space-y-2">
                  {item.dropdown.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleSelect(option.path)}
                      className="block text-left text-gray-600 text-sm hover:text-green-500 transition"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={() => handleSelect("/pricing")} className="w-full text-left text-gray-800 font-semibold py-2 hover:text-green-500">
            Pricing
          </button>
          <a href="/shortify">
            <button className="w-full mt-3 bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex justify-center items-center">
              <Zap className="mr-2 h-5 w-5" />
              Try Shortify Now
            </button>
          </a>
        </div>
      )}
    </header>
  );
}
