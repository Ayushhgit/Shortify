import React, { useState } from 'react';
import { Mail, X, ChevronRight, Lock } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import Toast from './Toast';

export default function LoginModal({ onClose, onSwitchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const hideToast = () => {
    setToast({ show: false, message: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // You might want to send this to your backend to validate the session
      await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email,
          uid: userCredential.user.uid,
        }),
      });

      showToast("✅ Successfully logged in!");
      setTimeout(() => {
        setEmail('');
        setPassword('');
        onClose();
      }, 1500);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get user token
      const token = await user.getIdToken();
      
      // Send to backend
      await fetch("http://localhost:8000/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.displayName || '',
          email: user.email,
          uid: user.uid,
        }),
      });
      
      showToast("✅ Successfully signed in with Google!");
      setTimeout(onClose, 1500);
    } catch (err) {
      showToast(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Welcome back
        </h2>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-base mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
              <div className="absolute left-4 top-3.5">
                <Mail size={20} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 text-base mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
              <div className="absolute left-4 top-3.5">
                <Lock size={20} className="text-gray-400" />
              </div>
            </div>
            <div className="flex justify-end mt-1">
              <a href="#" className="text-sm text-blue-500 hover:underline">Forgot password?</a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
          Continue with Google
        </button>

        <div className="text-center mt-5">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={onSwitchToSignUp}
              className="text-blue-500 font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-5" />
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-gray-500 font-medium hover:text-gray-700 flex items-center justify-center mx-auto"
          >
            Skip for now
            <ChevronRight size={20} className="ml-1" />
          </button>
        </div>
      </div>
      
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={hideToast} 
      />
    </div>
  );
}