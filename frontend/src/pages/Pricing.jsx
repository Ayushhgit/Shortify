import React from "react";
import { CheckCircle, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loadRazorpayScript } from "../utils/loadRazorpay";

export default function Pricing() {
  const navigate = useNavigate();
  async function handlePayment(amount) {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load.");
      return;
    }

    // 1. Create order from backend
    const result = await fetch(
      `http://localhost:8000/payment/create-order?amount=${amount}`,
      {
        method: "POST",
      }
    );

    const data = await result.json();
    if (!data.order_id) {
      alert("Server error. Please try again.");
      return;
    }

    const options = {
      key: "rzp_test_quVhZvf3j1rhIY", // Replace with your Razorpay key
      amount: data.amount,
      currency: data.currency,
      name: "Shortify",
      description: "Pro Plan Purchase",
      order_id: data.order_id,
      handler: async function (response) {
        // Verify payment with your backend
        const verifyRes = await fetch("http://localhost:8000/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          alert("Payment successful and verified!");
          // redirect or update state
        } else {
          alert("Payment verification failed");
        }
      },
      theme: {
        color: "#6366f1", // indigo
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Free Plan */}
          <div className="relative bg-white rounded-3xl border border-gray-200 p-8 shadow-lg hover:shadow-xl hover:border-[3px] hover:border-indigo-600 transition-all duration-300">
            <span className="absolute top-4 right-4 text-xs bg-gray-800 text-white font-bold px-3 py-1 rounded-full shadow-md">
              Limited Period
            </span>

            <h3 className="text-2xl font-semibold text-gray-800">Free</h3>
            <p className="text-4xl font-semibold text-black mt-4">₹0</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Perfect for beginners
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["X", "X", "X"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/shortify")}
              className="w-full py-3 px-6 rounded-xl border border-gray-300 bg-white text-black font-semibold hover:border-black hover:shadow-md transition duration-300"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 shadow-2xl text-white transform scale-105 border-4 border-indigo-700 z-10 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-[3px] hover:border-white">
            <span className="absolute top-4 right-4 text-xs bg-white text-pink-600 font-bold px-3 py-1 rounded-full">
              Most Popular
            </span>
            <h3 className="text-2xl font-semibold">Pro</h3>
            <p className="text-4xl font-semibold text-white mt-4">₹499/mo</p>
            <p className="text-sm text-indigo-100 mb-6 mt-1">
              Great for growing teams
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["X", "X", "X", "X"].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="text-white w-5 h-5 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-100 font-bold text-indigo-700 transition"
              onClick={() => handlePayment(499)}
            >
              Upgrade Now
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-lg hover:shadow-xl hover:border-[3px] hover:border-indigo-600 transition-all duration-300">
            <h3 className="text-2xl font-semibold text-gray-800">Premium</h3>
            <p className="text-4xl font-semibold text-black mt-4">₹999/mo</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Built for power users
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["X", "X", "X", "X"].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className="w-full py-3 px-6 rounded-xl border border-gray-300 bg-white text-black font-semibold hover:border-black hover:shadow-md transition duration-300"
              onClick={() => handlePayment(999)}
            >
              Go Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
