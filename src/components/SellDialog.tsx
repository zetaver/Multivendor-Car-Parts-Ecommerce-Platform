import React, { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import LoginInfoDialog from "./LoginInfoDialog";
import EmailVerificationDialog from "./EmailVerificationDialog";
import PasswordDialog from "./PasswordDialog";

interface SellDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

const SellDialog: React.FC<SellDialogProps> = ({
  isOpen,
  onClose,
  onOpenChange,
}) => {
  const [showLoginInfo, setShowLoginInfo] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showForgottenPassword, setShowForgottenPassword] = useState(false);

  React.useEffect(() => {
    onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  const handleLogin = async (password: string) => {
    try {
      // TODO: Implement actual login logic here
      console.log("Logging in with:", { email: userEmail, password });
      setShowPasswordDialog(false);
      onClose();
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  };

  const handleForgotPassword = () => {
    setShowPasswordDialog(false);
    setShowForgottenPassword(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[100]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={clsx(
          "fixed z-[100] transform transition-all duration-300 ease-in-out",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto", // Ensures bottom alignment
          "sm:w-[480px] h-[640px] md:h-[800px] top-[100px] sm:left-1/2 sm:-translate-x-1/2 ", // Consistent height
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10"
          >
            ✕
          </button>

          {/* Content */}
          <div className="flex flex-col h-full">
            {/* Logo/Image Section */}
            <div className="flex justify-center items-center p-8">
              <img
                src="/sell/product_add.webp"
                alt="Sell Items"
                className="w-48 h-auto"
              />
            </div>

            {/* Store badges */}
            <div className="flex justify-center gap-2 px-4">
              <img
                src="/sell/appstore.svg"
                alt="Download on App Store"
                className="h-10"
              />
              <img
                src="/sell/playstore.svg"
                alt="Get it on Google Play"
                className="h-10"
              />
            </div>

            {/* Main Content */}
            <div className="px-4 py-6">
              <h2 className="text-xl font-semibold text-center mb-2">
                Vendre un article
              </h2>
              <p className="text-gray-600 text-center text-sm mb-6">
                Une fois connecté, vous pourrez poster vos annonces
                gratuitement.
              </p>

              {/* Login Options */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowEmailVerification(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Continue with email address</span>
                </button>

                <button
                  onClick={() => setShowLoginInfo(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-gray-50"
                >
                  <img
                    src="sell/google_logo.webp"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={() => setShowLoginInfo(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900"
                >
                  <img
                    src="/sell/apple_logo.png"
                    alt="Apple"
                    className="w-5 h-5"
                  />
                  <span>Continue with Apple</span>
                </button>
              </div>

              {/* Email Verification Dialog */}
              <EmailVerificationDialog
                isOpen={showEmailVerification}
                onClose={() => setShowEmailVerification(false)}
                onOpenChange={(isOpen) => setShowEmailVerification(isOpen)}
                onEmailVerified={(email, exists) => {
                  setShowEmailVerification(false);
                  setUserEmail(email);
                  if (exists) {
                    setShowPasswordDialog(true);
                  } else {
                    setShowLoginInfo(true);
                  }
                }}
                onLoginSuccess={() => onClose()} // This will close the SellDialog
              />

              {/* Login Info Dialog */}
              <LoginInfoDialog
                isOpen={showLoginInfo}
                onClose={() => setShowLoginInfo(false)}
                onOpenChange={(isOpen) => setShowLoginInfo(isOpen)}
                onRegistrationSuccess={() => onClose()} // This will close the SellDialog
              />
            </div>

            {/* Free Tag */}
            <div className="absolute top-4 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Free
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SellDialog;
