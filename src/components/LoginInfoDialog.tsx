import React from "react";
import clsx from "clsx";
import CountrySelectDialog from "./CountrySelectDialog";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config";

interface LoginInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
  // Add new prop for successful registration
  onRegistrationSuccess?: () => void;
}

const LoginInfoDialog: React.FC<LoginInfoDialogProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  onRegistrationSuccess
}) => {
  const [showCountrySelect, setShowCountrySelect] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState("sir");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Form validation states
  const [errors, setErrors] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: ""
  });

  const [selectedCountry, setSelectedCountry] = React.useState({
    code: "FR",
    name: "France",
    dialCode: "+33",
  });
  const genresCategories = [
    {
      id: "sir",
      name: "Sir",
      image: "/images/genres/116.webp",
    },
    {
      id: "madam",
      name: "Madam",
      image: "/images/genres/152.webp",
    },
    {
      id: "neutral",
      name: "Neutral",
      image: "/images/genres/188.webp",
    },
  ];
  const navigate = useNavigate();

  React.useEffect(() => {
    onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: ""
    };

    // Validate first name
    if (!firstName.trim()) {
      newErrors.firstName = "First Name is required";
      isValid = false;
    }

    // Validate last name
    if (!lastName.trim()) {
      newErrors.lastName = "Name is required";
      isValid = false;
    }

    // Validate phone number
    if (!phone.trim()) {
      newErrors.phone = "Phone Number is required";
      isValid = false;
    } else if (!/^\d{6,15}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      isValid = false;
    } else if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAccept = async () => {
    if (!validateForm()) {
      return; // Stop the submission if validation fails
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          title: selectedGenre === 'sir' ? 'Sir' : selectedGenre === 'madam' ? 'Madam' : 'Neutral',
          firstName,
          lastName,
          countryCode: selectedCountry.code,
          phone,
          role: 'user'
        })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      onClose();
       // Call onRegistrationSuccess if provided
      onRegistrationSuccess?.();
      navigate("/products/add");
    } catch (error) {
      console.error('Registration error:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <>
      {/* Backdrop */}
      {/* <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[100]",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      /> */}

      {/* Dialog */}
      <div
        className={clsx(
          "fixed z-[100] transform transition-all duration-300 ease-in-out",
          // Mobile view styles (full screen) - adjusted top position
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-[0%]", // Changed from top-[10%] to top-[5%]
          // Desktop/tablet view styles (centered with specific size)
          "sm:w-[480px] h-[666px] md:h-[800px] sm:top-[100px] md:top-[400px] sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          // Animation and visibility
          isOpen
            ? "opacity-100 max-sm:translate-y-0"
            : "opacity-0 pointer-events-none max-sm:translate-y-full"
        )}
      >
        <div
          className={clsx(
            "relative w-full bg-white overflow-hidden h-[546px]",
            "sm:rounded-lg", // Regular rounded corners for tablet/desktop
            "max-sm:rounded-t-2xl max-sm:h-full" // Full height and rounded top corners only on mobile
          )}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 z-10 mr-4"
          >
            ✕
          </button>

          {/* Content */}
          <div className="flex flex-col p-6 overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Create an account
            </h2>
            <div className="flex justify-center gap-6 mb-3">
              {genresCategories.map((genre) => (
                <div>
                  <div
                    key={genre.id}
                    className={`flex flex-col items-center p-3 border-2 rounded-xl cursor-pointer w-20 h-20 ${
                      selectedGenre === genre.id
                        ? "border-green-500"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedGenre(genre.id)}
                  >
                    <img
                      src={genre.image}
                      alt={genre.name}
                      className="w-20 h-20 rounded-md"
                    />
                  </div>
                  <p
                    className={`mt-2 font-semibold text-center ${
                      selectedGenre === genre.id
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {genre.name}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium">Contact details</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Not visible to the community
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">First Name</label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg ${errors.firstName ? "border-red-500" : ""}`}
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors({...errors, firstName: ""});
                    }
                  }}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg ${errors.lastName ? "border-red-500" : ""}`}
                  placeholder="Name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors({...errors, lastName: ""});
                    }
                  }}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-sm mb-1">Country</label>
                  <button
                    onClick={() => setShowCountrySelect(true)}
                    className="w-full p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`/flags/${selectedCountry.code.toLowerCase()}.svg`}
                        alt={selectedCountry.code}
                        className="w-5 h-5"
                      />
                      <span>{selectedCountry.code}</span>
                    </div>
                    <span>▼</span>
                  </button>
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">Phone Number</label>
                  <input
                    type="tel"
                    className={`w-full p-3 border rounded-lg ${errors.phone ? "border-red-500" : ""}`}
                    placeholder={selectedCountry.dialCode}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (e.target.value.trim()) {
                        setErrors({...errors, phone: ""});
                      }
                    }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Identifiers
              </h2>

              {/* Email Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors({...errors, email: ""});
                    }
                  }}
                  className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none ${errors.email ? "border-red-500" : ""}`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.trim()) {
                        setErrors({...errors, password: ""});
                      }
                    }}
                    className={`w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="text-sm text-gray-600  flex items-start gap-0">
                <img src="/identify.png" className="h-12 w-12"></img>
                <span>
                  Check that your password contains at least:
                  <strong> 8 characters</strong>, <strong>1 number</strong>,{" "}
                  <strong>1 uppercase letter</strong>, and{" "}
                  <strong>1 lowercase letter</strong>.
                </span>
              </div>
              {/* Country Select Dialog */}
              <CountrySelectDialog
                isOpen={showCountrySelect}
                onClose={() => setShowCountrySelect(false)}
                onSelect={setSelectedCountry}
              />
            </div>
            <div className="bg-gray-300 border-b border-gray-300 mt-4 h-[1px] w-full"></div>

            {/* Terms */}
            <div className="mt-6 text-sm text-gray-600">
              <p>
                En cliquant sur accepter et continuer j'accepte les{" "}
                <a href="#" className="text-blue-600">
                  CGV / CGU
                </a>{" "}
                et la{" "}
                <a href="#" className="text-blue-600">
                  politique de confidentialité
                </a>{" "}
                concernant les{" "}
                <a href="#" className="text-blue-600">
                  données personnelles
                </a>
              </p>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAccept}
              className="w-full mt-6 py-3 bg-emerald-400 text-white rounded-lg hover:bg-emerald-500 transition-colors uppercase md:mb-10 mb-48"
            >
              Accept and continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginInfoDialog;