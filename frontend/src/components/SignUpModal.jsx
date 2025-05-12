import { useState } from 'react';
import { User, Mail, X, ChevronRight } from 'lucide-react';

export default function SignUpModal({ onClose }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSignUp = (e) => {
    e.preventDefault();
    console.log('Signing up with:', { name, email });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* User icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={32} className="text-gray-400" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Create a new account
        </h2>

        {/* Form fields */}
        <div className="space-y-5">
          {/* Name field */}
          <div>
            <label htmlFor="name" className="block text-gray-700 text-base mb-1">
              Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your name here"
              />
              <div className="absolute left-4 top-3.5">
                <User size={20} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-gray-700 text-base mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your email here"
              />
              <div className="absolute left-4 top-3.5">
                <Mail size={20} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Sign up button */}
          <button
            onClick={handleSignUp}
            className="w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-full hover:bg-blue-600 transition-colors"
          >
            Sign up
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

       {/* Google sign in */}
    <button className="w-full border border-gray-300 rounded-full py-3 flex items-center justify-center hover:bg-gray-50 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
      </svg>
    </button>


        {/* Login link */}
        <div className="text-center mt-5">
          <p>
            Already have an account?{' '}
            <a href="#" className="text-blue-500 font-medium hover:underline">
              Login
            </a>
          </p>
        </div>

        {/* Bottom border */}
        <div className="border-t border-gray-200 mt-6 pt-5" />

        {/* Skip option */}
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