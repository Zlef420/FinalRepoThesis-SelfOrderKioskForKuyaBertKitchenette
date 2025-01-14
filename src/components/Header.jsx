import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HowItWorks from "./HowItWorks";
import LoginForm from "./LoginForm";

function Header() {
  const navigate = useNavigate();
  const [isHowItWorksVisible, setIsHowItWorksVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="bg-customOrange text-white px-4 py-3 flex justify-between items-center sticky top-0 left-0 right-0 z-10">
        <h1
          className="pl-5 font-bold text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          Kuya Bert
        </h1>
        <div className="flex items-center space-x-4">
          {/* How It Works Button */}
          <button
            className="hover:text-gray-300 flex items-center"
            onClick={() => setIsHowItWorksVisible(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
            How it works
          </button>

          {/* Login Button */}
          <button
            className="hover:text-gray-300 flex items-center"
            onClick={() => setIsLoginFormVisible(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6 mr-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6.75h2.25M6 6.75h2.25m-4.5 4.5h15m-9 3.75h5.25m-8.25-9v13.5m3.75-6.75h9.75m-6 6.75h1.5"
              />
            </svg>
            Login
          </button>
        </div>
      </header>

      {/* Conditional Rendering for Popups */}
      {isHowItWorksVisible && (
        <HowItWorks
          isVisible={isHowItWorksVisible}
          onClose={() => setIsHowItWorksVisible(false)}
        />
      )}
      {isLoginFormVisible && (
        <LoginForm onClose={() => setIsLoginFormVisible(false)} />
      )}
    </>
  );
}

export default Header;
