import React, { useState } from 'react';
import { ChevronDown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hideTimeout, setHideTimeout] = useState(null);
  const navigate = useNavigate();

  const navItems = [
    {
      name: "Features",
      dropdown: [
        { label: "YouTube Shorts Generator", path: "/features/shorts-generator" },
        { label: "PDF Summarizer", path: "/features/pdf-summarizer" },
        { label: "Video Summarizer", path: "/features/summarizer" },
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
        { label: "Docs", path: "/resources/docs" },
        { label: "Tutorials", path: "/resources/tutorials" },
      ],
    },
  ];

  const handleSelect = (path) => {
    setOpenDropdown(null);
    navigate(path);
  };

  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900">
          <a href='/'>Short<span className="text-green-400">ify</span></a>
        </h1>

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
                const timeout = setTimeout(() => {
                  setOpenDropdown(null);
                }, 200); 
                setHideTimeout(timeout);
              }}
            >
              <div className="flex flex-col">
                <button className="text-gray-900 font-semibold hover:text-green-500 transition-colors duration-200 flex items-center">
                  {item.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>

                {openDropdown === item.name && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg rounded-lg border border-gray-100 py-2 z-50">
                    {item.dropdown.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleSelect(option.path)}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 transition-colors duration-200"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <a href='/pricing'>
            <button className="text-gray-900 font-semibold hover:text-green-500 transition-colors duration-200">
              Pricing
            </button>
          </a>
        </nav>

        <a href="/shortify">
          <button className="bg-green-500 hover:bg-green-400 text-white font-semibold py-2.5 px-6 rounded-full flex items-center transition-all duration-200 shadow-md hover:shadow-lg">
            <Zap className="mr-2 h-5 w-5" />
            Try Shortify Now
          </button>
        </a>
      </div>
    </header>
  );
}
