import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatKobo } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export function AdminDashboardPage() {
  const [token, setToken] = useState("dev-admin-token");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Unauthorized");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-white text-lg">HOURLANE</span>
            <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition">
              View Public Store
            </Link>
            <button
              onClick={fetchOverview}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Store Overview</h1>
            <p className="text-sm text-slate-400 mt-1">Live metrics from your Neon PostgreSQL database.</p>
          </div>

          {/* Dev Token Switcher */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 font-mono">Auth:</span>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
              className="bg-transparent border-none text-slate-300 font-mono focus:outline-none w-32"
            />
            <button
              onClick={fetchOverview}
              className="text-amber-400 font-medium hover:underline"
            >
              Apply
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm mb-8">
            {error} (Hint: Use `dev-admin-token` for local development)
          </div>
        )}

        {loading && !stats && (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Connecting to database...</p>
          </div>
        )}

        {stats && (
          <>
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Revenue</span>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">{formatKobo(stats.revenueKobo)}</p>
                <span className="text-xs text-slate-500 mt-1 block">From confirmed Paystack orders</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Paid Orders</span>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.paidOrdersCount}</p>
                <span className="text-xs text-emerald-400 mt-1 block">Fully verified payments</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Fulfilment</span>
                <p className="text-3xl font-extrabold text-amber-300 mt-2">{stats.pendingFulfilmentCount}</p>
                <span className="text-xs text-slate-500 mt-1 block">Awaiting merchant dispatch</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Out of Stock</span>
                <p className="text-3xl font-extrabold text-red-400 mt-2">{stats.outOfStockProductsCount}</p>
                <span className="text-xs text-slate-500 mt-1 block">Watches at 0 inventory</span>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-base font-semibold text-white">Recent Customer Orders</h2>
                <span className="text-xs text-slate-400">{stats.recentOrders.length} orders recorded</span>
              </div>

              {stats.recentOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  No orders have been placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-6">Order #</th>
                        <th className="py-3 px-6">Customer</th>
                        <th className="py-3 px-6">Watch</th>
                        <th className="py-3 px-6">City</th>
                        <th className="py-3 px-6">Total</th>
                        <th className="py-3 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {stats.recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-6 font-mono text-xs text-amber-400">
                            {ord.orderNumber}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-white">{ord.customerName}</p>
                            <p className="text-xs text-slate-500">{ord.customerPhone}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-white">{ord.snapshotProductName}</p>
                            <p className="text-xs text-slate-500">{ord.snapshotBrand}</p>
                          </td>
                          <td className="py-4 px-6 text-slate-300">{ord.snapshotDeliveryCity}</td>
                          <td className="py-4 px-6 font-semibold text-white">{formatKobo(ord.totalKobo)}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase ${
                                ord.status === "paid"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : ord.status === "pending_payment"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {ord.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
