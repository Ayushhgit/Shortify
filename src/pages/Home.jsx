
import React from "react";
import { Zap, Video, Youtube, FileText } from "lucide-react";

export default function Home() {
  return (
    <section className="py-12 px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to Short<span className="text-green-400">ify</span>
        </h1>
        <p className="text-xl text-gray-700 mb-10">
          Transform long-form content into engaging short-form videos and summaries with AI
        </p>
        {/*feature grid*/}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {/*Feature 1*/}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Video className="h-6 w-6 text-blue-600"/>
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:shadow-lg hover:from-blue-400 hover:to-green-400 transition duration-300">
                <a href="/features/shorts-generator">Try Now</a>
              </button>
              </div>
              <h3 className="text-xl font-semibold mb-3">Youtube Shorts Generator</h3>
              <p className="text-gray-700">
              Automatically detects key moments in videos and creates concise, high-impact shorts of 15-60 seconds, perfect for social media platforms.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-grey-600">
                  <span className="bg-green-100 rounded-full p-1 mr-2">✓</span> Auto-Generated captions
                </li>
                <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Background music
                  </li>
                  <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Dynamic transitions
                  </li>
              </ul>
            </div>
            {/*feature 2*/}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Youtube className="h-6 w-6 text-red-600" />
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:shadow-lg hover:from-blue-400 hover:to-green-400 transition duration-300">
                <a href="/features/summarizer">Coming Soon</a>
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-3">YouTube Summarizer</h3>
              <p className="text-grey-600">
              Generates written or spoken summaries of YouTube videos, providing quick overviews without watching the entire content.
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-grey-600">
                  <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                  Key points extraction
                </li>
                <li className="flex items-center text-grey-600">
                <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                Time-stamped chapters
                </li>
                <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Audio summaries
                  </li>
              </ul>
            </div>
             {/* Feature 3 */}
             <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                 <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow hover:shadow-lg hover:from-blue-400 hover:to-green-400 transition duration-300">
                <a href="/features/pdf-summarizer">Coming Soon</a>
                </button>
                </div>
                <h3 className="text-xl font-semibold mb-3">PDF Summarizer</h3>
                <p className="text-grey-600">
                  Transforms documents into bite-sized, easy-to-digest information, perfect for users on the go.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Bullet-point summaries
                  </li>
                  <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Topic extraction
                  </li>
                  <li className="flex items-center text-grey-600">
                    <span className="bg-green-100 rounded-full p-1 mr-2">✓</span>
                    Visual infographics
                  </li>
                </ul>
            </div>
          </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your content?</h2>
          <button className="bg-gradient-to-r from-blue-500 to-green-500  hover:from-blue-400 hover:to-green-400 text-white font-bold py-3 px-8 rounded-full inline-flex items-center">
            <Zap className=" mr-2 h-5 w-5" />
            <a href="/shortify"> Get Started for Free</a>
          </button>
          <p className="mt-4 text-gray-600">Limited period only</p>
        </div>
      </div>
    </section>
  );
}
