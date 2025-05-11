import React from 'react';
import { FaGithub } from "react-icons/fa";
import { Typewriter } from 'react-simple-typewriter';



const Footer = () => {
  return (
    <footer className="relative z-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-8 py-6">

          {/* Brand Name */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Short<span className="text-green-500">ify</span>
            </h1>
            <p className="mt-2 text-gray-600 text-md h-6">
            <Typewriter
              words={[
                'Your all-in-one AI-powered platform for shorts generation and video summarization.',
                'Generate YouTube Shorts using AI in seconds.',
                'Summarize videos and PDFs instantly with AI.',
              ]}
              loop={0}
              cursor
              cursorStyle="_"
              typeSpeed={40}
              deleteSpeed={30}
              delaySpeed={2000}
            />
          </p>
          </div>

          {/* Contribution Section */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">Want to contribute?</h2>
            <a
              href="https://github.com/Ayushhgit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-green-600 text-2xl mt-2 inline-block transition"
            >
              <FaGithub />
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center mt-6 text-sm text-gray-700">
          © 2025 Shortify. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
