import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";

const EWalletPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeString, setQrCodeString] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  const { orderData, paymentSource } = location.state || {};

  useEffect(() => {
    if (!orderData || !paymentSource) {
      toast.error("Missing order or payment data. Redirecting to home.");
      navigate("/home");
      return;
    }

    const checkoutUrl = paymentSource.data.attributes.redirect.checkout_url;
    if (checkoutUrl) {
      setQrCodeString(checkoutUrl);
    } else {
      setError("Failed to retrieve QR code URL from PayMongo.");
      toast.error("Invalid payment source data received.");
    }

    const insertInitialPayment = async () => {
      try {
        // Check if a payment record with this ref_id already exists
        const { data: existingPayment, error: fetchError } = await supabase
          .from("payment_table")
          .select("pymnt_ref_id")
          .eq("pymnt_ref_id", paymentSource.data.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for a new payment
          throw fetchError;
        }

        if (existingPayment) {
          console.log("Payment record already exists for this reference ID. Skipping insertion.");
          return; // Do not insert if it already exists
        }

        const { error: transError } = await supabase
          .from("trans_table")
          .update({ pymnt_method: "E-Wallet" })
          .eq("trans_id", orderData.trans_id);

        if (transError) throw transError;

        const currentDate = new Date();
        const paymentData = {
          fk_trans_id: orderData.trans_id,
          pymnt_ref_id: paymentSource.data.id,
          order_number: orderData.order_number,
          pymnt_mthod: "E-Wallet",
          pymnt_status: "Pending",
          pymnt_amount: orderData.totalAmount,
          pymnt_date: currentDate.toISOString().split("T")[0],
          pymnt_time: currentDate.toTimeString().split(" ")[0],
        };

        const { error: paymentError } = await supabase
          .from("payment_table")
          .insert([paymentData]);

        if (paymentError) throw paymentError;
      } catch (error) {
        console.error("Error inserting initial payment:", error);
        toast.error("Failed to initialize payment.");
      }
    };

    insertInitialPayment();
  }, [orderData, paymentSource, navigate]);

  useEffect(() => {
    const paymentId = paymentSource?.data?.id;
    if (!paymentId) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('payment_table')
          .select('pymnt_status')
          .eq('pymnt_ref_id', paymentId)
          .single();

        if (error) {
          // This is expected if the row doesn't exist yet or RLS fails.
          // We can silently ignore it and let the polling continue.
          return;
        }

        if (data && data.pymnt_status === 'Paid') {
          setPaymentStatus('Paid');
          toast.success('Payment successful!');
          clearInterval(interval); // Stop polling
          setTimeout(() => {
            navigate('/order-conf', {
              state: {
                paymentMethod: 'ewallet',
                paymentStatus: 'completed',
                orderData: orderData,
              },
            });
          }, 1500);
        }
      } catch (err) {
        console.error('Error polling for payment status:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup function to stop polling when the component unmounts
    return () => {
      clearInterval(interval);
    };
  }, [orderData, paymentSource, navigate]);

  if (!orderData) return null;

  return (
    <div className="h-screen flex flex-col bg-[url('../../public/images/photos/bgblack.jpg')] bg-cover bg-center bg-fixed">
      <Header />
      <main className="flex-1 container mx-auto px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Scan QR Code to Pay with GCash</h2>
            <div className="bg-white p-4 h-auto w-auto mx-auto mb-4 flex items-center justify-center border-2 border-gray-200">
              {isLoading ? (
                <span className="text-gray-500">Generating QR...</span>
              ) : error ? (
                <span className="text-red-500 text-sm p-2">{error}</span>
              ) : qrCodeString ? (
                <QRCode value={qrCodeString} size={180} />
              ) : (
                <span className="text-gray-500">QR Code not available.</span>
              )}
            </div>
            <div className="font-semibold text-lg">
              Total Amount: ₱{orderData.totalAmount.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="w-full py-3 rounded font-semibold text-white bg-blue-600">
              {paymentStatus === "Paid" ? "Payment Successful!" : "Waiting for Payment..."}
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 w-full py-2 bg-red-500 hover:bg-red-600 rounded font-semibold border-black transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EWalletPayment;
