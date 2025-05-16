"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

export default function SuccessMessage() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check for success message in sessionStorage
    const sessionMsg = sessionStorage.getItem("success");

    // Also check localStorage for success message
    const localMsg = localStorage.getItem("setupSuccess");

    const successMsg = sessionMsg || localMsg;

    if (successMsg) {
      setMessage(successMsg);
      setVisible(true);

      // Clear the messages
      if (sessionMsg) sessionStorage.removeItem("success");
      if (localMsg) localStorage.removeItem("setupSuccess");

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5">
      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-green-800 font-medium">{message}</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-green-500 hover:text-green-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
