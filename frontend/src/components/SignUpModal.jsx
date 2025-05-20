import { useState } from 'react';
import { User, Mail, X, ChevronRight } from 'lucide-react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';

export default function SignUpModal({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      alert("✅ Verification email sent! Please check your inbox.");

      // Wait for email to be verified (or skip waiting in dev)
      const interval = setInterval(async () => {
        await userCredential.user.reload();
        const isVerified = userCredential.user.emailVerified;
        if (isVerified) {
          clearInterval(interval);

          const token = await userCredential.user.getIdToken();

          // Send to backend
          await fetch("http://localhost:8000/api/auth/firebase", {
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

          setEmail('');
          setPassword('');
          setName('');
          onClose();
        }
      }, 3000);
    } catch (err) {
      alert(`❌ ${err.message}`);
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
            <label htmlFor="name" className="block text-gray-700 text-base mb-1">Name</label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <button className="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
          Continue with Google
        </button>

        <div className="text-center mt-5">
          <p>
            Already have an account?{' '}
            <a href="#" className="text-blue-500 font-medium hover:underline">
              Login
            </a>
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
    </div>
  );
}
