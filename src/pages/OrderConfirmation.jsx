import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Printer } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

{/* Printable Receipt Component */}
const PrintableReceipt = ({
  orderItems,
  diningOption,
  printRef,
  paymentMethod,
  dbOrderNumber,
}) => {
  const calculateItemTotal = (item) => {
    {/* Check if itemTotal is already calculated */}
    if (item.itemTotal) return item.itemTotal;
    
    {/* Calculate the total if not already provided */}
    const addonsTotal = (item.addons || []).reduce(
      (sum, addon) => sum + (addon.price * (addon.quantity || 1)),
      0
    );
    return (item.price * item.quantity) + addonsTotal;
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };



  const subtotal = calculateSubtotal();
  {/* Use dbOrderNumber or generate a random number as fallback */}
  const orderNumber = dbOrderNumber ? String(dbOrderNumber) : `SI#${Math.floor(Math.random() * 10000000)}`;
  const currentDate = new Date();

  {/* Render the appropriate receipt based on payment method */}
  if (paymentMethod === "cash") {
    {/* Cash payment - single receipt */}
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
            <p className="font-bold mt-3 text-base">ORDER SLIP</p>
            <p className="font-bold text-lg">ORDER #{orderNumber.replace('SI#', '')}</p>
            <p className="font-bold">{diningOption.toUpperCase()}</p>
          </div>

          <div className="text-sm mb-2">
            <p>
              {currentDate.toLocaleDateString()} {" "}
              {currentDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="border-t border-b border-black py-2 my-2">
            {orderItems.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <span>
                    {item.quantity} {item.name}
                  </span>
                  <span>₱{calculateItemTotal(item).toFixed(2)}</span>
                </div>
                
                {item.addons && item.addons.length > 0 && (
                  <div className="text-xs text-left ml-4">
                    <span className="font-semibold">Add-ons: </span>
                    {item.addons.map((addon, idx) => (
                      <span key={idx}>
                        {addon.name}{addon.quantity > 1 && ` x${addon.quantity}`}
                        {idx < item.addons.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}
                
                {(item.details || item.instructions) && (
                  <div className="text-xs text-left ml-4">
                    <span className="font-semibold">Note: </span>
                    <span>{item.details || item.instructions}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-sm mt-4">
            <div className="flex justify-between font-bold mt-2">
              <span>TOTAL:</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (paymentMethod === "ewallet") {
    {/* E-wallet payment - dual receipts */}
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
              .receipt-copy {
                page-break-after: always;
              }
            }
          `}
        </style>
        <div id="printable-receipt">
          {/* Customer Copy */}
          <div className="text-center receipt-copy">
            <div className="mb-4">
              <h1 className="font-bold text-lg">Kuya Bert's Kitchenette</h1>
              <p className="text-sm">Sergio Osmeña St, Atimonan, 4331 Quezon</p>
              <p className="font-bold mt-3 text-base">ORDER SLIP</p>
              <p className="font-bold text-lg">ORDER #{orderNumber.replace('SI#', '')}</p>
              <p className="font-bold">{diningOption.toUpperCase()}</p>
              <p className="font-bold text-sm mt-1">*** CUSTOMER COPY ***</p>
            </div>

            <div className="text-sm mb-2">
              <p>
                {currentDate.toLocaleDateString()} {" "}
                {currentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="border-t border-b border-black py-2 my-2">
              {orderItems.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity} {item.name}
                    </span>
                    <span>₱{calculateItemTotal(item).toFixed(2)}</span>
                  </div>
                  
                  {item.addons && item.addons.length > 0 && (
                    <div className="text-xs text-left ml-4">
                      <span className="font-semibold">Add-ons: </span>
                      {item.addons.map((addon, idx) => (
                        <span key={idx}>
                          {addon.name}{addon.quantity > 1 && ` x${addon.quantity}`}
                          {idx < item.addons.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {(item.details || item.instructions) && (
                    <div className="text-xs text-left ml-4">
                      <span className="font-semibold">Note: </span>
                      <span>{item.details || item.instructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm">
                <p className="font-bold">Payment Method: E-Wallet</p>
                <p className="mt-4">Thank you for your order!</p>
              </div>
            </div>
          </div>

          {/* Cashier Copy */}
          <div className="text-center mt-8">
            <div className="mb-4">
              <h1 className="font-bold text-lg">Kuya Bert's Kitchenette</h1>
              <p className="text-sm">Sergio Osmeña St, Atimonan, 4331 Quezon</p>
              <p className="font-bold mt-3 text-base">ORDER SLIP</p>
              <p className="font-bold text-lg">ORDER #{orderNumber.replace('SI#', '')}</p>
              <p className="font-bold">{diningOption.toUpperCase()}</p>
              <p className="font-bold text-sm mt-1">*** CASHIER COPY ***</p>
            </div>

            <div className="text-sm mb-2">
              <p>
                {currentDate.toLocaleDateString()} {" "}
                {currentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="border-t border-b border-black py-2 my-2">
              {orderItems.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity} {item.name}
                    </span>
                    <span>₱{calculateItemTotal(item).toFixed(2)}</span>
                  </div>
                  
                  {item.addons && item.addons.length > 0 && (
                    <div className="text-xs text-left ml-4">
                      <span className="font-semibold">Add-ons: </span>
                      {item.addons.map((addon, idx) => (
                        <span key={idx}>
                          {addon.name}{addon.quantity > 1 && ` x${addon.quantity}`}
                          {idx < item.addons.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {(item.details || item.instructions) && (
                    <div className="text-xs text-left ml-4">
                      <span className="font-semibold">Note: </span>
                      <span>{item.details || item.instructions}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm">
                <p className="font-bold">Payment Method: E-Wallet</p>
                <p className="mt-4">Thank you for your order!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    {/* Default case - unrecognized payment method */}
    return null;
  }
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderState, setOrderState] = useState("processing");
  const [countdown, setCountdown] = useState(5);
  const printRef = useRef();

  const paymentMethod = location.state?.orderData?.paymentMethod || "cash";
  const paymentStatus = location.state?.paymentStatus;
  {/* Get order data from location state */}
  const orderData = location.state?.orderData;
  const orderItems = orderData?.items || JSON.parse(localStorage.getItem("cartItems") || "[]");
  const dbOrderNumber = orderData?.order_number;
  const diningOption = localStorage.getItem("diningOption") || "Dine In";

  const handlePrint = () => {
    window.print();
  };

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

  const handleNavigation = (path) => {
    clearCartData();
    window.location.href = path;
  };

  useEffect(() => {
    if (
      paymentMethod === "cash" ||
      (paymentMethod === "ewallet" && paymentStatus === "completed")
    ) {
      const timer = setTimeout(() => {
        setOrderState("complete");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentMethod, paymentStatus]);

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

  const handleScreenClick = () => {
    if (orderState === "complete") {
      handleNavigation("/home");
    }
  };

  useEffect(() => {
    return () => {
      if (orderState === "complete") {
        clearCartData();
      }
    };
  }, [orderState]);

  return (
    <div className="h-screen flex flex-col bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center bg-fixed print:bg-none overflow-hidden">
      <Header />

      <main
        className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center overflow-y-auto"
        onClick={handleScreenClick}
      >
        <div className="w-full max-w-4xl">
          <div className="space-y-6">
            {orderState === "processing" ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 animate-spin text-white no-print" />
                <h1 className="text-2xl font-bold text-white mb-6 no-print">
                  Processing your order
                </h1>
                <PrintableReceipt
                  orderItems={orderItems}
                  diningOption={diningOption}
                  printRef={printRef}
                  paymentMethod={paymentMethod}
                  dbOrderNumber={dbOrderNumber}
                />
                <button
                  onClick={handlePrint}
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 flex items-center justify-center mx-auto no-print"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-white text-center">
                <h1 className="text-3xl font-bold">Order Complete!</h1>
                <p className="text-xl">Thank you for ordering</p>
                <p>Click anywhere to return to menu</p>
                <p className="text-sm text-gray-300">
                  Auto-redirecting in {countdown} seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
