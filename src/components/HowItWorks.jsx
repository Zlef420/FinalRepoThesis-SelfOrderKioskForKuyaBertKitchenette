import React from "react";

const HowItWorks = ({ isVisible, onClose }) => {
  if (!isVisible) return null; // Don't render if not visible

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        {/* Popup Content */}
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          How It Works
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image Section */}
          <div className="flex-1">
            <img
              src="https://via.placeholder.com/500"
              alt="Self-Order Kiosk"
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Steps Section */}
          <div className="flex-1">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex items-center justify-center bg-blue-500 text-white rounded-full font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Select Your Items
                  </h3>
                  <p className="text-gray-600">
                    Browse through the menu on the touchscreen and add items to
                    your cart.
                  </p>
                </div>
              </div>
              {/* Additional steps (2, 3, 4)... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
