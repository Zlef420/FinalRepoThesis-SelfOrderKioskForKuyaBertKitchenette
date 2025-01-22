import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useSharedState } from "../context/SharedStateContext"; // Import shared state

function IntroPage() {
  const { uploadedImages } = useSharedState(); // Access uploaded images dynamically
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resetTimer, setResetTimer] = useState(0);
  const navigate = useNavigate(); // Initialize the useNavigate hook

  // Effect hook for auto-swiping images
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 4000);
    return () => clearInterval(interval);
  }, [resetTimer]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % uploadedImages.length);
    setResetTimer((prev) => prev + 1);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? uploadedImages.length - 1 : prev - 1
    );
    setResetTimer((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center text-white">
      <Header />
      <div className="flex-1 flex items-center justify-center h-screen relative">
        <div className="relative w-[80%] h-[450px] mx-auto border-2 border-gray-700 overflow-hidden rounded-lg -mt-4">
          <div
            className="absolute inset-0 flex transition-transform duration-[1500ms] ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {uploadedImages.map((item) => (
              <img
                key={item.id}
                src={item.image}
                alt="Advertisement"
                className="w-full h-full object-cover shrink-0"
              />
            ))}
          </div>
        </div>
        <button
          onClick={goToPrevious}
          className="absolute left-20 bg-transparent border-black px-0 py-0 rounded-full hover:bg-[#d94e1e] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-20 bg-transparent border-black rounded-full hover:bg-[#d94e1e] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </button>
      </div>
      <div className="flex justify-center -mt-3">
        <button
          onClick={() => navigate("/home")} // Navigate to the Home page
          className="bg-[#EF5C28] text-white px-80 py-3 rounded-lg text-lg font-bold hover:bg-[#d94e1e] transition -mb-2.5"
        >
          Tap to Order
        </button>
      </div>
      <div className="flex-none mt-4">
        <Footer />
      </div>
    </div>
  );
}

export default IntroPage;
