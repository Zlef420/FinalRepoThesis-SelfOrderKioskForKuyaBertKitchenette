import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, LogIn } from "lucide-react"; // Add this import
import HowItWorks from "./HowItWorks";
import LoginForm from "./LoginForm";
import clickSound from "../assets/notifsound.mp3";

function Header() {
  const navigate = useNavigate();
  const [isHowItWorksVisible, setIsHowItWorksVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);

  // Function to play sound
  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

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
            <HelpCircle className="size-5 mr-1" />
            How it works
          </button>

          {/* Login Button */}
          <button
            className="hover:text-gray-300 flex items-center"
            onClick={() => {
              playSound(); // Play sound on click
              setIsLoginFormVisible(true); // Show login form
            }}
          >
            <LogIn className="size-6 mr-1" />
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
