import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Settings,
  User,
  Video,
  Lock,
  LogOut,
  Mail,
  Loader,
  Crown,
  Calendar,
  CreditCard,
  Shield,
  Sparkles,
  Camera,
  Edit3,
  Save,
  X,
  Activity,
  Brain,
  Github,
  Menu,
  Bell,
  Globe,
  Moon,
  Sun,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Check,
  Trash2,
  Download,
  Upload,
  Key,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png';

export default function EnhancedSettings() {
  // Authentication and user state (mock data for demonstration)
  const [user, setUser] = useState({
    uid: "mock-user-id",
    email: "user@example.com",
    displayName: "John Doe"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Settings State
  const [darkMode, setDarkMode] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC-5 (EST)");
  const [privacy, setPrivacy] = useState("Public");
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Refs for scrolling to sections
  const generalRef = useRef(null);
  const notificationsRef = useRef(null);
  const privacyRef = useRef(null);
  const accountRef = useRef(null);

  const navigate = useNavigate();

  // Mouse tracking for background effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handlers
  const handleSaveSettings = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const settings = {
        darkMode,
        emailNotifications,
        appNotifications,
        pushNotifications,
        soundNotifications,
        language,
        timezone,
        privacy,
        twoFactor,
        autoSave,
        dataCollection,
        marketingEmails
      };

      console.log("Saving settings:", settings);
      setSuccess("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      // Simulate account deletion
      setTimeout(() => {
        navigate("/");
      }, 2000);
    }
  };

  const handleExportData = () => {
    setSuccess("Data export initiated. Download link will be sent to your email.");
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: User, description: "Personal Info", path: "/profile" },
    { id: "settings", label: "Settings", icon: Settings, description: "Preferences", path: "/settings" },
    { id: "security", label: "Security", icon: Lock, description: "Privacy & Safety", path: "/security" },
    { id: "billing", label: "Billing", icon: CreditCard, description: "Payments", path: "/pricing" },
  ];

  const ToggleSwitch = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <button onClick={onToggle} className="focus:outline-none">
        {enabled ? (
          <ToggleRight className="h-8 w-8 text-cyan-400" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-slate-500" />
        )}
      </button>
    </div>
  );

  if (loading && !success && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Dynamic Mesh Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 15,
            top: mousePosition.y / 15,
            transition: "all 0.3s ease-out",
          }}
        />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700 hover:border-cyan-400/50 transition-all duration-300"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Enhanced Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 fixed lg:relative z-40 w-80 h-full transition-all duration-300 ease-in-out`}
      >
        <div className="h-full bg-gray-950/98 backdrop-blur-xl border-r border-gray-900 flex flex-col relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />

          {/* Logo Section */}
          <div className="p-8 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <a href="/">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <img src={logo} alt="Logo" />
                </div>
              </a>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Shortify
                </h1>
                <p className="text-xs text-slate-400 font-medium">AI-Powered Intelligence</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === "settings";
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`block w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 shadow-2xl shadow-cyan-500/10"
                        : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          isActive ? "bg-white/20 shadow-lg" : "bg-slate-700 group-hover:bg-slate-600"
                        }`}
                      >
                        <Icon size={20} className={isActive ? "text-white" : "text-slate-300"} />
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold ${isActive ? "text-white" : "text-slate-300"}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Settings Navigation */}
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-3">Quick Access</h3>
              <button
                onClick={() => scrollToSection(generalRef)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                <Settings size={16} />
                General
              </button>
              <button
                onClick={() => scrollToSection(notificationsRef)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                <Bell size={16} />
                Notifications
              </button>
              <button
                onClick={() => scrollToSection(privacyRef)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                <Shield size={16} />
                Privacy
              </button>
              <button
                onClick={() => scrollToSection(accountRef)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                <Lock size={16} />
                Account
              </button>
            </div>
          </div>

          {/* User Section */}
          <div className="p-6 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <a
                href="https://github.com/Ayushhgit"
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600"
              >
                <Github size={18} className="text-gray-300" />
              </a>
              <a href="/">
                <div className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600">
                  <Home size={18} className="text-gray-300" />
                </div>
              </a>
              <div className="flex-1" />
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <LogOut size={16} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Enhanced Header */}
        <div className="h-24 flex-shrink-0 flex items-center justify-between px-8 bg-gray-950/95 backdrop-blur-xl border-b border-gray-900/70">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Settings & Preferences
            </h1>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-lg">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-sm text-emerald-400 font-semibold">ONLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300 font-medium">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl backdrop-blur-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl backdrop-blur-sm">
                {success}
              </div>
            )}

            {/* General Settings */}
            <div ref={generalRef} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-bold text-white">General Settings</h3>
                </div>
                <Monitor className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-6 relative z-10">
                <ToggleSwitch
                  enabled={darkMode}
                  onToggle={() => setDarkMode(!darkMode)}
                  label="Dark Mode"
                  description="Toggle between light and dark themes"
                />

                <ToggleSwitch
                  enabled={autoSave}
                  onToggle={() => setAutoSave(!autoSave)}
                  label="Auto Save"
                  description="Automatically save your work as you type"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="UTC-5 (EST)">UTC-5 (EST)</option>
                      <option value="UTC-8 (PST)">UTC-8 (PST)</option>
                      <option value="UTC+0 (GMT)">UTC+0 (GMT)</option>
                      <option value="UTC+1 (CET)">UTC+1 (CET)</option>
                      <option value="UTC+9 (JST)">UTC+9 (JST)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Settings */}
            <div ref={notificationsRef} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-purple-400" />
                  <h3 className="text-2xl font-bold text-white">Notification Preferences</h3>
                </div>
                <Smartphone className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-6 relative z-10">
                <ToggleSwitch
                  enabled={emailNotifications}
                  onToggle={() => setEmailNotifications(!emailNotifications)}
                  label="Email Notifications"
                  description="Receive updates and alerts via email"
                />

                <ToggleSwitch
                  enabled={appNotifications}
                  onToggle={() => setAppNotifications(!appNotifications)}
                  label="In-App Notifications"
                  description="Show notifications while using the application"
                />

                <ToggleSwitch
                  enabled={pushNotifications}
                  onToggle={() => setPushNotifications(!pushNotifications)}
                  label="Push Notifications"
                  description="Receive push notifications on your device"
                />

                <ToggleSwitch
                  enabled={soundNotifications}
                  onToggle={() => setSoundNotifications(!soundNotifications)}
                  label="Sound Notifications"
                  description="Play sounds for notifications and alerts"
                />

                <ToggleSwitch
                  enabled={marketingEmails}
                  onToggle={() => setMarketingEmails(!marketingEmails)}
                  label="Marketing Emails"
                  description="Receive promotional emails and product updates"
                />
              </div>
            </div>

            {/* Privacy & Security Settings */}
            <div ref={privacyRef} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-2xl font-bold text-white">Privacy & Security</h3>
                </div>
                <Lock className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content Visibility
                  </label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="Public">Public - Anyone can see your content</option>
                    <option value="Friends">Friends - Only connections can see your content</option>
                    <option value="Private">Private - Only you can see your content</option>
                  </select>
                </div>

                <ToggleSwitch
                  enabled={twoFactor}
                  onToggle={() => setTwoFactor(!twoFactor)}
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                />

                <ToggleSwitch
                  enabled={dataCollection}
                  onToggle={() => setDataCollection(!dataCollection)}
                  label="Data Collection"
                  description="Allow us to collect anonymous usage data to improve our service"
                />
              </div>
            </div>

            {/* Account Management */}
            <div ref={accountRef} className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 pointer-events-none" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-red-400" />
                  <h3 className="text-2xl font-bold text-white">Account Management</h3>
                </div>
                <User className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-3 p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-300"
                  >
                    <Download className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-medium">Export Data</span>
                  </button>

                  <button
                    onClick={() => navigate("/change-password")}
                    className="flex items-center justify-center gap-3 p-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl transition-all duration-300"
                  >
                    <Lock className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-300 font-medium">Change Password</span>
                  </button>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <h4 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h4>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-3 p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all duration-300 text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Delete Account</span>
                  </button>
                  <p className="text-sm text-slate-400 mt-2">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-12 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}