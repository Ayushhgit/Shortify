import React, { useState, useEffect } from "react";
import { CheckCircle, Receipt, User, Lock, Star, Crown, Zap, Shield, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import AuthModalSystem from "../components/AuthModalSystem";

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
      const response = await fetch("http://localhost:8000/payment/subscription-status", {
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
        `http://localhost:8000/payment/create-order?amount=${amount}`,
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
        key: "rzp_test_quVhZvf3j1rhIY", // Replace with your Razorpay key
        amount: data.amount,
        currency: data.currency,
        name: "Shortify",
        description: `${planName} Plan Purchase`,
        order_id: data.order_id,
        handler: async function (response) {
          // Verify payment with your backend
          const verifyRes = await fetch("http://localhost:8000/payment/verify", {
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
          ondismiss: function() {
            setProcessingPayment(false);
          }
        },
        theme: {
          color: "#6366f1", // indigo
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

  const handleCancelSubscription = async () => {
    if (!user || subscriptionStatus.subscription_type === 'free') return;
    
    if (!confirm('Are you sure you want to cancel your subscription? You will be downgraded to the free plan.')) {
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:8000/payment/cancel-subscription", {
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
  };

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
      <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-16 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Pricing Plans for Every Stage
        </h2>
        <p className="text-lg text-gray-500 mb-16">
          Whether you're just starting out or scaling up, we've got a plan that
          fits.
        </p>

        {/* Success Message */}
        {paymentSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white p-6 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-3" />
                <div>
                  <h3 className="font-semibold">Payment Successful! 🎉</h3>
                  <p className="text-sm mt-1">
                    Welcome to {purchasedPlan} plan! Your subscription is now active.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPaymentSuccess(false)}
                className="ml-4 text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Current Subscription Status */}
        {user && subscriptionStatus.subscription_type !== 'free' && subscriptionStatus.is_active && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-700">
                <Shield className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Active Subscription</h3>
                  <p className="text-sm">
                    Current Plan: <strong className="capitalize">{subscriptionStatus.subscription_type}</strong>
                  </p>
                  {subscriptionStatus.subscription_end && (
                    <p className="text-sm">
                      Valid until: <strong>{formatDate(subscriptionStatus.subscription_end)}</strong>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Free Plan */}
          <div className={`relative bg-white rounded-3xl border p-8 shadow-lg transition-all duration-300 ${
            isCurrentPlan('free') 
              ? 'border-green-500 border-2 bg-green-50' 
              : 'border-gray-200 hover:shadow-xl hover:border-indigo-600'
          }`}>
            {isCurrentPlan('free') && (
              <span className="absolute top-4 right-4 text-xs bg-green-500 text-white font-bold px-3 py-1 rounded-full shadow-md">
                Current Plan
              </span>
            )}

            <div className="flex justify-center mb-4">
              <Star className="w-12 h-12 text-gray-400" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-800">Free</h3>
            <p className="text-4xl font-semibold text-black mt-4">₹0</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Perfect for beginners
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["5 video summaries per month", "Basic analytics", "Standard support"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/shortify")}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition duration-300 ${
                isCurrentPlan('free')
                  ? 'bg-green-500 text-white cursor-default'
                  : 'border border-gray-300 bg-white text-black hover:border-black hover:shadow-md'
              }`}
              disabled={isCurrentPlan('free')}
            >
              {isCurrentPlan('free') ? 'Current Plan' : 'Get Started'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`relative rounded-3xl p-8 shadow-2xl text-white transform scale-105 z-10 transition-all duration-300 ${
            isCurrentPlan('pro')
              ? 'bg-gradient-to-br from-green-600 to-green-700 border-4 border-green-500'
              : 'bg-gradient-to-br from-indigo-600 to-purple-600 border-4 border-indigo-700 hover:scale-110 hover:shadow-xl hover:border-white'
          }`}>
            <span className="absolute top-4 right-4 text-xs bg-white font-bold px-3 py-1 rounded-full">
              {isCurrentPlan('pro') ? (
                <span className="text-green-600">Current Plan</span>
              ) : (
                <span className="text-pink-600">Most Popular</span>
              )}
            </span>

            <div className="flex justify-center mb-4">
              <Zap className="w-12 h-12 text-white" />
            </div>

            <h3 className="text-2xl font-semibold">Pro</h3>
            <p className="text-4xl font-semibold text-white mt-4">₹499/mo</p>
            <p className="text-sm text-indigo-100 mb-6 mt-1">
              Great for growing teams
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["50 video summaries per month", "Advanced analytics", "Priority support", "Custom branding"].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="text-white w-5 h-5 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-6 rounded-xl font-bold transition flex items-center justify-center ${
                isCurrentPlan('pro')
                  ? 'bg-white text-green-600 cursor-default'
                  : processingPayment
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : !user
                  ? 'bg-white hover:bg-gray-100 text-indigo-700'
                  : 'bg-white hover:bg-gray-100 text-indigo-700'
              }`}
              onClick={() => handlePaymentClick("Pro", 499)}
              disabled={isCurrentPlan('pro') || processingPayment}
            >
              {isCurrentPlan('pro') ? (
                'Current Plan'
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
          <div className={`relative bg-white rounded-3xl border p-8 shadow-lg transition-all duration-300 ${
            isCurrentPlan('premium')
              ? 'border-green-500 border-2 bg-green-50'
              : 'border-gray-200 hover:shadow-xl hover:border-indigo-600'
          }`}>
            {isCurrentPlan('premium') && (
              <span className="absolute top-4 right-4 text-xs bg-green-500 text-white font-bold px-3 py-1 rounded-full shadow-md">
                Current Plan
              </span>
            )}

            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-yellow-500" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-800">Premium</h3>
            <p className="text-4xl font-semibold text-black mt-4">₹999/mo</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Built for power users
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["Unlimited video summaries", "Enterprise analytics", "24/7 dedicated support", "API access"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 px-6 rounded-xl font-semibold transition duration-300 flex items-center justify-center ${
                isCurrentPlan('premium')
                  ? 'bg-green-500 text-white cursor-default'
                  : processingPayment
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'border border-gray-300 bg-white text-black hover:border-black hover:shadow-md'
              }`}
              onClick={() => handlePaymentClick("Premium", 999)}
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

        {/* Auth Status Indicator - Updated Logic */}
        {user && (
          <div className={`mt-12 border rounded-lg p-4 max-w-md mx-auto ${
            subscriptionStatus.subscription_type === 'free' || !subscriptionStatus.is_active
              ? 'bg-green-50 border-green-200'
              : subscriptionStatus.subscription_type === 'pro'
              ? 'bg-indigo-50 border-indigo-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex items-center ${
              subscriptionStatus.subscription_type === 'free' || !subscriptionStatus.is_active
                ? 'text-green-700'
                : subscriptionStatus.subscription_type === 'pro'
                ? 'text-indigo-700'
                : 'text-yellow-700'
            }`}>
              <User className="w-5 h-5 mr-2" />
              <span className="text-sm">
                Logged in as <strong>{user.email}</strong> - {getSubscriptionDisplayName()}
              </span>
            </div>
          </div>
        )}

        {!user && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center text-blue-700">
              <Lock className="w-5 h-5 mr-2" />
              <span className="text-sm">
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="underline hover:no-underline"
                >
                  Login
                </button> to access premium features
              </span>
            </div>
          </div>
        )}
      </div>

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