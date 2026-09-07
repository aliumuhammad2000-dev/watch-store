import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderStatus, formatKobo } from "../lib/api";

const STATUS_STEPS = [
  { key: "pending_payment", label: "Order Created" },
  { key: "paid", label: "Payment Confirmed" },
  { key: "processing", label: "Processing Order" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

export function OrderStatusPage() {
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    getOrderStatus(token)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "This order status link is invalid or expired."}</p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    );
  }

  // Determine current step index
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      <header className="border-b border-slate-800 py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-wider text-white">
            HOURLANE <span className="text-amber-400 text-xs uppercase tracking-widest font-normal">Watches</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">Order #{order.orderNumber}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Official Order Tracker
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">
            Status: {order.status.replace("_", " ").toUpperCase()}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bookmarked for {order.customerName} • Placed on {new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}
          </p>
        </div>

        {/* Visual Progress Timeline */}
        <div className="bg-slate-800/40 p-6 sm:p-8 rounded-2xl border border-slate-800 mb-10">
          <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = currentIndex >= idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={step.key} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative z-10 flex-1 text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isCompleted
                        ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-amber-400 font-bold" : isCompleted ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Timepiece & Payment Summary */}
          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timepiece Purchased</h2>
            <div>
              <p className="text-xs text-amber-400 font-semibold">{order.brand}</p>
              <h3 className="text-lg font-bold text-white">{order.productName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">SKU: {order.sku}</p>
            </div>

            <div className="pt-4 border-t border-slate-700/60 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Unit Price</span>
                <span className="text-white font-medium">{formatKobo(order.unitPriceKobo)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee ({order.deliveryCity})</span>
                <span className="text-white font-medium">{formatKobo(order.deliveryFeeKobo)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700/60 font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-amber-400 text-lg">{formatKobo(order.totalKobo)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Address</h2>
            <div className="text-sm text-slate-300 leading-relaxed">
              <p className="font-semibold text-white">{order.customerName}</p>
              <p>{order.streetAddress}</p>
              <p>{order.areaLocality}, {order.deliveryCity}</p>
              <p className="text-xs text-slate-500 mt-4">Estimated delivery: 2–5 business days.</p>
            </div>

            <div className="pt-4 border-t border-slate-700/60">
              <p className="text-xs text-slate-400">
                Need to update your delivery address or contact support? Email <strong className="text-white">support@hourlane.com</strong> with Order #{order.orderNumber}.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
