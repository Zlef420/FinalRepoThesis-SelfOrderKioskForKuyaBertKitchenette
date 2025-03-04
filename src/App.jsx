import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";

import IntroPage from "./pages/IntroPage";
import ReviewOrder from "./pages/ReviewOrder";
import CashierScreen from "./pages/CashierScreen";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/Home";
import OrderConfirmation from "./pages/OrderConfirmation";
import EWallet from "./pages/EWalletPayment";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="flex flex-col h-screen">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<IntroPage />} />
              <Route path="/review-order" element={<ReviewOrder />} />
              <Route
                path="/cashier-screen"
                element={
                  <ProtectedRoute allowedRole="cashier">
                    <CashierScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-page"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/home" element={<HomePage />} />
              <Route path="/order-conf" element={<OrderConfirmation />} />
              <Route path="/ewallet-payment" element={<EWallet />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
