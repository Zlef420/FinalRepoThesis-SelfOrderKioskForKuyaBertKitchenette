import React, { useState } from "react";
import {
  ClipboardList,
  Settings,
  ShoppingCart,
  CreditCard,
  CheckSquare,
  X,
} from "lucide-react";

const steps = [
  {
    title: "Select Your Items",
    description:
      "Browse our digital menu and tap on items you'd like to order. You can customize your selections and choose quantities easily.",
    icon: <ClipboardList className="w-6 h-6" />,
  },
  {
    title: "Customize Your Order",
    description:
      "Add special instructions, modify ingredients, or choose size options. Make your order exactly how you like it!",
    icon: <Settings className="w-6 h-6" />,
  },
  {
    title: "Review Your Cart",
    description:
      "Check your selected items, quantities, and total price. You can easily add or remove items before proceeding to payment.",
    icon: <ShoppingCart className="w-6 h-6" />,
  },
  {
    title: "Make Payment",
    description:
      "Choose your preferred payment method - credit card, debit card, or mobile payment. Follow the on-screen instructions to complete your purchase securely.",
    icon: <CreditCard className="w-6 h-6" />,
  },
  {
    title: "Get Your Order Number",
    description:
      "Once payment is complete, you'll receive an order number. Keep an eye on the display screen to know when your order is ready for pickup.",
    icon: <CheckSquare className="w-6 h-6" />,
  },
];

const HowItWorks = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isVisible) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            How to Use Self-Order Kiosk
          </h2>
          <p className="text-gray-600 mt-2">
            Follow these simple steps to place your order
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image/Visual Section */}
          <div className="flex-1">
            <img
              src={`/api/placeholder/500/400`}
              alt={`Step ${currentStep + 1}: ${steps[currentStep].title}`}
              className="rounded-lg shadow-lg w-full"
            />
          </div>

          {/* Step Description */}
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-blue-500 text-white rounded-full">
                {steps[currentStep].icon}
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {steps[currentStep].title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentStep === index ? "bg-blue-500 w-6" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  currentStep === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                disabled={currentStep === 0}
              >
                Previous
              </button>
              <button
                onClick={currentStep === steps.length - 1 ? onClose : nextStep}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  currentStep === steps.length - 1
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
