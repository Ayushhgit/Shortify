import React from "react";
import { Mail } from "lucide-react";

// Simple Typewriter component
const Typewriter = ({ words, typeSpeed = 50, deleteSpeed = 40, delaySpeed = 1000 }) => {
  const [currentWordIndex, setCurrentWordIndex] = React.useState(0);
  const [currentText, setCurrentText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), delaySpeed);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typeSpeed, deleteSpeed, delaySpeed]);

  return <span>{currentText}_</span>;
};

const Footer = () => {
  return (
    <footer className="relative z-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="bg-white backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Brand Name */}
          <div className="text-center mb-8 lg:mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
              Kwix<span className="text-green-500">Lab</span>
            </h1>
            <div className="mt-3 text-gray-800 text-sm sm:text-base leading-relaxed min-h-[3rem] sm:min-h-[1.5rem]">
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
                typeSpeed={50}
                deleteSpeed={40}
                delaySpeed={1000}
              />
            </div>
          </div>
          
          {/* Legal and Contact Section Combined */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12 lg:gap-16">
            {/* Legal Section */}
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold text-black mb-4">Legal</h2>
              <div className="space-y-3">
                <div>
                  <a 
                    href="/refund-policy" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline block"
                  >
                    Refund Policy
                  </a>
                </div>
                <div>
                  <a 
                    href="/terms-of-service" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline block"
                  >
                    Terms of Service
                  </a>
                </div>
                <div>
                  <a 
                    href="/privacy-policy" 
                    className="text-sm text-gray-800 hover:text-green-500 transition-colors duration-200 hover:underline block"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-semibold text-black mb-4">Contact Us</h2>
              
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-gray-800">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <a 
                  href="mailto:info@kwixlab.com"
                  className="text-sm hover:text-green-500 transition-colors duration-200 break-all"
                >
                  info@kwixlab.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="text-center mt-6 text-sm text-gray-900">
           © 2025 KwixLab. All Rights Reserved.
        </div>
      </div>
    </footer>
)};

export default Footer;