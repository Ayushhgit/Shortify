import React from "react";
import { CheckCircle } from "lucide-react";

export default function Pricing() {
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
          <div className="relative bg-white rounded-3xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Limited Period Tag */}
            <span className="absolute top-4 right-4 text-xs bg-grey-800 text-black font-bold px-3 py-1 rounded-full shadow-md">
              Limited Period
            </span>

            <h3 className="text-2xl font-semibold text-gray-800">Free</h3>
            <p className="text-4xl font-extrabold text-indigo-600 mt-4">₹0</p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Perfect for beginners
            </p>

            <ul className="space-y-4 text-left mb-6">
              {["X", "X", "X"].map(
                (feature, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                    {feature}
                  </li>
                )
              )}
            </ul>

            <button className="w-full py-3 px-6 rounded-xl border border-gray-300 bg-white text-black font-semibold hover:border-black hover:shadow-md transition duration-300">
                 Get Started
              </button>

          </div>

          {/* Pro Plan - Highlighted */}
          <div className="relative bg-gradient-to-br from-blue-600 to-green-600 rounded-3xl p-8 shadow-2xl text-white transform scale-105 border-4 border-indigo-700 z-10">
            <span className="absolute top-4 right-4 text-xs bg-white text-pink-600 font-bold px-3 py-1 rounded-full">
              Most Popular
            </span>
            <h3 className="text-2xl font-semibold">Pro</h3>
            <p className="text-4xl font-extrabold mt-4">₹499/mo</p>
            <p className="text-sm text-indigo-100 mb-6 mt-1">
              Great for growing teams
            </p>

            <ul className="space-y-4 text-left mb-6">
              {[
                "X",
                "X",
                "X",
                "X",
              ].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="text-white w-5 h-5 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 px-6 rounded-xl bg-white hover:bg-gray-100 font-bold text-blue-700 transition">
              Upgrade Now
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-2xl font-semibold text-gray-800">Premium</h3>
            <p className="text-4xl font-extrabold text-indigo-600 mt-4">
              ₹999/mo
            </p>
            <p className="text-sm text-gray-500 mb-6 mt-1">
              Built for power users
            </p>

            <ul className="space-y-4 text-left mb-6">
              {[
                "X",
                "X",
                "X",
                "X",
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700">
                  <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 px-6 rounded-xl border border-gray-300 bg-white text-black font-semibold hover:border-black hover:shadow-md transition duration-300">
            Go Premium
                </button>

          </div>
        </div>
      </div>
    </section>
  );
}
