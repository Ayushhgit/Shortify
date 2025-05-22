import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, X, ChevronRight, Lock, AtSign } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import Toast from './Toast';

export default function AuthModalSystem({ onClose, initialMode = 'signup', onAuthSuccess }) {
  // Core state
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  
  // Verification state
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [verificationInterval, setVerificationInterval] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);

  // Cleanup intervals on unmount or mode change
  useEffect(() => {
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  // Clear verification when switching modes
  useEffect(() => {
    if (!['verify', 'verified'].includes(mode) && verificationInterval) {
      clearInterval(verificationInterval);
      setVerificationInterval(null);
      setVerificationTimer(0);
      setPendingUser(null);
    }
  }, [mode, verificationInterval]);

  // Toast management
  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'info' });
  }, []);

  // Form data management
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'username' 
        ? value.toLowerCase().replace(/[^a-z0-9_]/g, '') 
        : value
    }));
  }, []);

  // Backend API calls
  const sendUserToBackend = async (userData, endpoint = '/api/auth/firebase') => {
    const token = await userData.user.getIdToken();
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: userData.name,
        username: userData.username,
        password: userData.password,
        email: userData.email,
        uid: userData.user.uid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return response.json();
  };

  // Email verification checker
  const startVerificationCheck = useCallback((user, userData) => {
    setPendingUser({ user, userData });
    let countdown = 60;
    setVerificationTimer(countdown);

    const interval = setInterval(async () => {
      try {
        await user.reload();
        
        if (user.emailVerified) {
          clearInterval(interval);
          setVerificationInterval(null);
          setVerificationTimer(0);
          
          // Send to backend to create user account
          await sendUserToBackend(userData);
          
          // Switch to verified success mode
          setMode('verified');
          
          showToast("✅ Email verified successfully!", 'success');
          return;
        }

        // Update countdown
        countdown--;
        setVerificationTimer(countdown);

        // Stop checking after countdown reaches 0
        if (countdown <= 0) {
          clearInterval(interval);
          setVerificationInterval(null);
          setVerificationTimer(0);
        }
      } catch (err) {
        console.error("Error checking verification:", err);
        // Continue checking even if there's an error
      }
    }, 3000);

    setVerificationInterval(interval);
  }, [showToast]);

  // Sign up handler
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showToast("❌ Please fill in all fields", 'error');
      return;
    }

    if (formData.username.length < 3) {
      showToast("❌ Username must be at least 3 characters", 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(userCredential.user);
      
      const userData = {
        user: userCredential.user,
        name: formData.name,
        username: formData.username,
        email: formData.email
      };

      setMode('verify');
      startVerificationCheck(userCredential.user, userData);
      
      showToast("📧 Verification email sent! Please check your inbox.", 'info');
      
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      showToast("❌ Please fill in all fields", 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      if (!userCredential.user.emailVerified) {
        showToast("❌ Please verify your email before logging in", 'error');
        setLoading(false);
        return;
      }

      const token = await userCredential.user.getIdToken();
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          uid: userCredential.user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const backendUserData = await response.json();
      const userData = {
        user: userCredential.user,
        ...backendUserData
      };

      showToast("✅ Successfully logged in!", 'success');
      
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      }

      setTimeout(() => {
        setFormData({ name: '', username: '', email: '', password: '' });
        onClose();
      }, 1500);

    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const generatedUsername = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 
                               user.displayName?.toLowerCase().replace(/[^a-z0-9_]/g, '') || 
                               `user${Date.now()}`;
      
      const userData = {
        user: user,
        name: user.displayName || '',
        username: generatedUsername,
        email: user.email
      };

      await sendUserToBackend(userData);
      
      showToast("✅ Successfully signed in with Google!", 'success');
      
      if (onAuthSuccess) {
        onAuthSuccess(userData);
      }
      
      setTimeout(onClose, 1500);
      
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!pendingUser) {
      showToast("❌ No pending verification found", 'error');
      return;
    }

    try {
      await sendEmailVerification(pendingUser.user);
      showToast("✅ Verification email resent!", 'success');
      
      // Restart the verification check with fresh timer
      if (verificationInterval) {
        clearInterval(verificationInterval);
        setVerificationInterval(null);
      }
      
      // Reset and restart verification checking
      setVerificationTimer(60);
      startVerificationCheck(pendingUser.user, pendingUser.userData);
      
    } catch (err) {
      showToast(`❌ ${err.message}`, 'error');
    }
  };

  // Mode switching
  const switchMode = (newMode) => {
    setMode(newMode);
    setFormData({ name: '', username: '', email: '', password: '' });
    hideToast();
  };

  // Render verified success screen
  const renderVerifiedScreen = () => (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-green-600">
        Account Verified!
      </h2>
      
      <p className="text-center text-gray-600 mb-6">
        Great! Your email <strong>{formData.email}</strong> has been successfully verified. 
        Your account is now active and ready to use.
      </p>
      
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center mb-6">
        <p className="text-green-800 font-medium">
          ✅ Email verification complete
        </p>
        <p className="text-green-700 text-sm mt-1">
          You can now log in to your account
        </p>
      </div>

      <button
        onClick={() => {
          // Pre-fill email for login
          setFormData(prev => ({ ...prev, password: '' }));
          switchMode('login');
        }}
        className="w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors mb-4"
      >
        Continue to Login
      </button>
      
      <button
        onClick={onClose}
        className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-full hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    </>
  );
  const renderVerificationScreen = () => (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <Mail size={32} className="text-blue-500" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Verify your email
      </h2>
      
      <p className="text-center text-gray-600 mb-6">
        We've sent a verification email to <strong>{formData.email}</strong>. 
        Please check your inbox and click the verification link.
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg text-center mb-6">
        <p className="text-gray-700 mb-2">
          {verificationTimer > 0 ? 'Checking for verification...' : 'Verification check complete'}
        </p>
        {verificationTimer > 0 && (
          <p className="text-sm text-gray-600">Next check in {Math.ceil(verificationTimer * 3 / 60)}s</p>
        )}
        <div className="mt-3">
          {verificationTimer > 0 ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          ) : (
            <p className="text-sm text-gray-600">
              The Verification is completed. Please Log In to continue.
            </p>
          )}
        </div>
      </div>

      {verificationTimer <= 0 && (
        <button
          onClick={() => {
            if (pendingUser) {
              setVerificationTimer(60);
              startVerificationCheck(pendingUser.user, pendingUser.userData);
            }
          }}
          className="w-full border border-green-300 bg-green-50 text-green-600 font-medium py-3 px-4 rounded-full hover:bg-green-100 transition-colors mb-4"
        >
          Check Again
        </button>
      )}

      <button
        onClick={resendVerificationEmail}
        disabled={verificationTimer > 50} // Allow resend after 10 seconds
        className={`w-full border border-blue-300 bg-blue-50 text-blue-600 font-medium py-3 px-4 rounded-full hover:bg-blue-100 transition-colors mb-4 ${
          verificationTimer > 50 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {verificationTimer > 50 ? `Wait ${60 - verificationTimer}s` : 'Resend verification email'}
      </button>
      
      <button
        onClick={() => switchMode('login')}
        className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-full hover:bg-gray-50 transition-colors"
      >
        Back to login
      </button>
    </>
  );

  // Render login screen
  const renderLoginScreen = () => (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Welcome back
      </h2>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="login-email" className="block text-gray-700 text-base mb-1">Email</label>
          <div className="relative">
            <input
              type="email"
              id="login-email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
            <div className="absolute left-4 top-3.5">
              <Mail size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-gray-700 text-base mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              id="login-password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <div className="absolute left-4 top-3.5">
              <Lock size={20} className="text-gray-400" />
            </div>
          </div>
          <div className="flex justify-end mt-1">
            <button type="button" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
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
            onClick={() => switchMode('signup')}
            className="text-blue-500 font-medium hover:underline"
            disabled={loading}
          >
            Sign up
          </button>
        </p>
      </div>
    </>
  );

  // Render signup screen
  const renderSignupScreen = () => (
    <>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={32} className="text-gray-400" />
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Create a new account
      </h2>

      <form className="space-y-5" onSubmit={handleSignUp}>
        <div>
          <label htmlFor="signup-name" className="block text-gray-700 text-base mb-1">Full Name</label>
          <div className="relative">
            <input
              type="text"
              id="signup-name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
            <div className="absolute left-4 top-3.5">
              <User size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="signup-username" className="block text-gray-700 text-base mb-1">Username</label>
          <div className="relative">
            <input
              type="text"
              id="signup-username"
              value={formData.username}
              onChange={(e) => updateFormData('username', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a unique username"
              required
              disabled={loading}
              minLength={3}
            />
            <div className="absolute left-4 top-3.5">
              <AtSign size={20} className="text-gray-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            At least 3 characters. Only lowercase letters, numbers, and underscores allowed.
          </p>
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-gray-700 text-base mb-1">Email</label>
          <div className="relative">
            <input
              type="email"
              id="signup-email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
              required
              disabled={loading}
            />
            <div className="absolute left-4 top-3.5">
              <Mail size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-gray-700 text-base mb-1">Password</label>
          <div className="relative">
            <input
              type="password"
              id="signup-password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Choose a strong password"
              required
              disabled={loading}
              minLength={6}
            />
            <div className="absolute left-4 top-3.5">
              <Lock size={20} className="text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating account...' : 'Create account'}
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
          Already have an account?{' '}
          <button 
            onClick={() => switchMode('login')}
            className="text-blue-500 font-medium hover:underline"
            disabled={loading}
          >
            Log in
          </button>
        </p>
      </div>
    </>
  );

  // Main render function
  const renderModalContent = () => {
    switch (mode) {
      case 'verify':
        return renderVerificationScreen();
      case 'verified':
        return renderVerifiedScreen();
      case 'login':
        return renderLoginScreen();
      default:
        return renderSignupScreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          disabled={loading}
        >
          <X size={20} />
        </button>

        {renderModalContent()}

        {!['verify', 'verified'].includes(mode) && (
          <>
            <div className="border-t border-gray-200 mt-6 pt-5" />
            <div className="text-center">
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-500 font-medium hover:text-gray-700 flex items-center justify-center mx-auto disabled:opacity-50"
              >
                Skip for now
                <ChevronRight size={20} className="ml-1" />
              </button>
            </div>
          </>
        )}
      </div>
      
      <Toast 
        message={toast.message} 
        show={toast.show} 
        onClose={hideToast}
        type={toast.type}
      />
    </div>
  );
}