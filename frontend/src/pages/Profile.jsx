import React, { useState } from "react";
import {
  Home,
  Settings,
  User,
  Video,
  Lock,
  LogOut,
  Mail,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Profile() {
  const [name, setName] = useState("Ayush Raj");
  const [bio, setBio] = useState("Full Stack Developer | AI Enthusiast");
  const [email] = useState("ajx@example.com");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-indigo-500 mr-2" />
            <span className="text-xl font-bold text-gray-900">
              Short<span className="text-indigo-500">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <Link to="/">
              <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
                <Home className="h-5 w-5 text-gray-600" />
              </button>
            </Link>

            {/* Profile Button */}
            <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
              <User className="h-5 w-5 text-gray-600" />
            </button>

            {/* Settings Button */}
            <Link to="/Settings">
                <button className="p-2 rounded-full hover:bg-indigo-100 hover:border-2 border-bold transition">
                    <Settings className="h-5 w-5 text-gray-600" />
                </button>
             </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-fit">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account</h3>
            <nav className="space-y-3">
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-indigo-600 transition">
                <User size={18} />
                Profile
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-indigo-600 transition">
                <Settings size={18} />
                Settings
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-indigo-600 transition">
                <Lock size={18} />
                Security
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-red-500 hover:text-red-600 transition">
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </aside>

          {/* Profile Details */}
          <section className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail size={14} /> {email}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button className="inline-flex items-center px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                <Pencil size={16} className="mr-2" />
                Update Profile
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white flex items-center border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center w-full">
          <p className="text-sm text-gray-600">&copy; 2025 Shortify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
