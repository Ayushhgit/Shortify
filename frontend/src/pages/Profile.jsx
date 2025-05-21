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
} from "lucide-react";
import { Link } from "react-router-dom";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Profile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const auth = getAuth();
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [user, loading, error] = useAuthState(auth);
        
        if (!user) {
          // No user is signed in, redirect to home
          navigate("/");
          return;
        }

        // Set email from auth
        setEmail(user.email || "");
        
        // Set display name from auth
        if (user.displayName) {
          setName(user.displayName);
        }

        // Try to fetch additional user data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Only set bio from Firestore
          if (userData.bio) setBio(userData.bio);
          // If name wasn't set from auth, try to get it from Firestore
          if (!user.displayName && userData.name) setName(userData.name);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
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
      const [user, loading, error] = useAuthState(auth);
      
      if (!user) {
        navigate("/");
        return;
      }
      
      // Update display name in Firebase Auth
      await updateProfile(user, {
        displayName: name
      });
      
      // Update additional info in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        name,
        bio,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="h-10 w-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

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
            <Link to="/profile">
              <button className="p-2 rounded-full bg-indigo-100 border-2 border-indigo-500 transition">
                <User className="h-5 w-5 text-indigo-600" />
              </button>
            </Link>

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
              <Link to="/profile" className="block">
                <button className="flex items-center w-full gap-3 text-sm text-indigo-600 font-medium transition">
                  <User size={18} />
                  Profile
                </button>
              </Link>
              <Link to="/Settings" className="block">
                <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-indigo-600 transition mb-4">
                  <Settings size={18} />
                  Settings
                </button>
              </Link>
              <button className="flex items-center w-full gap-3 text-sm text-gray-700 hover:text-indigo-600 transition">
                <Lock size={18} />
                Security
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full gap-3 text-sm text-red-500 hover:text-red-600 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </aside>

          {/* Profile Details */}
          <section className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

            {/* Status Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-8">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                {name
                  ? name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "U"}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{name || "User"}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail size={14} /> {email || "No email provided"}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button 
                type="submit"
                disabled={updating}
                className="inline-flex items-center px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition disabled:opacity-70"
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
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center w-full">
          <p className="text-sm text-gray-600">&copy; 2025 Shortify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}