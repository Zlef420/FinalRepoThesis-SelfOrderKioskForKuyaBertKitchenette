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
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative w-[85%] h-[75vh] mx-auto overflow-hidden rounded-lg -mt-3.5">
          <div
            className="absolute inset-0 flex transition-transform duration-[1500ms] ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {uploadedImages.map((item, index) => (
              <div key={item.id} className="w-full h-full flex-shrink-0">
                <img
                  src={item.image}
                  alt="Advertisement"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={goToPrevious}
          className="absolute left-4 sm:left-6 md:left-8 lg:left-10 bg-transparent border-black px-0 py-0 rounded-full hover:bg-[#d94e1e] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-8 sm:size-10 md:size-12"
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
          className="absolute right-4 sm:right-6 md:right-8 lg:right-10 bg-transparent border-black rounded-full hover:bg-[#d94e1e] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-8 sm:size-10 md:size-12"
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
          onClick={() => navigate("/home")}
          className="bg-[#EF5C28] text-white w-[65%] px-10 sm:px-20 md:px-40 lg:px-60 py-3 rounded-lg text-lg font-bold hover:bg-[#d94e1e] transition -mb-3 z-40"
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
