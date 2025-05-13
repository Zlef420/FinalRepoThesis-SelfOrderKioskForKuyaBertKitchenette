import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const EWalletPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    // Get order data from location state
    const orderData = location.state?.orderData;
    
    // Simulate payment processing
    setTimeout(() => {
      navigate("/order-conf", {
        state: {
          paymentMethod: "ewallet",
          paymentStatus: "completed",
          orderData: orderData, // Pass the order data to the confirmation page
        },
      });
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center bg-fixed">
      <Header />

      <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Scan QR Code to Pay</h2>
            <div className="bg-white w-48 h-48 mx-auto mb-4 flex items-center justify-center border-2 border-gray-200">
              <span className="text-gray-500">QR Code Placeholder</span>
            </div>
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className={`w-full py-3 rounded font-semibold text-white ${
              isProcessing ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EWalletPayment;
