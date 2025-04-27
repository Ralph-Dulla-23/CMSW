import { useState } from 'react';
import React from "react";
import { useNavigate } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();
  
  const handleSignUpClick = () => {
    navigate('/SignUp');
  };

  const handleLoginUpClick = () => {
    navigate('/login');
  };

  return (
    <>
      {/* Navigation Bar */}
      <div className="w-full bg-white pt-10 px-6 md:px-16 flex justify-between items-center"
           style={{ height: 'var(--nav-height, 72px)' }}>
        <img 
          src="src/assets/img/cmslogo.png"
          alt="Logo" 
          className="w-12 h-12 md:w-16 md:h-16 ml-0 lg:ml-0" // Adjusted Logo Size and Margin
        />
        <div className="flex gap-4 md:gap-6">
          <button className="bg-[#3A0323] hover:bg-[#2a021a] text-white px-4 py-2 md:px-6 md:py-3 rounded-md transition-colors"
                  onClick={handleLoginUpClick}>
            Login
          </button>
          
        </div>
      </div>

      {/* Main Content - Scroll Prevention */}
      <div className="flex flex-col md:flex-row h-[calc(100vh_-_var(--nav-height,72px))] bg-white items-center justify-between px-6 md:px-10 lg:px-40 overflow-hidden">
        {/* Left Content */}
        <div className="w-full md:w-1/2 pr-0 md:pr-12 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-[#3A0323] leading-tight mb-4 md:mb-8">
          Empowering You on Your Mental Wellness Journey
          </h1>
          <p className="text-gray-600 text-lg md:text-xl lg:text-2xl leading-relaxed">
          CMS provides a secure and supportive platform for counselors and users to connect, track progress, and achieve lasting well-being. 
          Schedule appointments, 
          and communicate confidently, all in one place.
          </p>
        </div>

        {/* Right Image */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end items-center">
          <div className="flex items-center"> {/* Container for logos and line */}
            <img
              src="./src/assets/img/Guidancelogo.png"
              alt="Guidance Logo"
              className="w-[150px] h-auto md:w-[200px] lg:w-[250px] object-contain"
            />
            <div className="border-l-2 border-gray-300 h-16 mx-4"></div> {/* Vertical Line */}
            <img
              src="./src/assets/img/cmslogo.png"
              alt="CMS Logo"
              className="w-[150px] h-auto md:w-[200px] lg:w-[250px] object-contain"
            />
          </div>
        </div>
      </div>

      {/* CSS Custom Property Injection */}
      <style>{`
        :root {
          --nav-height: 76px; /* Update using DevTools measurement */
        }
      `}</style>
    </>
  );
}

export default App;
