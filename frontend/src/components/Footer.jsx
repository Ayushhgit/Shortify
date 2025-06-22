import React from "react";
import { Mail } from "lucide-react";
import { Typewriter } from "react-simple-typewriter";

const Footer = () => {
  return (
    <footer className="relative z-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-8 py-6">
          {/* Brand Name */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Kwix<span className="text-green-500">Lab</span>
            </h1>
            <p className="mt-2 text-gray-600 text-md h-6">
              <Typewriter
                words={[
                  "Your all-in-one AI-powered platform for shorts generation and video summarization.",
                  "Generate YouTube Shorts using AI in seconds.",
                  "Summarize videos and PDFs instantly with AI.",
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
          <div className="text-center space-y-4 mt-8">
            <h2 className="text-lg font-semibold text-gray-800">Contact Us</h2>

            <div className="flex items-center justify-center space-x-2 text-gray-800">
              <Mail className="w-5 h-5" />
              <p className="text-sm">info@kwixlab.com</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center mt-6 text-sm text-gray-700">
          Made with ❤️ and ☕.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
