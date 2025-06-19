import React, { useState, useEffect } from "react";
import {
  Play,
  FileText,
  Zap,
  Star,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Check,
} from "lucide-react";
import Header from "../components/Header.jsx";
import HelloBot from "../components/HelloBot.jsx";
import { Mail } from "lucide-react";
import { Typewriter } from "react-simple-typewriter";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast.jsx";
import { getAuth } from "firebase/auth";
import FeaturedToolsSection from "../components/FeaturedToolsSection.jsx";

const ShortifyLanding = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

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

  const displayToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSend = async () => {
    if (!user || !user.email) {
      displayToast("Please log in to submit a review.", "error");
      return;
    }

    if (rating === 0) {
      displayToast("Please select a rating.", "error");
      return;
    }

    if (!feedback.trim()) {
      displayToast("Please provide feedback.", "error");
      return;
    }

    const reviewPayload = {
      email: user.email,
      rating,
      feedback: feedback.trim(),
    };

    try {
      // Fixed: Changed variable name from 'review' to 'response'
      const response = await fetch("http://localhost:8000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewPayload),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear form
        displayToast("Thanks for your feedback!", "success");
        setShowForm(false);
        setRating(0);
        setFeedback("");
        setHovered(0);
      } else {
        displayToast(
          data.detail || "Failed to submit review. Please try again.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      displayToast(
        "Something went wrong while submitting your review.",
        "error"
      );
    }
  };

  // Enhanced review form component (optional improvement)
  const ReviewForm = () => (
    <div className="mt-10 max-w-xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-6 text-center">
        Share Your Experience
      </h3>

      {/* Stars */}
      <div className="flex justify-center mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className={`w-10 h-10 cursor-pointer transition-all duration-200 mx-1 ${
              (hovered || rating) >= star
                ? "text-yellow-400 fill-current scale-110"
                : "text-gray-500 hover:text-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Rating text */}
      {rating > 0 && (
        <p className="text-center text-gray-300 mb-4">
          {rating === 1 && "Poor"}
          {rating === 2 && "Fair"}
          {rating === 3 && "Good"}
          {rating === 4 && "Very Good"}
          {rating === 5 && "Excellent"}
        </p>
      )}

      {/* Feedback Text Area */}
      <textarea
        placeholder="Tell us about your experience with Shortify..."
        rows={4}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-gray-800/50 text-white border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6 resize-none"
        maxLength={500}
      />

      <div className="text-right text-sm text-gray-400 mb-4">
        {feedback.length}/500
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowForm(false);
            setRating(0);
            setFeedback("");
            setHovered(0);
          }}
          className="flex-1 px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={rating === 0 || !feedback.trim()}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Send Feedback
        </button>
      </div>
    </div>
  );

  const features = [
    {
      icon: <Play className="w-7 h-7" />,
      title: "YouTube Summarization",
      description:
        "Transform hours of video content into actionable insights. Perfect for research, learning, and content analysis.",
      gradient: "from-red-500/20 to-pink-500/20",
    },
    {
      icon: <FileText className="w-7 h-7" />,
      title: "PDF Intelligence",
      description:
        "Extract key insights from complex documents, research papers, and reports in seconds.",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: "Web Content Analysis",
      description:
        "Summarize articles, blog posts, and web pages with precision and context awareness.",
      gradient: "from-purple-500/20 to-indigo-500/20",
    },
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: "YouTube Clipper",
      description:
        "Automatically detect and extract the most viral-worthy moments from your videos",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
  ];

  const stats = [
    { value: "100+", label: "Documents Processed" },
    { value: "50+", label: "Hours Saved" },
    { value: "99.2%", label: "Accuracy Rate" },
    { value: "10s", label: "Average Processing Time" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden relative">
      {/* Ultra-Premium Animated Background */}
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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-7xl mx-auto text-center z-10">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-3 px-300 py-10 rounded-full  border border-white/10 mb-12 hover:border-white/20 transition-all duration-500 group"></div>

          {/* Main headline */}
          <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-white via-green-200 to-green-300 bg-clip-text text-transparent">
              Crux
              <span className="bg-gradient-to-r from-green-300 to-green-380 bg-clip-text text-transparent">
                LM
              </span>
            </span>
          </h1>

          {/* Subheadline with premium typography */}
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <p className="text-2xl md:text-3xl text-gray-300 font-light leading-relaxed mb-4">
              <span className="font-semibold">Your one-stop solution.</span>
            </p>

            <p className="text-lg text-gray-400 font-light leading-relaxed mb-6">
              From YouTube Shorts and video summaries to PDF insights, resume
              analysis, and research help — everything AI-powered, all in one
              place. Built for creators, learners, and professionals — designed
              for clarity, speed, and next-gen productivity.
            </p>

            <p className="text-2xl md:text-3xl font-light leading-relaxed">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
                Simplify, Summarize, Succeed 
              </span>
            </p>
            <HelloBot></HelloBot>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button
              onClick={() => navigate("/shortify")}
              className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-3">
                Use Now
                <div className="w-2 h-2 bg-white rounded-full group-hover:w-6 group-hover:h-0.5 transition-all duration-300" />
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 font-light">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

            <div className="flex flex-col">
             <FeaturedToolsSection />
          </div>
          
      {/* Features Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Intelligent Processing
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              From hours of content to minutes of clarity — powered by
              cutting-edge AI.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-10 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-700 hover:scale-[1.02]"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-500">
                    {feature.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-6 text-white group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 text-lg leading-relaxed group-hover:text-gray-300 transition-colors font-light">
                    {feature.description}
                  </p>

                  <div className="flex items-center gap-2 mt-6 text-blue-400 group-hover:text-blue-300 transition-colors">
                    <span
                      onClick={() => navigate("/shortify")}
                      className="text-sm font-medium"
                    >
                      Learn more
                    </span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
          Liked it? Let us also know.
        </h2>

        <p className="text-gray-400 text-lg mb-6">
          Your feedback helps us grow.
        </p>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all"
          >
            Leave a Review
          </button>
        )}

        {showForm && (
          <div className="mt-10 max-w-xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-xl">
            {/* Stars */}
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    (hovered || rating) >= star
                      ? "text-yellow-400 fill-current"
                      : "text-gray-500"
                  }`}
                />
              ))}
            </div>

            {/* Feedback Text Area */}
            <textarea
              placeholder="Write your feedback here..."
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Send Feedback
            </button>
          </div>
        )}
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative p-16 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 backdrop-blur-xl border border-white/10 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-3xl" />
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Ready to Transform
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Your Workflow?
                </span>
              </h2>

              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                Let AI handle the heavy reading — you focus on understanding
                what matters.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
                <button
                  onClick={() => navigate("/pricing")}
                  className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold text-xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10 flex items-center gap-3">
                    Start Free Trial
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="relative z-10 mt-10">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 bg-gray-800/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-8 py-6">
            {/* Brand Name */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-white-900">
                Clari<span className="text-green-500">AI</span>
              </h1>
              <p className="mt-2 text-white-600 text-md h-6">
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

            {/* Contribution Section */}
            <div className="text-center space-y-4 mt-8">
              <h2 className="text-lg font-semibold text-white">Contact Us</h2>

              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Mail className="w-5 h-5" />
                <p className="text-sm">Shortify.rpx@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="text-center mt-6 text-sm text-white-700">
            Made with ❤️ and ☕.
          </div>
        </div>
      </footer>
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default ShortifyLanding;
