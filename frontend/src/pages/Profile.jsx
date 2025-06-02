import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAuth, signOut, updateProfile, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);
  
  // User subscription data
  const [subscriptionType, setSubscriptionType] = useState("free");
  const [subscriptionStart, setSubscriptionStart] = useState(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);
  const [videoGenerationCount, setVideoGenerationCount] = useState(0);
  const [paymentId, setPaymentId] = useState(null);

  const auth = getAuth();
  const navigate = useNavigate();

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (!currentUser) {
          navigate("/");
          return;
        }

        setUser(currentUser);
        setEmail(currentUser.email || "");
        
        if (currentUser.displayName) {
          setName(currentUser.displayName);
        } else if (currentUser.email) {
          setName(currentUser.email.split("@")[0]);
        }

        // Fetch user data from backend API (replace with your actual API endpoint)
        try {
          const response = await fetch("http://localhost:8000/payment/subscription-status", {
            headers: {
              'Authorization': `Bearer ${await currentUser.getIdToken()}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setSubscriptionType(userData.subscription_type || "free");
            setVideoGenerationCount(userData.video_generation_count || 0);
            setPaymentId(userData.payment_id);
            
            if (userData.subscription_start) {
              setSubscriptionStart(new Date(userData.subscription_start));
            }
            if (userData.subscription_end) {
              setSubscriptionEnd(new Date(userData.subscription_end));
            }
            if (userData.name) setName(userData.name);
          }
        } catch (apiError) {
          console.error("Error fetching user data from API:", apiError);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error in auth state change:", err);
        setError("Failed to load profile information");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Error signing out:", err);
      setError("Failed to sign out");
    }
  };

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
      
      await updateProfile(user, {
        displayName: name
      });
      
      // Update user data via API
      try {
        const response = await fetch(`/api/users/${user.uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            name,
            email: user.email
          })
        });
        
        if (response.ok) {
          setSuccess("Profile updated successfully!");
        } else {
          setSuccess("Profile updated successfully! (Note: Some data may not sync to cloud storage)");
        }
      } catch (apiError) {
        console.error("Error updating via API:", apiError);
        setSuccess("Profile updated successfully! (Note: Some data may not sync to cloud storage)");
      }
      
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const getSubscriptionBadge = () => {
    switch (subscriptionType) {
      case "premium":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <Crown className="h-4 w-4 text-blue-400" />
            <span className="text-blue-300 font-medium">Premium</span>
          </div>
        );
      case "pro":
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 font-medium">Pro</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-gray-500/20 to-gray-400/20 border border-gray-500/30">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300 font-medium">Free</span>
          </div>
        );
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-7xl rounded-full bg-gray-900/80 backdrop-blur-lg shadow-2xl border border-gray-800 px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-blue-500 mr-2" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Short<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ify</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <button className="p-2 rounded-full hover:bg-gray-800 hover:border-2 hover:border-gray-600 transition">
                <Home className="h-5 w-5 text-gray-300" />
              </button>
            </Link>
            <Link to="/Profile">
              <button className="p-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 transition">
                <User className="h-5 w-5 text-blue-400" />
              </button>
            </Link>
            <Link to="/Settings">
              <button className="p-2 rounded-full hover:bg-gray-800 hover:border-2 hover:border-gray-600 transition">
                <Settings className="h-5 w-5 text-gray-300" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar */}
          <aside className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl h-fit">
            <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
            <nav className="space-y-3">
              <Link to="/Profile" className="block">
                <button className="flex items-center w-full gap-3 text-sm text-blue-400 font-medium transition">
                  <User size={18} />
                  Profile
                </button>
              </Link>
              <Link to="/Settings" className="block">
                <button className="flex items-center w-full gap-3 text-sm text-gray-300 hover:text-blue-400 transition mb-4">
                  <Settings size={18} />
                  Settings
                </button>
              </Link>
              <button className="flex items-center w-full gap-3 text-sm text-gray-300 hover:text-blue-400 transition">
                <Lock size={18} />
                Security
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full gap-3 text-sm text-red-400 hover:text-red-300 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </aside>

          {/* Profile Details */}
          <section className="lg:col-span-3 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>

            {/* Status Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg">
                {success}
              </div>
            )}

            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-5 mb-8">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-2xl">
                {name
                  ? name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">{name || "User"}</h3>
                  {getSubscriptionBadge()}
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Mail size={14} /> {email || "No email provided"}
                </p>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="mb-8 p-4 bg-gray-800/50 rounded-xl border border-gray-600">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                Subscription Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Plan Type</p>
                  <p className="text-white font-medium capitalize">{subscriptionType}</p>
                </div>
                
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Started
                  </p>
                  <p className="text-white font-medium">{formatDate(subscriptionStart)}</p>
                </div>
                
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires
                  </p>
                  <p className="text-white font-medium">{formatDate(subscriptionEnd)}</p>
                </div>
                
                <div className="bg-gray-700/30 p-3 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Videos Generated</p>
                  <p className="text-white font-medium">{videoGenerationCount}</p>
                </div>
                
                {paymentId && (
                  <div className="bg-gray-700/30 p-3 rounded-lg md:col-span-2">
                    <p className="text-sm text-gray-400 mb-1">Payment ID</p>
                    <p className="text-white font-medium font-mono text-xs">{paymentId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={updating}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {updating ? (
                  <>
                    <Loader size={16} className="animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil size={16} className="mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/50 border-t border-gray-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center w-full">
          <p className="text-sm text-gray-400">&copy; 2025 Shortify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}