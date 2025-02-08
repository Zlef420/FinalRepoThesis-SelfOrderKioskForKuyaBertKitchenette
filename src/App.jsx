// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import IntroPage from "./pages/IntroPage";
import ReviewOrder from "./pages/ReviewOrder";
import CashierScreen from "./pages/CashierScreen";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/Home";
import OrderConfirmation from "./pages/OrderConfirmation";

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="flex flex-col h-screen">
          <Routes>
            <Route path="/" element={<IntroPage />} />
            <Route path="/review-order" element={<ReviewOrder />} />
            <Route path="/cashier-screen" element={<CashierScreen />} />
            <Route path="/admin-page" element={<AdminPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/order-conf" element={<OrderConfirmation />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
