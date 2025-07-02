import React, { useState, useRef, useEffect } from "react";
import { supabase } from '../supabaseClient';

{/* Helper function for status badge styles */}
export const getStatusClasses = (status) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const PaymentHistory = ({ searchTerm, setSearchTerm }) => {
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const printSectionRef = useRef(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('payment_table')
        .select('pymnt_id, fk_trans_id, pymnt_ref_id, order_number, pymnt_mthod, pymnt_status, pymnt_amount, pymnt_date, pymnt_time')
        .order('pymnt_id', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }
      setAllPayments(data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.message || 'Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  };

  {/* Fetch payments from Supabase */}
  useEffect(() => {
    fetchPayments();

    const channel = supabase
      .channel('custom-payment-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_table' },
        (payload) => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  {/* Handle print functionality */}
  const handlePrint = () => {
    if (selectedPayment) {
      const currentDate = new Date();
      
      {/* Calculate subtotal and VAT */}
      const subtotal = selectedPayment.amount / 1.12;
      const vatAmount = selectedPayment.amount - subtotal;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ORN: ${selectedPayment.orn}</title>
            <style>
              @page {
                size: 80mm 297mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 0;
                width: 80mm;
                background-color: white;
              }
              .receipt {
                width: 100%;
                padding: 5mm;
                box-sizing: border-box;
                text-align: center;
              }
              .receipt-header {
                margin-bottom: 5mm;
              }
              .receipt-header h1 {
                font-size: 16pt;
                margin: 0 0 2mm 0;
              }
              .receipt-header p {
                font-size: 9pt;
                margin: 0 0 1mm 0;
              }
              .receipt-details {
                font-size: 9pt;
                margin-bottom: 3mm;
                text-align: left;
              }
              .receipt-details p {
                margin: 0 0 1mm 0;
              }
              .receipt-items {
                border-top: 1px dashed black;
                border-bottom: 1px dashed black;
                padding: 2mm 0;
                margin: 2mm 0;
                text-align: left;
              }
              .item {
                margin-bottom: 2mm;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
              }
              .receipt-summary {
                font-size: 9pt;
                text-align: left;
              }
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1mm;
              }
              .bold {
                font-weight: bold;
              }
              .receipt-footer {
                margin-top: 5mm;
                font-size: 9pt;
                border-top: 1px dashed black;
                padding-top: 2mm;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="receipt-header">
                <h1>Kuya Bert's Kitchenette</h1>
                <p>Sergio Osmeña St, Atimonan, 4331 Quezon</p>
                <p>facebook.com/KuyaBertKitchenette</p>
                <p class="bold">PAYMENT RECEIPT</p>
              </div>
              
              <div class="receipt-details">
                <p>Official Receipt Number: ${selectedPayment.orn}</p>
                <p>Payment Method: ${selectedPayment.method}</p>
                <p>Status: ${selectedPayment.status}</p>
                <p>Date: ${selectedPayment.date} Time: ${currentDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}</p>
              </div>
              
              <div class="receipt-items">
                ${selectedPayment.details
                  .filter(detail => detail.item.toLowerCase() !== "tax")
                  .map((detail, index) => `
                    <div class="item">
                      <div class="item-row">
                        <span>${detail.item}</span>
                        <span>₱${detail.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  `).join('')}
              </div>
              
              <div class="receipt-summary">
                <div class="summary-row">
                  <span>Subtotal</span>
                  <span>₱${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span>VAT (12%)</span>
                  <span>₱${vatAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row bold">
                  <span>TOTAL AMOUNT</span>
                  <span>₱${selectedPayment.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="receipt-footer">
                THANK YOU, AND PLEASE COME AGAIN.
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  {/* Dummy data - replaced by allPayments state */}
  const dummyPayments = [
    {
      orn: "420",
      amount: 396, // 296 + 100
      method: "Cash",
      status: "Completed",
      date: "30/11/24",
      details: [
        { item: "Food and Beverages", amount: 296 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      orn: "419",
      amount: 550, // 450 + 100
      method: "Credit Card",
      status: "Processing",
      date: "29/11/24",
      details: [
        { item: "Food and Beverages", amount: 450 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      orn: "418",
      amount: 120, // 100 + 20
      method: "GCash",
      status: "Completed",
      date: "28/11/24",
      details: [
        { item: "Food and Beverages", amount: 100 },
        { item: "Tax", amount: 20 },
      ],
    },
    {
      orn: "417",
      amount: 850, // 750 + 100
      method: "Bank Transfer",
      status: "Pending",
      date: "27/11/24",
      details: [
        { item: "Catering Services", amount: 750 },
        { item: "Tax", amount: 100 },
      ],
    },
    {
      orn: "416",
      amount: 50,
      method: "Cash",
      status: "Failed",
      date: "26/11/24",
      details: [
        { item: "Take-out Order", amount: 50 },
        // No tax item example
      ],
    },
  ];

  {/* Filtered payments based on searchTerm */}
  const filteredPayments = searchTerm
    ? allPayments.filter(
        (payment) =>
          payment.order_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.pymnt_ref_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.pymnt_mthod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.pymnt_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.pymnt_date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.pymnt_amount.toString().includes(searchTerm)
      )
    : allPayments;

  {/* Reset selected payment if filtered out */}
  useEffect(() => {
    if (
      selectedPayment &&
      !filteredPayments.some((p) => p.pymnt_id === selectedPayment.pymnt_id)
    ) {
      setSelectedPayment(null);
    }
  }, [filteredPayments, selectedPayment]);

  return (
    <div className="p-4">
      {/* Responsive flex layout: column on small, row on medium+ */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Payment list */}
        <div className="w-full md:w-1/2 flex flex-col min-h-[200px]">
          <div className="sticky top-0 z-20 bg-white py-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full p-2 bg-gray-100 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={() => fetchPayments()}
              className="p-2 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.13-6.36M20 15a9 9 0 01-14.13 6.36" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[calc(80vh-56px)]">
            <table className="w-full border-collapse text-sm min-w-[600px] md:min-w-full">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="border p-2 text-left font-semibold w-20">ORN</th>
                  <th className="border p-2 text-left font-semibold w-32">Amount</th>
                  <th className="border p-2 text-left font-semibold">Method</th>
                  <th className="border p-2 text-left font-semibold w-24">Status</th>
                  <th className="border p-2 text-left font-semibold w-28">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-500">Loading payments...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-red-500">Error: {error}</td>
                  </tr>
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.pymnt_id}
                      className={`cursor-pointer hover:bg-gray-100 ${
                        selectedPayment?.pymnt_id === payment.pymnt_id
                          ? "bg-orange-100"
                          : "bg-white"
                      }`}
                      onClick={() => {
                        setSelectedPayment({
                          pymnt_id: payment.pymnt_id, // Keep for selection tracking
                          orn: payment.order_number, // Map to 'orn' for details panel/print
                          amount: payment.pymnt_amount,
                          method: payment.pymnt_mthod,
                          status: payment.pymnt_status,
                          date: payment.pymnt_date,
                          time: payment.pymnt_time,
                          ref_number: payment.pymnt_ref_id,
                          /* Construct details for receipt */
                          details: [ 
                            { item: "Total Payment", amount: payment.pymnt_amount }
                          ],
                        });
                      }}
                    >
                      <td className="border p-2 whitespace-nowrap">
                        {payment.order_number} {/* Display order_number from payment_table */}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        ₱{payment.pymnt_amount.toFixed(2)}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {payment.pymnt_mthod}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(
                            payment.pymnt_status
                          )}`}
                        >
                          {payment.pymnt_status}
                        </span>
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {new Date(`${payment.pymnt_date}T${payment.pymnt_time}`).toLocaleString('en-US', { timeZone: 'Asia/Manila' })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-500">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side - Payment details */}
        <div className="w-full md:w-1/2 overflow-auto max-h-[80vh] min-h-[200px]">
          {selectedPayment ? (
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 h-full">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Payment Details
                </h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint();
                  }}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm print:hidden flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
              <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-semibold">Official Receipt Number:</span> {selectedPayment.orn}</p>
                  <p><span className="font-semibold">Date:</span> {selectedPayment.date}</p>
                  <p><span className="font-semibold">Payment Method:</span> {selectedPayment.method}</p>
                  <p>
                    <span className="font-semibold">Status:</span> 
                    <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(selectedPayment.status)}`}>
                      {selectedPayment.status}
                    </span>
                  </p>
                  <p className="col-span-2"><span className="font-semibold">Reference Number:</span> {selectedPayment.ref_number}</p>
                </div>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                <table className="w-full border-collapse text-sm mb-4">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="border p-2 text-left font-semibold">Item</th>
                      <th className="border p-2 text-right font-semibold w-32">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Filter out 'Tax' items before mapping */}
                    {selectedPayment.details
                      .filter((detail) => detail.item.toLowerCase() !== "tax")
                      .map((detail, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border p-2">{detail.item}</td>
                          <td className="border p-2 text-right">
                            ₱{detail.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  {/* Total row still shows the original full amount */}
                  <tfoot className="bg-gray-50">
                    <tr className="font-semibold text-gray-700">
                      <td className="border p-2 text-right">Total</td>
                      <td className="border p-2 text-right">
                        ₱{selectedPayment.amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 min-h-[200px]">
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-700">No payment selected</h3>
                <p className="mt-1 text-sm text-gray-500">Select a payment from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;