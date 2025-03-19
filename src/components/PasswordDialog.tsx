// src/components/PasswordDialog.tsx
import React, { useState } from 'react';

import clsx from "clsx";
import ForgotPasswordDialog from './ForgotPasswordDialog';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<void>;
  onForgotPassword: () => void;
  onResetPassword: (email: string) => Promise<void>;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({ isOpen, onClose, onLogin, onForgotPassword, onResetPassword }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleLoginClick = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onLogin(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
  };

  return (
    <>
      <div
        className={clsx(
          "fixed z-[100] transform transition-all duration-300 ease-in-out",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto", // Ensures bottom alignment
          "sm:w-[480px] h-[566px] md:h-[800px] sm:top-1/2 md:top-[400px] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2", // Consistent height
          isOpen
            ? "opacity-100 max-sm:translate-y-0"
            : "opacity-0 pointer-events-none max-sm:translate-y-full"
        )}
      >
        <div
          className={clsx(
            "relative w-full bg-white overflow-hidden",
            "sm:rounded-lg", // Regular rounded corners for tablet/desktop
            "max-sm:rounded-t-2xl max-sm:h-full" // Full height and rounded top corners only on mobile
          )}
        >
          <div className="relative flex items-center justify-between w-full max-w-md mx-auto mt-4 px-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md  hover:bg-green-400"
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
            <h2 className="text-lg font-semibold text-center flex-1">Welcome</h2>

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
            <h2 className="text-sm font-normal text-start flex-1 text-gray-400 mt-9">Welcome! There is already an account for</h2>
            {/* login email */}
            <h2 className="text-sm font-normal text-start flex-1 text-gray-400 mb-10"></h2>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-2"
            />
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-500 mb-4"
            >
              {showPassword ? 'Hide' : 'Show'} Password
            </button>
            <button
              onClick={handleLoginClick}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 uppercase"
              disabled={loading}
            >
              {loading ? 'Continue ...' : 'Continue'}
            </button>
            <div className="flex justify-center items-center mt-2 mb-[170px]">
              <button
                onClick={handleForgotPasswordClick}
                className="text-sm text-black"
              >
                Forgotten Password?
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ForgotPasswordDialog
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onReset={onResetPassword}
      />
    </>
  );
};

export default PasswordDialog;