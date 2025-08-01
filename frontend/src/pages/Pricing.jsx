import React, { useState, useEffect } from "react";
import { CheckCircle, Receipt, User, Lock, Mail, Star, Crown, Zap, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { Typewriter } from "react-simple-typewriter";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import AuthModalSystem from "../components/AuthModalSystem";

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [purchasedPlan, setPurchasedPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    subscription_type: 'free',
    is_active: false,
    subscription_end: null,
    subscription_start: null
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  {/*useEffect(() => {
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
  }, []);*/}

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchSubscriptionStatus(currentUser);
      } else {
        // Reset subscription status when user logs out
        setSubscriptionStatus({
          subscription_type: 'free',
          is_active: false,
          subscription_end: null,
          subscription_start: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSubscriptionStatus = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("https://kwixlab.com/payment/subscription-status", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const status = await response.json();
        console.log("Fetched subscription status:", status); // Debug log
        setSubscriptionStatus(status);
      } else {
        console.error("Failed to fetch subscription status:", response.status);
        // Set default free status if API fails
        setSubscriptionStatus({
          subscription_type: 'free',
          is_active: false,
          subscription_end: null,
          subscription_start: null
        });
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      // Set default free status if there's an error
      setSubscriptionStatus({
        subscription_type: 'free',
        is_active: false,
        subscription_end: null,
        subscription_start: null
      });
    }
  };

  const handleAuthSuccess = (user, userData) => {
    setUser(user);
    setShowAuthModal(false);
    fetchSubscriptionStatus(user);
  };

  const handlePaymentClick = (planName, amount) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    // Check if user already has this plan
    if (subscriptionStatus.subscription_type === planName.toLowerCase() && subscriptionStatus.is_active) {
      alert(`You already have an active ${planName} subscription!`);
      return;
    }

    handlePayment(planName, amount);
  };

  async function handlePayment(planName, amount) {
    if (processingPayment) return;

    setProcessingPayment(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load.");
      setProcessingPayment(false);
      return;
    }

    try {
      // Get user token for authenticated request
      const token = await user.getIdToken();

      // 1. Create order from backend
      const result = await fetch(
        `https://kwixlab.com/payment/create-order?amount=${amount}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = await result.json();
      if (!data.order_id) {
        alert("Server error. Please try again.");
        setProcessingPayment(false);
        return;
      }

      const options = {
        key: "rzp_live_Roih4zI5cd2ciw", // Replace with your Razorpay key
        amount: data.amount,
        currency: data.currency,
        name: "Shortify",
        description: `${planName} Plan Purchase`,
        order_id: data.order_id,
        handler: async function (response) {
          // Verify payment with your backend
          const verifyRes = await fetch("https://kwixlab.com/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_name: planName,
              amount: amount
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setPurchasedPlan(planName);
            setPaymentSuccess(true);
            // Refresh subscription status
            await fetchSubscriptionStatus(user);
            // Auto-hide success message after 5 seconds
            setTimeout(() => {
              setPaymentSuccess(false);
              setPurchasedPlan(null);
            }, 5000);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
          setProcessingPayment(false);
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          }
        },
        theme: {
          color: "#3b82f6", // blue-500
        },
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initialization failed. Please try again.");
      setProcessingPayment(false);
    }
  }

  /*const handleCancelSubscription = async () => {
    if (!user || subscriptionStatus.subscription_type === 'free') return;

    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the free plan.')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("https://kwixlab.com/payment/cancel-subscription", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        alert("Subscription cancelled successfully!");
        await fetchSubscriptionStatus(user);
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    }
  };*/

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentPlan = (planName) => {
    return subscriptionStatus.subscription_type === planName.toLowerCase() && subscriptionStatus.is_active;
  };
  const isDowngrade = (planName) => {
    const planHierarchy = { 'free': 0, 'pro': 1, 'premium': 2 };
    const currentPlanLevel = planHierarchy[subscriptionStatus.subscription_type.toLowerCase()] || 0;
    const targetPlanLevel = planHierarchy[planName.toLowerCase()] || 0;
    return subscriptionStatus.is_active && currentPlanLevel > targetPlanLevel;
  };

  // Helper function to get display name for subscription type
  const getSubscriptionDisplayName = () => {
    if (!subscriptionStatus.subscription_type || subscriptionStatus.subscription_type === 'free') {
      return 'Free Plan';
    }

    const type = subscriptionStatus.subscription_type.toLowerCase();
    if (type === 'pro') return 'Pro Plan';
    if (type === 'premium') return 'Premium Plan';

    // Fallback - capitalize first letter
    return subscriptionStatus.subscription_type.charAt(0).toUpperCase() +
      subscriptionStatus.subscription_type.slice(1) + ' Plan';
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-black to-gray-900 py-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white pt-38 px-6 relative overflow-hidden">
      {/* Decorative gradient orbs */}
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
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-full blur-3xl"></div>

      <div className="max-w-none mx-auto text-center relative z-10 px-4">
        <h2 className="text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-purple-100 mb-8 tracking-tight">
          Pricing Plans for Every Stage
        </h2>
        <p className="text-xl text-gray-300 mb-16 font-light">
          Whether you're just starting out or scaling up, we've got a plan that
          fits.
        </p>

        {/* Success Message */}
        {paymentSuccess && (
          <div className="fixed top-4 right-4 z-60 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl max-w-md backdrop-blur-xl border border-green-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="font-semibold">Payment Successful! 🎉</h3>
                  <p className="text-sm mt-1 text-green-100">
                    Welcome to {purchasedPlan} plan! Your subscription is now active.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentSuccess(false)}
                className="ml-4 text-green-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {user && subscriptionStatus.subscription_type !== 'free' && subscriptionStatus.is_active && (
          <div className="mb-12 bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-auto backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="w-full flex justify-center">
                <div className="flex items-center text-blue-400">
                  <Shield className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-white">Active Subscription</h3>
                    <p className="text-sm text-gray-300">
                      Current Plan:
                      <strong className="capitalize text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        {subscriptionStatus.subscription_type}
                      </strong>
                    </p>
                    {subscriptionStatus.subscription_end && (
                      <p className="text-sm text-gray-400">
                        Valid until: <strong className="text-gray-300">{formatDate(subscriptionStatus.subscription_end)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/*<button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-500/20"
              >
                Cancel Subscription
              </button>*/}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border p-8 shadow-2xl transition-all duration-500 backdrop-blur-xl ${isCurrentPlan('free')
            ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10'
            : 'border-white/10 hover:border-white/20 hover:shadow-blue-500/25 hover:scale-[1.02]'
            }`}>
            {isCurrentPlan('free') && (
              <span className="absolute top-4 right-4 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
                Current Plan
              </span>
            )}

            <div className="flex justify-center mb-6">
              <Star className="w-12 h-12 text-gray-400" />
            </div>

            <h3 className="text-2xl font-light text-white mb-2">Free</h3>
            <p className="text-5xl font-light text-white mb-2">₹0</p>
            <p className="text-sm text-gray-400 mb-8">
              Perfect for beginners
            </p>

            <ul className="space-y-4 text-left mb-8">
              {["5 video summaries per month", "Basic analytics", "Standard support"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-300">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-light">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/shortify")}
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 ${isCurrentPlan('free')
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                : 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl'
                }`}
              disabled={isCurrentPlan('free')}
            >
              {isCurrentPlan('free') ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`relative rounded-3xl p-8 shadow-2xl text-white transform scale-105 z-10 transition-all duration-500 backdrop-blur-xl ${isCurrentPlan('pro')
            ? 'bg-gradient-to-br from-green-600/20 to-emerald-700/20 border-2 border-green-500/50'
            : 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 hover:scale-110 hover:shadow-blue-500/50 hover:border-blue-400/70'
            }`}>
            <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {isCurrentPlan('pro') ? (
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg border p-1">Current Plan</span>
              ) : (
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg border p-1">Most Popular</span>
              )}
            </span>

            <div className="flex justify-center mb-6">
              <Zap className="w-12 h-12 text-white" />
            </div>

            <h3 className="text-2xl font-light mb-2">Pro</h3>
            <p className="text-5xl font-light text-white mb-2">₹1/mo</p>
            <p className="text-sm text-blue-200 mb-8">
              Great for growing teams
            </p>

            <ul className="space-y-4 text-left mb-8">
              {["50 video summaries per month", "Advanced analytics", "Priority support", "Custom branding"].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="text-white w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-light">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${isCurrentPlan('pro')
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                : isDowngrade('pro')
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600/50'
                  : processingPayment
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : !user
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-white text-blue-600 hover:bg-gray-100'
                }`}
              onClick={() => handlePaymentClick("Pro", 1)}
              disabled={isCurrentPlan('pro') || isDowngrade('pro') || processingPayment}
            >
              {isCurrentPlan('pro') ? (
                'Current Plan'
              ) : isDowngrade('pro') ? (
                'Downgrade Not Available'
              ) : processingPayment ? (
                'Processing...'
              ) : !user ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login to Upgrade
                </>
              ) : (
                "Upgrade Now"
              )}
            </button>
          </div>

          {/* Premium Plan */}
          <div className={`relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-3xl border p-8 shadow-2xl transition-all duration-500 backdrop-blur-xl ${isCurrentPlan('premium')
            ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10'
            : 'border-white/10 hover:border-white/20 hover:shadow-purple-500/25 hover:scale-[1.02]'
            }`}>
            {isCurrentPlan('premium') && (
              <span className="absolute top-4 right-4 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
                Current Plan
              </span>
            )}

            <div className="flex justify-center mb-6">
              <Crown className="w-12 h-12 text-yellow-400" />
            </div>

            <h3 className="text-2xl font-light text-white mb-2">Premium</h3>
            <p className="text-5xl font-light text-white mb-2">₹2/mo</p>
            <p className="text-sm text-gray-400 mb-8">
              Built for power users
            </p>

            <ul className="space-y-4 text-left mb-8">
              {["Unlimited video summaries", "Enterprise analytics", "24/7 dedicated support", "API access"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-300">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="font-light">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center ${isCurrentPlan('premium')
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white cursor-default'
                : processingPayment
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-xl'
                }`}
              onClick={() => handlePaymentClick("Premium", 2)}
              disabled={isCurrentPlan('premium') || processingPayment}
            >
              {isCurrentPlan('premium') ? (
                'Current Plan'
              ) : processingPayment ? (
                'Processing...'
              ) : !user ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Login to Go Premium
                </>
              ) : (
                "Go Premium"
              )}
            </button>
          </div>
        </div>

        {/* Auth Status Indicator */}
        {user && (
          <div className={`mt-16 border rounded-2xl p-6 max-w-md mx-auto backdrop-blur-xl transition-all duration-300 ${subscriptionStatus.subscription_type === 'free' || !subscriptionStatus.is_active
            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
            : subscriptionStatus.subscription_type === 'pro'
              ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30'
              : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
            }`}>
            <div className={`flex items-center ${subscriptionStatus.subscription_type === 'free' || !subscriptionStatus.is_active
              ? 'text-green-400'
              : subscriptionStatus.subscription_type === 'pro'
                ? 'text-blue-400'
                : 'text-yellow-400'
              }`}>
              <User className="w-5 h-5 mr-3" />
              <span className="text-sm font-light">
                Logged in as <strong className="text-white">{user.email}</strong> - <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{getSubscriptionDisplayName()}</span>
              </span>
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 max-w-md mx-auto backdrop-blur-xl">
            <div className="flex items-center text-blue-400">
              <Lock className="w-5 h-5 mr-3" />
              <span className="text-sm font-light">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-300 hover:to-purple-300 transition-all duration-300 font-medium"
                >
                  Login
                </button> <span className="text-gray-300">to access premium features</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/*footer*/}
      <footer className="relative z-10 mt-10">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="bg-gray-800/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-md px-6 sm:px-8 py-8">

            {/* Mobile Layout - Hidden on Desktop */}
            <div className="lg:hidden flex flex-col space-y-8">

              {/* Brand Section - Mobile */}
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-white mb-3">
                  Kwix<span className="text-green-500">Lab</span>
                </h1>
                <div className="text-gray-300 text-sm leading-relaxed h-6">
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

              {/* Legal and Contact Section - Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-lg mx-auto">

                {/* Legal Section */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
                  <div className="space-y-3">
                    <div>
                      <a
                        href="/refund-policy"
                        className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                      >
                        Refund Policy
                      </a>
                    </div>
                    <div>
                      <a
                        href="/terms-of-service"
                        className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                      >
                        Terms of Service
                      </a>
                    </div>
                    <div>
                      <a
                        href="/privacy-policy"
                        className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                      >
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-white mb-4">Contact Us</h2>
                  <div className="flex items-center justify-center space-x-2 text-gray-300">
                    <Mail className="w-4 h-4 flex-shrink-0" />
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

            {/* Desktop Layout - Hidden on Mobile */}
            <div className="hidden lg:block">
              <div className="flex justify-between items-start">

                {/* Brand Section for Desktop */}
                <div className="flex-1 max-w-2xl">
                  <h1 className="text-3xl font-extrabold text-white mb-3">
                    Kwix<span className="text-green-500">Lab</span>
                  </h1>
                  <div className="text-gray-300 text-md leading-relaxed h-6">
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

                {/* Legal and Contact for Desktop */}
                <div className="flex gap-12">

                  {/* Legal Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Legal</h2>
                    <div className="space-y-3">
                      <div>
                        <a
                          href="/refund-policy"
                          className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                        >
                          Refund Policy
                        </a>
                      </div>
                      <div>
                        <a
                          href="/terms-of-service"
                          className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                        >
                          Terms of Service
                        </a>
                      </div>
                      <div>
                        <a
                          href="/privacy-policy"
                          className="text-sm text-gray-300 hover:text-green-500 transition-colors duration-200 hover:underline block"
                        >
                          Privacy Policy
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Contact Us</h2>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Mail className="w-4 h-4 flex-shrink-0" />
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
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="text-center mt-6 text-sm text-gray-300">
            © 2025 KwixLab. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModalSystem
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </section>

  );
}