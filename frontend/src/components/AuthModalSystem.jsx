import React, { useState, useEffect } from 'react';
import { User, Mail, X, ChevronRight, Lock } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import Toast from './Toast';

export default function AuthModalSystem({ onClose, initialMode = 'signup', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [verificationInterval, setVerificationInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  const showToast = (message) => {
    setToast({ show: true, message });
  };

  const hideToast = () => {
    setToast({ show: false, message: '' });
  };

  // Helper function to handle successful authentication
  const handleAuthSuccess = (user, userData = {}) => {
    showToast("✅ Successfully authenticated!");
    setTimeout(() => {
      setName('');
      setEmail('');
      setPassword('');
      
      // Call the callback to update parent component's auth state
      if (onAuthSuccess) {
        onAuthSuccess(user, userData);
      }
      
      onClose();
    }, 1500);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      setMode('verify');
      setLoading(false);

      let countdown = 60;
      setVerificationTimer(countdown);

      const interval = setInterval(async () => {
        countdown--;
        setVerificationTimer(countdown);

        if (countdown <= 0) {
          clearInterval(interval);
          setVerificationInterval(null);
        }

        try {
          await userCredential.user.reload();
          const isVerified = userCredential.user.emailVerified;

          if (isVerified) {
            clearInterval(interval);
            setVerificationInterval(null);
            
            showToast("✅ Email verified! Logging you in...");

            const token = await userCredential.user.getIdToken();

            try {
              // Register user
              const registerResponse = await fetch("http://localhost:8000/api/auth/firebase", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  name: name,
                  email: email,
                  uid: userCredential.user.uid,
                }),
              });

              if (!registerResponse.ok) {
                const errorData = await registerResponse.text();
                throw new Error(`Registration failed: ${registerResponse.status}`);
              }

              // Login user
              const loginResponse = await fetch("http://localhost:8000/api/auth/login", {
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

              if (!loginResponse.ok) {
                const errorData = await loginResponse.text();
                throw new Error(`Login failed: ${loginResponse.status}`);
              }

              const userData = await loginResponse.json();
              
              // Call success handler with user data
              handleAuthSuccess(userCredential.user, userData);
              
            } catch (error) {
              console.error("Backend authentication error:", error);
              showToast(`❌ ${error.message} Please try logging in manually.`);
              setTimeout(() => {
                setMode('login');
              }, 2000);
            }
          }
        } catch (err) {
          console.error("Error checking verification:", err);
        }
      }, 3000);

      setVerificationInterval(interval);

    } catch (err) {
      showToast(`❌ ${err.message}`);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showToast("❌ Please verify your email before logging in.");
        await auth.signOut();
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email,
          uid: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed on server');
      }

      const userData = await response.json();
      
      // Call success handler with user data
      handleAuthSuccess(user, userData);
      
    } catch (err) {
      showToast(`❌ ${err.message}`);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const token = await user.getIdToken();

      const response = await fetch("http://localhost:8000/api/auth/firebase", {
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

      if (!response.ok) {
        throw new Error('Google sign-in failed on server');
      }

      const userData = await response.json();
      
      // Call success handler with user data
      handleAuthSuccess(user, userData);
      
    } catch (err) {
      showToast(`❌ ${err.message}`);
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        showToast("✅ Verification email resent!");

        let countdown = 60;
        setVerificationTimer(countdown);
      } else {
        showToast("❌ No user is currently signed in.");
      }
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return showToast("Please enter your email above first.");
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("📧 Password reset email sent!");
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  // ... rest of your renderModalContent function stays the same

  const renderModalContent = () => {
    if (mode === 'verify') {
      return (
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
            We've sent a verification email to <strong>{email}</strong>.
            Please check your inbox and click the verification link.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg text-center mb-6">
            <p className="text-gray-700">
              Checking for verification... {verificationTimer > 0 ? `(${verificationTimer}s)` : ''}
            </p>
          </div>

          <button
            onClick={resendVerificationEmail}
            disabled={verificationTimer > 0}
            className={`w-full border border-blue-300 bg-blue-50 text-blue-600 font-medium py-3 px-4 rounded-full hover:bg-blue-100 transition-colors mb-4 ${verificationTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Resend verification email
          </button>

          <button
            onClick={() => setMode('login')}
            className="w-full border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-full hover:bg-gray-50 transition-colors"
          >
            Back to login
          </button>
        </>
      );
    } else if (mode === 'login') {
      return (
        <>
          <h2 className="text-2xl sm:text-3xl text-black font-bold mb-6 text-center">
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
                  className="w-full border border-gray-300 rounded-lg py-3 text-black px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-lg text-black py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <div className="absolute left-4 top-3.5">
                  <Lock size={20} className="text-gray-400" />
                </div>
              </div>
              <div className="flex justify-end mt-1">
                <p className="text-sm text-blue-500 cursor-pointer" onClick={handlePasswordReset}>
                  Forgot Password?
                </p>
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
            className="w-full border border-gray-300 rounded-full py-3 text-black flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </button>

          <div className="text-center text-black mt-5">
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-blue-500 font-medium hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-black">
            Create a new account
          </h2>

          <form className="space-y-5" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="name" className="block text-gray-700 text-base mb-1">Name</label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your name here"
                  required
                />
                <div className="absolute left-4 top-3.5">
                  <User size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 text-base mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your email here"
                  required
                />
                <div className="absolute left-4 top-3.5">
                  <Mail size={20} className="text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-base mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Choose a strong password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing up...' : 'Sign up'}
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

          <div className="text-center mt-5 text-black">
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-500 font-medium hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {renderModalContent()}

        {mode !== 'verify' && (
          <>
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
          </>
        )}
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={hideToast}
      />
    </div>
  );
}