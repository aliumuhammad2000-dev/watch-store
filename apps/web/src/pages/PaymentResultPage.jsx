import React from "react";
import { useSearchParams, Link } from "react-router-dom";

export function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || searchParams.get("reference");
  const isMock = searchParams.get("mock_success") === "true";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/60 p-8 rounded-2xl border border-slate-800 text-center">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Payment Initiated
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Thank you for your order. We are verifying the payment webhook from Paystack. A confirmation email with your personal order tracker has been dispatched.
        </p>

        {orderNumber && (
          <div className="p-3.5 bg-slate-900/80 rounded-xl mb-6 text-xs text-slate-300 font-mono">
            Reference: {orderNumber}
          </div>
        )}

        {isMock && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs mb-6">
            🛠️ <strong>Development Mode:</strong> Simulated checkout return completed.
          </div>
        )}

        <Link
          to="/"
          className="inline-block w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition text-center"
        >
          Return to All Watches
        </Link>
      </div>
    </div>
  );
}
