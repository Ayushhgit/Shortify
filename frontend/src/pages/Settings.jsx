import React, { useState } from "react";
import {
  Home,
  Settings as SettingsIcon,
  User,
  Video,
  Bell,
  Globe,
  Moon,
  Sun,
  Shield,
  Lock,
  LogOut,
  Save,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Settings() {
  // State for settings
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [privacy, setPrivacy] = useState("Public");
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Toggle functions
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleEmailNotifications = () => setEmailNotifications(!emailNotifications);
  const toggleAppNotifications = () => setAppNotifications(!appNotifications);

  // Handle language change
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  // Handle privacy change
  const handlePrivacyChange = (e) => {
    setPrivacy(e.target.value);
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // You would implement actual saving logic here
    setShowSuccessToast(true);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-white/70 backdrop-blur-lg shadow-xl border border-gray-200 px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-400 mr-2" />
            <span className="text-xl font-bold text-gray-900">
              Short<span className="text-green-400">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <Link to="/">
              <button className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition">
                <Home className="h-5 w-5 text-gray-600" />
              </button>
            </Link>

            {/* Profile Button */}
            <Link to="/profile">
              <button className="p-2 rounded-full hover:bg-green-100 hover:border-2 border-bold transition">
                <User className="h-5 w-5 text-gray-600" />
              </button>
            </Link>

            {/* Settings Button - Active */}
            <button className="p-2 rounded-full bg-green-100 border-2 border-green-500 transition">
              <SettingsIcon className="h-5 w-5 text-green-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-fit">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
            <nav className="space-y-3">
              <button className="flex items-center w-full gap-3 text-sm text-green-600 font-medium transition">
                <SettingsIcon size={18} />
                General
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-green-600 transition">
                <Bell size={18} />
                Notifications
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-green-600 transition">
                <Shield size={18} />
                Privacy
              </button>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-green-600 transition">
                <Lock size={18} />
                Security
              </button>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <button className="flex items-center w-full gap-3 text-sm text-red-500 hover:text-red-600 transition">
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </nav>
          </aside>

          {/* Settings Content */}
          <section className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
              <p className="text-sm text-gray-600">Configure your application preferences</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Appearance Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {darkMode ? <Moon className="h-5 w-5 text-green-600 mr-3" /> : <Sun className="h-5 w-5 text-green-600 mr-3" />}
                    <div>
                      <p className="font-medium text-gray-900">Dark Mode</p>
                      <p className="text-sm text-gray-600">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <button onClick={toggleDarkMode} className="focus:outline-none">
                    {darkMode ? <ToggleRight className="h-8 w-8 text-green-600" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Language Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Globe className="h-5 w-5 text-green-600 mr-3" />
                    <p className="font-medium text-gray-900">Select Language</p>
                  </div>
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates and alerts via email</p>
                    </div>
                    <button onClick={toggleEmailNotifications} className="focus:outline-none">
                      {emailNotifications ? <ToggleRight className="h-8 w-8 text-green-600" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">App Notifications</p>
                      <p className="text-sm text-gray-600">Receive in-app notifications and alerts</p>
                    </div>
                    <button onClick={toggleAppNotifications} className="focus:outline-none">
                      {appNotifications ? <ToggleRight className="h-8 w-8 text-green-600" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Shield className="h-5 w-5 text-green-600 mr-3" />
                    <p className="font-medium text-gray-900">Content Visibility</p>
                  </div>
                  <select
                    value={privacy}
                    onChange={handlePrivacyChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Public">Public - Anyone can see your content</option>
                    <option value="Friends">Friends - Only connections can see your content</option>
                    <option value="Private">Private - Only you can see your content</option>
                  </select>
                </div>
              </div>

              {/* Account Actions */}
              <div className="flex items-center pt-4 border-t border-gray-200">
                <button 
                  onClick={handleSaveSettings}
                  className="bg-gradient-to-r from-green-500 to-green-500 hover:from-green-400 hover:to-green-400 text-white px-6 py-3 rounded-lg flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </button>
                
                <Link to="/profile" className="ml-4 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </Link>
              </div>
              
              {/* Advanced Settings Link */}
              <div className="mt-6">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg text-gray-700 hover:bg-green-50 transition">
                  <span className="font-medium">Advanced Settings</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
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

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center shadow-lg">
            <Check className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-sm font-medium text-green-800">Settings updated successfully!</p>
          </div>
        </div>
      )}
    </div>
  );
}
