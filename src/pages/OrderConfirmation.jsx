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
  refNumber,
}) => {
  const orderNumber = dbOrderNumber ? String(dbOrderNumber) : `SI#${Math.floor(Math.random() * 10000000)}`;
  const currentDate = new Date();

  if (paymentMethod === "cash") {
    return (
      <div
        ref={printRef}
        className="bg-white p-2 rounded-lg shadow-lg w-[80mm] font-mono text-black print:shadow-none print:w-[80mm] print:p-1"
      >
        <style type="text/css" media="print">
          {`
            @page { size: 80mm auto; margin: 1.5mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; font-size: 10pt; }
              .no-print { display: none !important; }
            }
          `}
        </style>
        <div id="printable-receipt" className="text-xs">
            <div className="text-center mb-2">
                <h1 className="font-bold text-sm">Kuya Bert's Kitchenette</h1>
                <p>Zone 2 Osmena St. Atimonan, Quezon</p>
                <p>Contact No. 0907-321-6764</p>
                <p>Like us on FB: KuyaBertKitchenette</p>
            </div>
            <div className="border-t-2 border-dashed border-black my-2"></div>
            <h2 className="text-center font-bold my-2 text-sm">ORDER SLIP</h2>
            <div className="flex justify-between">
                <span>Dining Option:</span>
                <span className="font-bold">{diningOption}</span>
            </div>
            <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold">Cash</span>
            </div>
            <div className="flex justify-between">
                <span>Order Number:</span>
                <span className="font-bold">#{orderNumber.replace('SI#', '')}</span>
            </div>
            <p className="text-center my-2">
                {currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} {' '}
                {currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
            <div className="border-t-2 border-dashed border-black my-2"></div>
            <div className="text-center mt-2">
                <p>Please give this to cashier</p>
                <p>to process your order.</p>
            </div>
        </div>
      </div>
    );
  } else if (paymentMethod === "ewallet") {
    const calculateItemTotal = (item) => {
      if (item.itemTotal) return item.itemTotal;
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
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const ReceiptContent = ({ copyType }) => (
      <div className={copyType === 'Customer' ? 'receipt-copy' : ''}>
        <div className="text-center">
          <img src="/images/photos/kuyabertlogo.jpg" alt="Logo" className="w-20 h-20 mx-auto mb-2" />
          <p className="text-xs">Zone 2 Osmena St. Atimonan, Quezon</p>
          <p className="text-xs">Contact No. 0907-321-6764</p>
          <p className="text-xs">Like us on FB: KuyaBertKitchenette</p>
        </div>
        <div className="border-t-2 border-dashed border-black my-2"></div>
        <div className="text-xs">

          <div className="flex justify-between">
            <span>Dining Option:</span><span className="font-bold">{diningOption}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span><span className="font-bold">E-Wallet</span>
          </div>
          <div className="flex justify-between">
            <span>Order Number:</span><span className="font-bold">#{dbOrderNumber}</span>
          </div>
          <p className="text-center">{formattedDate} {formattedTime}</p>
          <p>Reference Number:</p>
          <p className="break-all font-semibold">{refNumber}</p>
        </div>
        <div className="border-t-2 border-dashed border-black my-2"></div>
        <div className="text-xs">
          {orderItems.map((item, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span>{item.name}</span>
                <span>₱{calculateItemTotal(item).toFixed(2)}</span>
              </div>
              <div className="pl-2">
                <span>{item.quantity}x</span>
                <span className="ml-2">₱{item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-black my-2"></div>
        <div className="flex justify-between font-bold text-base">
          <span>Amount due</span>
          <span>₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="border-t-2 border-dashed border-black my-2"></div>
        <div className="text-center text-xs mt-2 space-y-1">
          <p>Thank you so much for Dining with us!</p>
          <p>See you again Ka-Berts ❤️</p>
          <p>Customer Care Hotline</p>
          <p>(TNT) 0907-321-6764</p>
          <p className="font-bold pt-1">&lt;&lt; {copyType}'s Copy &gt;&gt;</p>
        </div>
      </div>
    );

    return (
      <div ref={printRef} className="bg-white p-2 rounded-lg shadow-lg w-[80mm] font-mono text-black print:shadow-none print:w-[80mm] print:p-1">
        <style type="text/css" media="print">
          {`
            @page { size: 80mm auto; margin: 1.5mm; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; font-size: 9pt; }
              .receipt-copy { page-break-after: always; }
              .no-print { display: none !important; }
            }
          `}
        </style>
        <div id="printable-receipt">
          <ReceiptContent copyType="Customer" />
          <ReceiptContent copyType="Cashier" />
        </div>
      </div>
    );
  } else {
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
  const orderData = location.state?.orderData;
  const orderItems = orderData?.items || JSON.parse(localStorage.getItem("cartItems") || "[]");
  const dbOrderNumber = orderData?.order_number;
  const refNumber = orderData?.ref_number;
  const diningOption = localStorage.getItem("diningOption") || "Dine In";

  useEffect(() => {
    if (orderState === 'processing') {
      const printTimer = setTimeout(() => {
        window.print();
      }, 1000); // Delay printing slightly to ensure content is rendered

      return () => clearTimeout(printTimer);
    }
  }, [orderState]);

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
                  refNumber={refNumber}
                />
                {/* The print button is removed as requested */}
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
