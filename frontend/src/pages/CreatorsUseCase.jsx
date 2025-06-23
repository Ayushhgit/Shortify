import { useState, useEffect } from "react";
import {
  Link, Youtube, Scissors, Download, Share2, Clock, TrendingUp, Repeat, Mail, CheckCircle, Loader
} from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import Header from "../components/Header.jsx";

export default function CreatorsUseCase() {
  const [activeStep, setActiveStep] = useState(1);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => setScrollY(window.scrollY);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const steps = [
    {
      id: 1,
      title: "Paste YouTube Link",
      description: "Simply copy and paste the URL of any YouTube video you want to transform.",
      icon: <Link className="w-8 h-8" />
    },
    {
      id: 2,
      title: "Generate Clips",
      description: "Our AI analyzes the video and automatically generates viral-worthy short clips.",
      icon: <Scissors className="w-8 h-8" />
    },
    {
      id: 3,
      title: "Download & Edit",
      description: "Review the generated clips, make any tweaks if needed, and download in preferred format.",
      icon: <Download className="w-8 h-8" />
    },
    {
      id: 4,
      title: "Share Everywhere",
      description: "Publish your clips to TikTok, Instagram Reels, YouTube Shorts and more with one click.",
      icon: <Share2 className="w-8 h-8" />
    }
  ];

  const benefits = [
    {
      id: 1,
      title: "Save Hours of Work",
      description: "What used to take hours now happens in minutes. Focus on creating, not editing.",
      icon: <Clock className="w-6 h-6 text-orange-500" />
    },
    {
      id: 2,
      title: "Grow Audience Faster",
      description: "Consistently publish viral-worthy shorts to rapidly expand your reach and following.",
      icon: <TrendingUp className="w-6 h-6 text-orange-500" />
    },
    {
      id: 3,
      title: "Repurpose Old Content",
      description: "Breathe new life into your content library by transforming old videos into fresh clips.",
      icon: <Repeat className="w-6 h-6 text-orange-500" />
    }
  ];

  const useCases = [
    "YouTube creators looking to expand to short-form content",
    "Podcasters wanting to share highlights on social media",
    "Educators making digestible learning snippets",
    "Businesses repurposing webinars and presentations"
  ];

  return (

    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Main gradient orb following mouse */}
        <div
          className="absolute w-[800px] h-[800px] opacity-30 transition-all duration-1000 ease-out"
          style={{
            left: mousePosition.x - 400,
            top: mousePosition.y - 400,
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />

        {/* Static gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/5 via-purple-900/5 to-cyan-900/5" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-purple-600/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-t from-blue-600/10 to-transparent rounded-full blur-3xl" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none z-0" />
      </div>
      <Header />
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-36">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-pink-200">
              Transform Long Videos Into
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-cyan-400">
              Viral Shorts
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-purple-200">
              With AI
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Shortify helps content creators automatically convert long-form videos into
            engaging short-form clips that are perfect for TikTok, Instagram, and YouTube Shorts.
          </p>
        </div>

        {/* How It Works Section */}
        <div className="mb-24">
          <h3 className="text-3xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            How Shortify Works
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Steps Visualization */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 hover:bg-white/10 transition-all duration-500">
              <div className="flex flex-col space-y-6">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 cursor-pointer ${activeStep === step.id
                      ? "bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30"
                      : "hover:bg-white/5 border border-transparent"
                      }`}
                    onClick={() => setActiveStep(step.id)}
                  >
                    <div className={`p-3 rounded-full transition-all duration-300 ${activeStep === step.id
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25"
                      : "bg-white/10 text-orange-400 hover:bg-white/20"
                      }`}>
                      {step.icon}
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg text-white mb-1">
                        {step.id}. {step.title}
                      </h4>
                      <p className="text-gray-300">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Representation */}
            <div className="bg-gradient-to-br from-orange-600 via-pink-600 to-purple-600 rounded-2xl shadow-2xl p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative text-center text-white z-10">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                    {steps[activeStep - 1].icon}
                  </div>
                </div>
                <h4 className="text-xl font-bold mb-3">
                  Step {activeStep}: {steps[activeStep - 1].title}
                </h4>
                <p className="text-white/90 max-w-md">
                  {steps[activeStep - 1].description}
                </p>

                {/* Visualization placeholder */}
                <div className="mt-8 relative">
                  <div className="w-full max-w-xs mx-auto aspect-video bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                    {activeStep === 1 && (
                      <div className="flex flex-col items-center">
                        <Youtube className="w-12 h-12 text-red-400" />
                        <div className="mt-2 w-3/4 h-8 bg-white/20 rounded animate-pulse"></div>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="flex space-x-2">
                        <div className="w-1/3 h-24 bg-white/20 rounded"></div>
                        <Loader className="w-8 h-8 text-orange-400 animate-spin" />
                        <div className="w-1/3 h-24 bg-white/30 rounded animate-pulse"></div>
                        <div className="w-1/3 h-24 bg-white/20 rounded"></div>
                      </div>
                    )}
                    {activeStep === 3 && (
                      <div className="flex flex-col items-center">
                        <Download className="w-12 h-12 text-green-400" />
                        <div className="mt-2 flex space-x-2">
                          <div className="h-6 w-16 bg-white/20 rounded"></div>
                          <div className="h-6 w-16 bg-white/20 rounded"></div>
                        </div>
                      </div>
                    )}
                    {activeStep === 4 && (
                      <div className="flex space-x-3 items-center">
                        <div className="w-8 h-8 rounded-full bg-pink-400"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-400"></div>
                        <div className="w-8 h-8 rounded-full bg-red-400"></div>
                        <Share2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
            Why Content Creators Love Shortify
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.id}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-500 p-6 group"
              >
                <div className="p-3 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full w-fit mb-4 group-hover:from-orange-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                  {benefit.icon}
                </div>
                <h4 className="text-xl font-semibold mb-3 text-white">{benefit.title}</h4>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-6 md:p-8 lg:p-12">
              <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                Perfect For All Content Creators
              </h3>
              <div className="space-y-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-gray-300">{useCase}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a href='/features/shorts-generator'><button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105">
                  Try Shortify for Free
                </button> </a>
                <p className="text-sm text-gray-400 mt-3 ml-2">Limited period only.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative max-w-md text-center text-white z-10">
                <h4 className="text-2xl font-bold mb-4">
                  Save 15+ Hours Weekly On Content Creation
                </h4>
                <p className="text-white/90 mb-6">
                  Join thousands of content creators who are scaling their social media presence effortlessly
                  with Shortify's AI-powered video transformation.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 border-2 border-white"></div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 border-2 border-white"></div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white"></div>
                    </div>
                    <span className="ml-3 text-sm font-semibold">+2.4k users</span>
                  </div>

                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.0 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-semibold">4.6/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*footer*/}
     <footer className="relative z-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 bg-gray-800/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-8 py-6">
          {/* Brand Name */}
          <div className="text-center lg:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-white">
              Kwix<span className="text-green-500">Lab</span>
            </h1>
            <p className="mt-2 text-gray-300 text-md h-6">
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
              <h2 className="text-lg font-semibold text-white">Legal</h2>
              <div className="space-y-2">
                <div>
                  <a 
                    href="/refund-policy" 
                    className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Refund Policy
                  </a>
                </div>
                <div>
                  <a 
                    href="/terms-of-service" 
                    className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Terms of Service
                  </a>
                </div>
                <div>
                  <a 
                    href="/privacy-policy" 
                    className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Contact Us</h2>
              
              <div className="flex items-center justify-center lg:justify-start space-x-2 text-gray-300">
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
        <div className="text-center mt-6 text-sm text-gray-300">
          Made with ❤️ and ☕.
        </div>
      </div>
    </footer>
    </div>
  );
}