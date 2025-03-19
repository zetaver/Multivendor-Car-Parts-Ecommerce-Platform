import React, { useState } from "react";
import clsx from "clsx";
import PasswordDialog from "./PasswordDialog";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onEmailVerified: (email: string, exists: boolean) => void;
  onLoginSuccess?: () => void;
}
// const [showLoginInfo, setShowLoginInfo] = useState(false);
const EmailVerificationDialog: React.FC<EmailVerificationDialogProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  onEmailVerified,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "${API_URL}/api/auth/check-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setError(data.message || "Invalid email format");
        } else if (response.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError("Server error. Please try again later.");
        }
        return;
      }

      if (data.exists) {
        setShowPasswordDialog(true);
      } else {
        onEmailVerified(email, data.exists);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-opacity-50 transition-opacity z-[100]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        className={clsx(
          "fixed z-[100] transform transition-all duration-300 ease-in-out",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto", // Ensures bottom alignment
          "sm:w-[480px] h-[566px] md:h-[800px] sm:top-1/2 md:top-[400px] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 ", // Consistent height
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
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold text-center flex-1">Login</h2>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 md:h-[189px]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={clsx(
                    "w-full py-3 px-4 rounded-lg text-white",
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {isLoading ? "Checking..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
          <div className="relative flex items-center w-full px-6 mt-10 mb-4">
            <div className="flex-grow border-t border-gray-300 "></div>
            <span className="px-2 text-gray-600 text-sm bg-white">Or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="w-full px-4 mb-28">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50 mb-4">
              <img
                src="/sell/google_logo.webp"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continue with Google</span>
            </button>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900">
              <img src="/sell/apple_logo.png" alt="Apple" className="w-5 h-5" />
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Password Dialog */}
          <PasswordDialog
            isOpen={showPasswordDialog}
            onClose={() => {
              setShowPasswordDialog(false);
              onClose();
            }}
            onForgotPassword={() => {
              setShowPasswordDialog(false);
              navigate("/forgot-password");
            }}
            onResetPassword={async (email) => {
              try {
                const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                if (!response.ok) throw new Error("Password reset failed");
              } catch (error) {
                throw new Error("Failed to send reset email");
              }
            }}
            onLogin={async (password) => {
              try {
                const response = await fetch(
                  `${API_URL}/api/auth/login`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                  }
                );

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.message || "Invalid credentials");
                }

                // Store the token in localStorage or your auth state management
                localStorage.setItem("token", data.token);

                // Close dialogs and navigate to home
                setShowPasswordDialog(false);
                onLoginSuccess?.(); 
                onClose();
                navigate("/");
              } catch (error) {
                throw new Error(
                  error instanceof Error ? error.message : "Login failed"
                );
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default EmailVerificationDialog;
