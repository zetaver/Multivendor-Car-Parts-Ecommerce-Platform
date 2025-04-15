import React, { useState } from 'react';
import clsx from "clsx";
import { API_URL } from "../config";

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (email: string) => Promise<void>;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ isOpen, onClose, onReset }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Password reset failed");
      }
      
      setSuccessMessage(data.message);
      setEmail(''); // Clear the email input
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
        className={clsx(
          "fixed z-[100] transform transition-all duration-300 ease-in-out",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto", // Ensures bottom alignment
          "sm:w-[480px] h-[566px] md:h-[800px] sm:top-[100px] md:top-[400px] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2", // Consistent height
          isOpen
            ? "opacity-100 max-sm:translate-y-0"
            : "opacity-0 pointer-events-none max-sm:translate-y-full"
        )}
      >
        <div
          className={clsx(
            "relative w-full bg-white overflow-hidden",
            "sm:rounded-lg", // Regular rounded corners for tablet/desktop
            "max-sm:rounded-t-2xl h-[546px]" // Full height and rounded top corners only on mobile
          )}
        >
        <div className="relative flex items-center justify-between w-full max-w-md mx-auto mt-4 px-4">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-green-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-lg font-semibold text-center flex-1">Forgotten password</h2>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className='m-4 bg-white'>
          <p className="text-sm text-gray-600 mt-9 mb-4">
            Enter the email address associated with your account. We'll email you a link to reset your password.
          </p>
          
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-4"
          />
          
          {error && (
            <p className="text-red-500 text-sm mb-2">{error}</p>
          )}
          {successMessage && (
            <p className="text-green-500 text-sm mb-2">{successMessage}</p>
          )}

          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 uppercase"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordDialog; 