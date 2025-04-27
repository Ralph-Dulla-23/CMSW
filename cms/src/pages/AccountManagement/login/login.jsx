import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../../firebase/authService";

export default function Login() {
  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");

      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      const result = await login(email, password);

      if (result.success) {
        // Store user role and email in localStorage
        localStorage.setItem("userRole", "admin");
        localStorage.setItem("userEmail", email);

        // Navigate to admin dashboard
        navigate("/Admindashboard");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gray-100">
      {/* Logo positioned at the top-left */}
      <img 
        src="src/assets/img/cmslogo.png"
        alt="Logo" 
        className="absolute top-4 left-4 w-12 h-12 md:w-16 md:h-16"
      />

      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-gray-900">Admin Login</h2>
        <p className="text-gray-600 text-sm mb-4">
          Enter your credentials to access the admin system.
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 p-2 bg-red-50 rounded">
            {error}
          </p>
        )}

        {/* Admin Badge */}
        <div className="mb-4 bg-[#340013] text-white p-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
          Administrator Access
        </div>

        {/* Input Fields */}
        <input
          type="email"
          placeholder="Admin Email"
          className="w-full p-2 border rounded-md mt-3 focus:outline-none focus:ring-2 focus:ring-[#340013]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded-md mt-3 focus:outline-none focus:ring-2 focus:ring-[#340013]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        
        {/* Login Button */}
        <button
          className={`w-full mt-4 bg-[#340013] text-white p-2 rounded-md text-sm font-medium 
            transition-all hover:bg-[#2a0010] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>

        {/* Links */}
        
        
        {/* Security Note */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Secure Login
          </div>
          This login is exclusively for administrative access.
          Unauthorized access attempts are monitored and logged.
        </div>
      </div>
    </div>
  );
}