import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, updateProfile, onAuthStateChanged } from "firebase/auth";
import {
  Home,
  Settings,
  User,
  Video,
  Lock,
  LogOut,
  Mail,
  Pencil,
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
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Wallet,
  Star,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import logo from '../assets/logo.png';

export default function EnhancedProfile() {
  // Authentication and user state
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  // User subscription data from API
  const [subscriptionType, setSubscriptionType] = useState("free");
  const [subscriptionStart, setSubscriptionStart] = useState(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [videoGenerationCount, setVideoGenerationCount] = useState(0);
  const [paymentId, setPaymentId] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();

  // Handle authentication state changes and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          navigate("/");
          return;
        }

        setUser(currentUser);
        setEmail(currentUser.email || "");

        // Set initial name from Firebase auth
        if (currentUser.displayName) {
          setName(currentUser.displayName);
        } else if (currentUser.email) {
          setName(currentUser.email.split("@")[0]);
        }

        // Fetch comprehensive user data from backend API
        await fetchUserData(currentUser);

        setLoading(false);
      } catch (err) {
        console.error("Error in auth state change:", err);
        setError("Failed to load profile information");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Fetch user data from multiple API endpoints
  const fetchUserData = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch subscription status
      try {
        const subscriptionResponse = await fetch("http://localhost:8000/payment/subscription-status", {
          headers
        });

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          setSubscriptionType(subscriptionData.subscription_type || "free");
          setVideoGenerationCount(subscriptionData.video_generation_count || 0);
          setPaymentId(subscriptionData.payment_id);

          if (subscriptionData.subscription_start) {
            setSubscriptionStart(new Date(subscriptionData.subscription_start));
          }
          if (subscriptionData.subscription_end) {
            setSubscriptionEnd(new Date(subscriptionData.subscription_end));
          }
        }
      } catch (err) {
        console.error("Error fetching subscription data:", err);
      }

      // Fetch user profile data
      try {
        const profileResponse = await fetch(`/api/users/${currentUser.uid}`, {
          headers
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.name) setName(profileData.name);
          if (profileData.bio) setBio(profileData.bio);
          if (profileData.preferences) {
            setNotifications(profileData.preferences.notifications ?? true);
            setAutoSave(profileData.preferences.autoSave ?? true);
            setTwoFactor(profileData.preferences.twoFactor ?? false);
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
      }

      // Fetch recent videos
      try {
        const videosResponse = await fetch("/api/videos/recent", {
          headers
        });

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setRecentVideos(videosData.videos || []);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      }

      // Fetch user statistics
      try {
        const statsResponse = await fetch("/api/users/stats", {
          headers
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats({
            totalVideos: statsData.total_videos || 0,
            storageUsed: statsData.storage_used || 0,
            accountAge: statsData.account_age_days || 0
          });
        }
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }

    } catch (apiError) {
      console.error("Error fetching comprehensive user data:", apiError);
      setError("Some profile data could not be loaded");
    }
  };

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
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      if (!user) {
        navigate("/");
        return;
      }

      // Update Firebase auth profile
      await updateProfile(user, {
        displayName: name
      });

      // Update user data via API
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          name,
          email: user.email,
          bio
        })
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setEditing(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out");
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${user.uid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });

        if (response.ok) {
          await user.delete();
          navigate("/");
        } else {
          throw new Error("Failed to delete account");
        }
      } catch (err) {
        console.error("Error deleting account:", err);
        setError("Failed to delete account. Please try again.");
        setLoading(false);
      }
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users/export-data", {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        setSuccess("Data export initiated. Download link will be sent to your email.");
      } else {
        throw new Error("Failed to export data");
      }
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = () => {
    navigate("/pricing");
  };

  const handleManageBilling = () => {
    navigate("/billing");
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  const handleToggle2FA = async () => {
    try {
      const newValue = !twoFactor;
      const response = await fetch("/api/users/two-factor", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ enabled: newValue })
      });

      if (response.ok) {
        setTwoFactor(newValue);
        setSuccess(`Two-factor authentication ${newValue ? 'enabled' : 'disabled'}!`);
      } else {
        throw new Error("Failed to update two-factor authentication");
      }
    } catch (err) {
      setError("Failed to update two-factor authentication");
    }
  };

  const handleDownloadVideo = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/download`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${videoId}.mp4`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess("Video downloaded successfully!");
      } else {
        throw new Error("Failed to download video");
      }
    } catch (err) {
      setError("Failed to download video");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        const response = await fetch(`/api/videos/${videoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });

        if (response.ok) {
          setRecentVideos(recentVideos.filter(video => video.id !== videoId));
          setSuccess("Video deleted successfully!");
        } else {
          throw new Error("Failed to delete video");
        }
      } catch (err) {
        setError("Failed to delete video");
      }
    }
  };

  const getSubscriptionBadge = () => {
    const badges = {
      premium: {
        icon: Crown,
        colors: "from-blue-500/20 to-purple-500/20 border-blue-500/30",
        textColor: "text-blue-300",
        label: "Premium"
      },
      pro: {
        icon: Sparkles,
        colors: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
        textColor: "text-purple-300",
        label: "Pro"
      },
      free: {
        icon: Shield,
        colors: "from-gray-500/20 to-gray-400/20 border-gray-500/30",
        textColor: "text-gray-300",
        label: "Free"
      }
    };

    const badge = badges[subscriptionType] || badges.free;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${badge.colors} shadow-lg`}>
        <Icon className="h-4 w-4" />
        <span className={`${badge.textColor} font-medium`}>{badge.label}</span>
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: User, description: "Personal Info", path: "/profile" },
    { id: "settings", label: "Settings", icon: Settings, description: "Preferences", path: "/settings" },
    { id: "security", label: "Security", icon: Lock, description: "Privacy & Safety", path: "/security" },
    { id: "billing", label: "Billing", icon: CreditCard, description: "Payments", path: "/pricing" },
  ];


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading your profile...</p>
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
              <a href="/" ><div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <img src={logo} alt="Logo" />
              </div> </a>
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
                const isActive = item.id === "profile";
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`block w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${activeTab === item.id
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 shadow-2xl shadow-cyan-500/10"
                      : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 hover:shadow-lg"
                      }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`p-3 rounded-xl transition-all duration-300 ${activeTab === item.id ? "bg-white/20 shadow-lg" : "bg-slate-700 group-hover:bg-slate-600"
                          }`}
                      >
                        <Icon size={20} className={activeTab === item.id ? "text-white" : "text-slate-300"} />
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold ${activeTab === item.id ? "text-white" : "text-slate-300"}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-30" />
                    )}
                  </Link>

                );
              })}
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
              <a href="/" ><div className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600">
                <Home size={18} className="text-gray-300" />
              </div> </a>
              <div className="flex-1" />
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl">
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
              Profile Settings
            </h1>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-lg">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-sm text-emerald-400 font-semibold">ONLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300 font-medium">Real-time</span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
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

            {/* Profile Header Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 relative z-10">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-4xl shadow-2xl shadow-cyan-500/20">
                    {name
                      ? name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                      : "U"}
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 group-hover:scale-110">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-4xl font-bold text-white">{name}</h2>
                    {getSubscriptionBadge()}
                  </div>
                  <p className="text-slate-400 flex items-center gap-2">
                    <Mail size={16} /> {email}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={14} />
                    Member since {formatDate(subscriptionStart)}
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Edit3 size={16} />
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Profile Form */}
              <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Personal Information</h3>
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!editing}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!editing}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
                      >
                        {updating ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Info */}
              <div className="space-y-6">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-2xl">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-cyan-400" />
                    Subscription
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Plan</span>
                      <span className="text-white font-semibold capitalize">{subscriptionType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Videos Generated</span>
                      <span className="text-cyan-400 font-bold">{videoGenerationCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Expires</span>
                      <span className="text-white font-medium">{formatDate(subscriptionEnd)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 shadow-2xl">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-cyan-400" />
                    Payment Info
                  </h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-700/50 rounded-xl">
                      <p className="text-sm text-slate-400 mb-1">Payment ID</p>
                      <p className="text-white font-mono text-xs break-all">{paymentId}</p>
                    </div>
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                      Manage Billing
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}