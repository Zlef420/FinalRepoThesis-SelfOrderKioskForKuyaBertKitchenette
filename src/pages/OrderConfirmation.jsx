import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Printer } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Separate styles for printing
const PrintableReceipt = ({ orderItems, diningOption, printRef }) => {
  const calculateItemTotal = (item) => {
    const addonsTotal = (item.addons || []).reduce(
      (sum, addon) => sum + addon.price,
      0
    );
    return (item.price + addonsTotal) * item.quantity;
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateVAT = (subtotal) => {
    return subtotal * 0.12;
  };

  const generateOrderNumber = () => {
    return `SI#${Math.floor(Math.random() * 10000000)}`;
  };

  const subtotal = calculateSubtotal();
  const vat = calculateVAT(subtotal);
  const orderNumber = generateOrderNumber();
  const currentDate = new Date();

  return (
    <div
      ref={printRef}
      className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md font-mono print:shadow-none print:w-full print:max-w-none print:p-1"
    >
      <style type="text/css" media="print">
        {`
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div id="printable-receipt" className="text-center">
        <div className="mb-4">
          <h1 className="font-bold text-lg">Kuya Bert's Kitchenette</h1>
          <p className="text-sm">Sergio Osmeña St, Atimonan, 4331 Quezon</p>
          <p className="text-sm">facebook.com/KuyaBertKitchenette</p>
          <p className="font-bold mt-2">SALES INVOICE</p>
          <p className="font-bold">{diningOption.toUpperCase()}</p>
        </div>

        <div className="text-sm mb-2">
          <p>Order Number: {orderNumber}</p>
          <p>Reference Number: {orderNumber}</p>
          <p>
            Date: {currentDate.toLocaleDateString()} Time:{" "}
            {currentDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="border-t border-b border-black py-2 my-2">
          {orderItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {item.quantity} {item.name}
              </span>
              <span>{calculateItemTotal(item).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="text-sm">
          <div className="flex justify-between">
            <span>{orderItems.length} Item(s)</span>
            <span>Subtotal {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL DUE</span>
            <span>{(subtotal + vat).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VATable Sales</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT Amount</span>
            <span>{vat.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-sm">
          <div className="border-t border-black pt-2">
            THANK YOU, AND PLEASE COME AGAIN.
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderState, setOrderState] = useState("processing");
  const [countdown, setCountdown] = useState(5);
  const printRef = useRef();

  const paymentMethod = location.state?.paymentMethod || "cash";
  const orderItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
  const diningOption = localStorage.getItem("diningOption") || "Dine In";

  const handlePrint = () => {
    window.print();
  };

  // Clear cart data function
  const clearCartData = () => {
    try {
      localStorage.removeItem("cartItems");
      localStorage.removeItem("diningOption");
      return true;
    } catch (error) {
      console.error("Error clearing cart data:", error);
      return false;
    }
  };

  // Handle navigation with cart clearing
  const handleNavigation = (path) => {
    clearCartData();
    window.location.href = path;
  };

  // Initial effect for cash payment processing
  useEffect(() => {
    if (paymentMethod === "cash") {
      const timer = setTimeout(() => {
        setOrderState("complete");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentMethod]);

  // Effect for order completion and navigation
  useEffect(() => {
    if (orderState === "complete") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleNavigation("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderState]);

  // Reset function for manual navigation
  const handleScreenClick = () => {
    if (orderState === "complete") {
      handleNavigation("/home");
    }
  };

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      if (orderState === "complete") {
        clearCartData();
      }
    };
  }, [orderState]);

  const renderQRCode = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">Scan to Pay</h2>
      <div className="bg-gray-200 w-48 h-48 mx-auto mb-4 flex items-center justify-center">
        <span className="text-gray-600">QR Code Placeholder</span>
      </div>
      <p className="text-gray-600 text-lg">Amount: ₱{calculateSubtotal()}</p>
      <button
        onClick={() => setOrderState("complete")}
        className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Confirm Payment
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center print:bg-none">
      <Header />

      <main
        className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center"
        onClick={handleScreenClick}
      >
        <div className="text-center">
          {paymentMethod === "ewallet" && orderState === "processing" ? (
            renderQRCode()
          ) : (
            <div className="space-y-6">
              {orderState === "processing" ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-white no-print" />
                  <h1 className="text-2xl font-bold text-white mb-6 no-print">
                    Processing your order
                  </h1>
                  <PrintableReceipt
                    orderItems={orderItems}
                    diningOption={diningOption}
                    printRef={printRef}
                  />
                  <button
                    onClick={handlePrint}
                    className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center justify-center mx-auto no-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                  </button>
                </>
              ) : (
                <div className="space-y-4 text-white">
                  <h1 className="text-3xl font-bold">Order Complete!</h1>
                  <p className="text-xl">Thank you for ordering</p>
                  <p>Click anywhere to return to menu</p>
                  <p className="text-sm text-gray-300">
                    Auto-redirecting in {countdown} seconds...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
