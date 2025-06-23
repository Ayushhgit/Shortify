import React from "react";
import { Mail } from "lucide-react";
import { Typewriter } from "react-simple-typewriter";

const Footer = () => {
  return (
    <footer className="relative z-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 bg-white backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-8 py-6">
          {/* Brand Name */}
          <div className="text-center lg:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-black">
              Kwix<span className="text-green-500">Lab</span>
            </h1>
            <p className="mt-2 text-gray-800 text-md h-6">
              <Typewriter
                words={[
                  "Your all-in-one AI-powered platform for video, document, and productivity tools.",
                  "Generate viral YouTube Shorts in seconds with AI.",
                  "Summarize YouTube videos into bite-sized insights instantly.",
                  "Get instant PDF and article summaries with a single click.",
                  "Analyze resumes and generate tailored cover letters effortlessly.",
                  "Boost your productivity with AI-powered assignment and research tools.",
                  "Transform data into insights with our smart Data Analyzer.",
                  "Optimize your professional presence with the LinkedIn Helper.",
                ]}
                loop={0}
                cursor
                cursorStyle="_"
                typeSpeed={50}
                deleteSpeed={40}
                delaySpeed={1000}
              />
            </p>
          </div>
          
          {/* Legal and Contact Section Combined */}
          <div className="flex flex-col md:flex-row gap-8 text-center lg:text-left">
            {/* Legal Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Legal</h2>
              <div className="space-y-2">
                <div>
                  <a 
                    href="/refund-policy" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Refund Policy
                  </a>
                </div>
                <div>
                  <a 
                    href="/terms-of-service" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Terms of Service
                  </a>
                </div>
                <div>
                  <a 
                    href="/privacy-policy" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Contact Us</h2>
              
              <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-800">
                <Mail className="w-5 h-5" />
                <a 
                  href="mailto:info@kwixlab.com"
                  className="text-sm hover:text-green-500 transition-colors duration-200"
                >
                  info@kwixlab.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center mt-6 text-sm text-gray-900">
          Made with ❤️ and ☕.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
