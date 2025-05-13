import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

function Toast({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000); // auto close after 3s
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-transform duration-500 ${
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white/80 backdrop-blur-md border border-gray-300 shadow-lg rounded-lg px-5 py-3 flex items-center gap-4">
        <p className="text-gray-800 text-sm">{message}</p>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default Toast;