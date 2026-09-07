import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { PaymentResultPage } from "./pages/PaymentResultPage";
import { OrderStatusPage } from "./pages/OrderStatusPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/checkout/:productId" element={<CheckoutPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/order-status/:token" element={<OrderStatusPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
