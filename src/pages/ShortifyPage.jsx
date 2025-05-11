import { useState } from 'react';
import logo from '../assets/logo.png'
import { FaGithub } from "react-icons/fa";
import yt from '../assets/yt.webp'
import summary from '../assets/summary.jpg'
import notes from '../assets/notes.jpg'
import SignUpModal from '../components/SignUpModal';
import { Home, Youtube, Video, FileText, Zap } from 'lucide-react';

export default function ShortifyPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 flex flex-col items-center py-6">
        {/* Logo */}
        <div className="mb-8 px-5 ">
          <a href='/'> <img src={logo} alt="Logo" /> </a> 
        </div>
        
        {/* Nav Items */}
        <div className="flex flex-col gap-6 items-center">
          <button 
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'home' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={24} />
          </button>
          
          <button 
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'files' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('files')}
          >
            <Youtube size={24} />
          </button>
          
          <button 
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'videos' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('videos')}
          >
            <Video size={24} />
          </button>
          
          <button 
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${activeTab === 'copy' ? 'text-blue-600 bg-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('copy')}
          >
            <FileText size={24} />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Short<span className=' text-xl font-semibold text-green-400'>ify</span></h1>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Ayushhgit" className="text-gray-500 hover:text-gray-700">
              <FaGithub size={20} />
            </a>
            <button  onClick={openModal} className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center gap-1">
              <span className="font-medium">Login</span>
              <Zap/>
            </button>
            {isModalOpen && <SignUpModal onClose={closeModal} />}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="mb-4 h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img src={yt} alt="Shorts" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Youtube Shorts Generator</h3>
              <p className="text-gray-600 mb-4">Automatically detects key moments in videos and creates concise, high-impact shorts of 15-60 seconds, perfect for social media platforms.</p>
             <a href='/features/shorts-generator'><button className="text-white bg-gradient-to-r from-blue-500 to-green-500 w-full py-3 border border-pink-100 rounded-lg text-center hover:from-blue-400 hover:to-green-400 transition-colors">
                Get Started
              </button> </a> 
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="mb-4 h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img src={summary} alt="YT" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold mb-2">YouTube Summarizer</h3>
              <p className="text-gray-600 mb-4">Generates written or spoken summaries of YouTube videos, providing quick overviews without watching the entire content.</p>
              <a href="/features/summarizer"><button className="text-white bg-gradient-to-r from-blue-500 to-green-500 w-full py-3 border border-pink-100 rounded-lg text-center hover:from-blue-400 hover:to-green-400 transition-colors">
                Comming Soon
              </button> </a>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="mb-4 h-32 bg-gray-200 rounded-lg overflow-hidden">
                <img src={notes} alt="PDF " className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-semibold mb-2">PDF Summarizer</h3>
              <p className="text-gray-600 mb-4">Transforms documents into bite-sized, easy-to-digest information, perfect for users on the go. Easy to use and with it's help, easier to understand.</p>
             <a href="/features/pdf-summarizer"> <button className="text-white bg-gradient-to-r from-blue-500 to-green-500 w-full py-3 border border-pink-100 rounded-lg text-center hover:from-blue-400 hover:to-green-400 transition-colors">
                Comming soon
              </button> </a>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="h-12 flex-shrink-0 flex items-center justify-center border-t border-gray-200 text-sm text-gray-500">
          Shortify © 2025. All rights reserved.
        </div>
      </div>
    </div>
  );
}