import { useState } from 'react';
import logo from '../assets/logo.png';
import { FaGithub } from "react-icons/fa";
import yt from '../assets/yt.webp';
import summary from '../assets/summary.jpg';
import notes from '../assets/notes.jpg';
import SignUpModal from '../components/SignUpModal';
import { Home, Youtube, Video, FileText, Zap } from 'lucide-react';

export default function ShortifyPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Dashboard';
      case 'shorts':
        return 'Shorts Generator';
      case 'summarizer':
        return 'YouTube Summarizer';
      case 'pdf':
        return 'PDF Summarizer';
      default:
        return 'Shortify';
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 flex flex-col items-center py-6">
        <div className="mb-8 px-5">
          <a href='/'><img src={logo} alt="Logo" /></a>
        </div>
        <div className="flex flex-col gap-6 items-center">
          <button className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'home' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('home')}><Home size={24} /></button>
          <button className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'shorts' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('shorts')}><Youtube size={24} /></button>
          <button className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'summarizer' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('summarizer')}><Video size={24} /></button>
          <button className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'pdf' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setActiveTab('pdf')}><FileText size={24} /></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-18 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold">{getTitle()}</h1>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Ayushhgit" className="text-gray-500 hover:text-gray-700"><FaGithub size={20} /></a>
            <button onClick={openModal} className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-1">
              <span className="font-medium">Login</span>
              <Zap />
            </button>
            {isModalOpen && <SignUpModal onClose={closeModal} />}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-10 overflow-auto">
          {/* Dashboard */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[{
                title: "YouTube Shorts Generator",
                img: yt,
                desc: "Automatically detects key moments in videos and creates concise, high-impact shorts of 15-60 seconds.",
                link: "/features/shorts-generator",
                label: "Get Started",
                id: "shorts-card"
              }, {
                title: "YouTube Summarizer",
                img: summary,
                desc: "Generates summaries of YouTube videos, giving quick overviews.",
                link: "/features/summarizer",
                label: "Coming Soon",
                id: "summarizer-card"
              }, {
                title: "PDF Summarizer",
                img: notes,
                desc: "Transforms PDFs into digestible notes quickly and easily.",
                link: "/features/pdf-summarizer",
                label: "Coming Soon",
                id: "pdf-card"
              }].map(({ title, img, desc, link, label, id }) => (
                <div key={id} className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="mb-4 h-48 bg-gray-200 rounded-lg overflow-hidden">
                      <img src={img} alt={title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-gray-600 mb-4">{desc}</p>
                  </div>
                  <div className="flex justify-center">
                    <a href={link}>
                      <button className="text-white bg-gradient-to-r from-blue-500 to-green-500 py-2 px-6 rounded-full hover:from-blue-400 hover:to-green-400">{label}</button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Shorts Tutorial */}
          {activeTab === 'shorts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-blue-600">🎬 YouTube Shorts Generator</h2>
              <p className="text-gray-700 text-lg">Turn long YouTube videos into bite-sized Shorts that boost engagement and save editing time.</p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> Use Case:</h3>
                <p className="text-gray-600">Ideal for content creators who want to repurpose long-form content into short videos for platforms like YouTube Shorts, Instagram Reels, or TikTok.</p>
              </div>
              <div className="bg-blue-100 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> How to Use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Paste your YouTube video URL into the input field.</li>
                  <li>Click <strong>"Generate Shorts"</strong>.</li>
                  <li>The system detects highlights and creates 15–60 sec clips.</li>
                  <li>You can preview, download, or directly post the clips.</li>
                </ol>
              </div>
              <div className="flex justify-center">
                <a href="/features/shorts-generator">
                  <button className="mt-4 text-white bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 px-7 rounded-full hover:from-blue-400 hover:to-green-400">Get Started</button>
                </a>
              </div>
            </div>
          )}

          {/* Summarizer Tutorial */}
          {activeTab === 'summarizer' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-purple-600">📺 YouTube Summarizer</h2>
              <p className="text-gray-700 text-lg">Save hours by reading concise summaries of YouTube videos—perfect for research, learning, or reviews.</p>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> Use Case:</h3>
                <p className="text-gray-600">Great for students, researchers, and professionals who want to extract value from long videos without watching them entirely.</p>
              </div>
              <div className="bg-purple-100 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> How to Use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Paste a YouTube video link in the input field.</li>
                  <li>Click <strong>"Summarize Video"</strong>.</li>
                  <li>A detailed summary will be generated based on the video transcript.</li>
                  <li>You can copy or download the summary.</li>
                </ol>
              </div>
              <div className="flex justify-center">
                <a href="/features/summarizer">
                  <button className="mt-4 text-white bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 px-7 rounded-full hover:from-purple-400 hover:to-pink-400">Coming Soon</button>
                </a>
              </div>
            </div>
          )}

          {/* PDF Tutorial */}
          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-green-600">📄 PDF Summarizer</h2>
              <p className="text-gray-700 text-lg">Summarize lengthy research papers, reports, or notes into digestible key points quickly.</p>
              <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> Use Case:</h3>
                <p className="text-gray-600">Perfect for students, educators, and analysts to quickly understand documents without reading every word.</p>
              </div>
              <div className="bg-green-100 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2"> How to Use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>Upload your PDF file.</li>
                  <li>Click <strong>"Summarize PDF"</strong>.</li>
                  <li>The tool will extract and condense the main points.</li>
                  <li>You can copy or save the summary.</li>
                </ol>
              </div>
              <div className="flex justify-center">
                <a href="/features/pdf-summarizer">
                  <button className="mt-4 text-white bg-gradient-to-r from-green-500 to-blue-500 py-2.5 px-7 rounded-full hover:from-green-400 hover:to-blue-400">Coming Soon</button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 flex-shrink-0 flex items-center justify-center border-t border-gray-200 text-sm text-gray-500">
          Shortify © 2025. All rights reserved.
        </div>
      </div>
    </div>
  );
}
