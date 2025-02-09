import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import HowItWorks from "./HowItWorks";
import LoginForm from "./LoginForm";
import clickSound from "../assets/notifsound.mp3";

function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole, logout } = useAuth();
  const [isHowItWorksVisible, setIsHowItWorksVisible] = useState(false);
  const [isLoginFormVisible, setIsLoginFormVisible] = useState(false);

  const playSound = () => {
    const audio = new Audio(clickSound);
    audio.play();
  };

  const handleLogout = () => {
    playSound();
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="bg-customOrange text-white px-4 py-3 flex justify-between items-center sticky top-0 left-0 right-0 z-10">
        <h1
          className="pl-5 font-bold text-lg cursor-pointer"
          onClick={() => navigate("/")}
        >
          Kuya Bert
        </h1>
        <div className="flex items-center space-x-4">
          <button
            className="hover:text-gray-300 flex items-center"
            onClick={() => setIsHowItWorksVisible(true)}
          >
            <HelpCircle className="size-5 mr-1" />
            How it works
          </button>

          {isAuthenticated ? (
            <button
              className="hover:text-gray-300 flex items-center"
              onClick={handleLogout}
              title={`Logged in as ${userRole}`}
            >
              <LogOut className="size-6 mr-1" />
              Logout ({userRole})
            </button>
          ) : (
            <button
              className="hover:text-gray-300 flex items-center"
              onClick={() => {
                playSound();
                setIsLoginFormVisible(true);
              }}
            >
              <LogIn className="size-6 mr-1" />
              Login
            </button>
          )}
        </div>
      </header>

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
