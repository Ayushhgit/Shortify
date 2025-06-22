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
            { label: "MineCraft Clip Maker", path: "/features/Clip-generator" },
          ],
        },
        {
          category: "DOCUMENT TOOLS",
          items: [
            { label: "PDF Summarizer", path: "/features/pdf-summarizer" },
            {
              label: "Article Summarizer",
              path: "/features/ArticleSummarizer",
            },
            { label: "Resume Analyzer", path: "/features/ResumeAnalyzer" },
            {
              label: "Cover Letter Generator",
              path: "/features/coverLetterGenerator",
            },
            {
              label: "InterviewPrep Assitant",
              path: "/features/InterviewPrepAssistant",
            },
          ],
        },
        {
          category: "PRODUCTIVITY TOOLS",
          items: [
            { label: "Notes Generator", path: "/features/AssignmentHelper" },
            { label: "Research Assistant", path: "/features/ResearchAssistant"},
            { label: "Data Analyzer", path: "/features/EDA" },
            { label: "Quiz Generator", path: "/features/quiz-generator" },
            { label: "LinkedIn Helper", path: "/features/LinkwiseAI" },
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
        { label: "Buy Me a Coffee", path: "https://buymeacoffee.com" },
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
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white shadow-lg rounded-md border border-gray-100 py-4 z-50">
          <div className="grid grid-cols-3 gap-6 px-4">
            {item.dropdown.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => handleSelect(option.path)}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-md transition duration-200"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Regular dropdown for other nav items
      return (
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
      );
    }
  };

  const renderMobileDropdown = (item) => {
    if (item.name === "Features") {
      return (
        <div className="ml-3 space-y-3">
          {item.dropdown.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {section.category}
              </h4>
              <div className="space-y-2 ml-2">
                {section.items.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleSelect(option.path)}
                    className="block text-left text-gray-600 text-sm hover:text-green-500 transition"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Regular mobile dropdown for other nav items
      return (
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
      );
    }
  };

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-gray-800/10 backdrop-blur-lg shadow-xl border border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white-900">
          <a href="/">
            Clari<span className="text-green-400">AI</span>
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
                <button className="text-white-900 font-semibold hover:text-green-500 transition-colors duration-200 flex items-center">
                  {item.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                {openDropdown === item.name && renderDesktopDropdown(item)}
              </div>
            </div>
          ))}
          <a href="/pricing">
            <button className="text-white-900 font-semibold hover:text-green-500 transition-colors duration-200">
              Pricing
            </button>
          </a>
        </nav>

        {/* Desktop Right Section - Coffee Icon + CTA Button */}
        <div className="hidden md:flex items-center space-x-3">
          <div className="h-9 w-9 p-1 rounded-full bg-white shadow-md">
            <a
              href="https://www.buymeacoffee.com/yourusername"
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
              Try ClariAI Now
            </button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? (
              <X className="h-6 w-6 text-white-800" />
            ) : (
              <Menu className="h-6 w-6 text-white-500" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Fixed oval border issue */}
      {mobileNavOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-white rounded-xl p-4 shadow-lg border border-gray-200 space-y-3 z-50">
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
              Try ClariAI Now
            </button>
          </a>
        </div>
      )}
    </header>
  );
}