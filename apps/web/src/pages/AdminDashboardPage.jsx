import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatKobo,
  getAdminOverview,
  getAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
  updateAdminOrderAddress,
  processAdminRefund,
  adjustAdminProductStock,
  toggleAdminProductPublish,
  getAdminDeliveryZones,
  updateAdminDeliveryZone,
  getAdminOutbox,
  getProducts,
} from "../lib/api";

export function AdminDashboardPage() {
  const [token, setToken] = useState("dev-admin-token");
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'orders' | 'inventory' | 'zones' | 'outbox'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Overview stats
  const [stats, setStats] = useState(null);

  // Orders tab state
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState("");
  const [statusUpdateReason, setStatusUpdateReason] = useState("");
  const [addressForm, setAddressForm] = useState({
    streetAddress: "",
    areaLocality: "",
    landmark: "",
    deliveryNotes: "",
    reason: "",
  });
  const [refundReason, setRefundReason] = useState("");

  // Inventory tab state
  const [productsList, setProductsList] = useState([]);
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockDelta, setStockDelta] = useState(1);
  const [stockReason, setStockReason] = useState("");

  // Zones tab state
  const [zones, setZones] = useState([]);

  // Outbox tab state
  const [outboxMessages, setOutboxMessages] = useState([]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Load Overview Data
  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOverview(token);
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrders(token, {
        search: orderSearch,
        status: orderStatusFilter,
      });
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Inventory Products
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const prods = await getProducts();
      setProductsList(prods);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Delivery Zones
  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDeliveryZones(token);
      setZones(data.zones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load Outbox
  const loadOutbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOutbox(token);
      setOutboxMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tab switcher effect
  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    else if (activeTab === "orders") loadOrders();
    else if (activeTab === "inventory") loadProducts();
    else if (activeTab === "zones") loadZones();
    else if (activeTab === "outbox") loadOutbox();
  }, [activeTab]);

  // Open Order Details Modal
  const openOrderDetails = async (orderId) => {
    try {
      const data = await getAdminOrder(token, orderId);
      setSelectedOrder(data.order);
      setStatusUpdateTarget(data.order.status);
      setStatusUpdateReason("");
      setAddressForm({
        streetAddress: data.order.streetAddress,
        areaLocality: data.order.areaLocality,
        landmark: data.order.landmark || "",
        deliveryNotes: data.order.deliveryNotes || "",
        reason: "",
      });
      setRefundReason("");
      setOrderModalOpen(true);
    } catch (err) {
      alert("Failed to load order: " + err.message);
    }
  };

  // Handle Order Status Update
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await updateAdminOrderStatus(
        token,
        selectedOrder.id,
        statusUpdateTarget,
        statusUpdateReason || undefined
      );
      showNotification(`Order status updated to '${statusUpdateTarget}'!`);
      const updated = await getAdminOrder(token, selectedOrder.id);
      setSelectedOrder(updated.order);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Address Modification
  const handleUpdateAddress = async () => {
    if (!selectedOrder) return;
    if (!addressForm.reason.trim()) {
      alert("Please provide a reason for modifying the delivery address.");
      return;
    }
    try {
      await updateAdminOrderAddress(token, selectedOrder.id, addressForm);
      showNotification("Delivery address updated successfully!");
      const updated = await getAdminOrder(token, selectedOrder.id);
      setSelectedOrder(updated.order);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Refund Process
  const handleProcessRefund = async () => {
    if (!selectedOrder) return;
    if (!refundReason.trim()) {
      alert("A reason is required to approve and process a customer refund.");
      return;
    }
    if (!window.confirm("Are you sure you want to approve this refund and notify the payment gateway?")) {
      return;
    }
    try {
      await processAdminRefund(token, selectedOrder.id, refundReason);
      showNotification("Refund initiated successfully!");
      const updated = await getAdminOrder(token, selectedOrder.id);
      setSelectedOrder(updated.order);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Stock Adjustment
  const handleAdjustStock = async () => {
    if (!stockModalProduct) return;
    if (!stockReason.trim()) {
      alert("Please specify a reason for this inventory adjustment.");
      return;
    }
    try {
      await adjustAdminProductStock(
        token,
        stockModalProduct.id,
        Number(stockDelta),
        stockReason
      );
      showNotification("Stock adjusted successfully!");
      setStockModalProduct(null);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Product Publish Toggle
  const handleTogglePublish = async (prod) => {
    try {
      await toggleAdminProductPublish(token, prod.id, !prod.isPublished);
      showNotification(`Product ${!prod.isPublished ? "published" : "unpublished"}!`);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Zone Toggle
  const handleToggleZone = async (zone) => {
    try {
      await updateAdminDeliveryZone(token, zone.id, { isActive: !zone.isActive });
      showNotification(`Delivery zone ${zone.cityName} status updated!`);
      loadZones();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28">
      {/* Top Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-4 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-white text-lg">HOURLANE</span>
            <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30">
              Admin Portal
            </span>
          </div>

          {/* Dev Token Input & Public Store link */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 font-mono">Token:</span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin Token"
                className="bg-transparent border-none text-slate-300 font-mono focus:outline-none w-28 text-xs"
              />
            </div>
            <Link
              to="/"
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Public Store ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 flex space-x-1 sm:space-x-4">
          {[
            { id: "overview", label: "Overview" },
            { id: "orders", label: "Orders & Fulfilment" },
            { id: "inventory", label: "Watches & Stock" },
            { id: "zones", label: "Delivery Zones" },
            { id: "outbox", label: "Outbox Queue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "border-amber-400 text-amber-400 bg-amber-400/5"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Notifications */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        {successMsg && (
          <div className="p-4 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-200 text-sm mb-6 flex items-center justify-between animate-fade-in">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-sm mb-6 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">Store Performance</h1>
                <p className="text-sm text-slate-400 mt-1">Live metrics from your Neon PostgreSQL database.</p>
              </div>
              <button
                onClick={loadOverview}
                className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                ↻ Refresh Metrics
              </button>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Revenue</span>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">{formatKobo(stats.revenueKobo)}</p>
                <span className="text-xs text-slate-500 mt-1 block">From confirmed Paystack payments</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Paid Orders</span>
                <p className="text-3xl font-extrabold text-white mt-2">{stats.paidOrdersCount}</p>
                <span className="text-xs text-emerald-400 mt-1 block">Completed checkouts</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Fulfilment</span>
                <p className="text-3xl font-extrabold text-amber-300 mt-2">{stats.pendingFulfilmentCount}</p>
                <span className="text-xs text-slate-500 mt-1 block">Paid / processing orders</span>
              </div>

              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Out of Stock</span>
                <p className="text-3xl font-extrabold text-red-400 mt-2">{stats.outOfStockProductsCount}</p>
                <span className="text-xs text-slate-500 mt-1 block">Inventory depletion count</span>
              </div>
            </div>

            {/* Recent Orders table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-base font-semibold text-white">Recent Customer Orders</h2>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Manage All Orders →
                </button>
              </div>

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
                      <tr
                        key={ord.id}
                        onClick={() => {
                          setActiveTab("orders");
                          openOrderDetails(ord.id);
                        }}
                        className="hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <td className="py-4 px-6 font-mono text-xs text-amber-400 font-bold">{ord.orderNumber}</td>
                        <td className="py-4 px-6">{ord.customerName}</td>
                        <td className="py-4 px-6">{ord.snapshotProductName}</td>
                        <td className="py-4 px-6">{ord.snapshotDeliveryCity}</td>
                        <td className="py-4 px-6 font-semibold text-white">{formatKobo(ord.totalKobo)}</td>
                        <td className="py-4 px-6">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {ord.status.replaceAll("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & FULFILMENT */}
        {activeTab === "orders" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Orders & Fulfilment</h1>
                <p className="text-sm text-slate-400 mt-1">Manage lifecycle statuses, dispatch tracking, and customer refunds.</p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search order #, name, phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadOrders()}
                  className="bg-slate-900 border border-slate-800 text-sm px-3.5 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                  }}
                  className="bg-slate-900 border border-slate-800 text-sm px-3.5 py-2 rounded-xl text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refund_processing">Refund Processing</option>
                  <option value="refunded">Refunded</option>
                </select>

                <button
                  onClick={loadOrders}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-sm font-semibold px-4 py-2 rounded-xl transition"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-6">Order Number</th>
                      <th className="py-3 px-6">Customer</th>
                      <th className="py-3 px-6">Watch Purchased</th>
                      <th className="py-3 px-6">Delivery City</th>
                      <th className="py-3 px-6">Total (NGN)</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-6 font-mono text-xs text-amber-400 font-bold">
                            {ord.orderNumber}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-white">{ord.customerName}</p>
                            <p className="text-xs text-slate-400">{ord.customerPhone}</p>
                            <p className="text-xs text-slate-500">{ord.customerEmail}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-white font-medium">{ord.snapshotProductName}</p>
                            <p className="text-xs text-slate-400">{ord.snapshotBrand} • SKU: {ord.snapshotSku}</p>
                          </td>
                          <td className="py-4 px-6">{ord.snapshotDeliveryCity}</td>
                          <td className="py-4 px-6 font-semibold text-white">{formatKobo(ord.totalKobo)}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase border ${
                                ord.status === "paid"
                                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                  : ord.status === "processing"
                                  ? "bg-blue-950 text-blue-400 border-blue-800"
                                  : ord.status === "out_for_delivery"
                                  ? "bg-amber-950 text-amber-400 border-amber-800"
                                  : ord.status === "delivered"
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                                  : ord.status === "cancelled"
                                  ? "bg-slate-800 text-slate-400 border-slate-700"
                                  : ord.status === "refunded"
                                  ? "bg-purple-950 text-purple-400 border-purple-800"
                                  : "bg-slate-900 text-slate-400 border-slate-800"
                              }`}
                            >
                              {ord.status.replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => openOrderDetails(ord.id)}
                              className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                            >
                              Manage →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & WATCHES */}
        {activeTab === "inventory" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Watch Catalog & Inventory</h1>
                <p className="text-sm text-slate-400 mt-1">Adjust physical stock with audit reasons, toggle published status.</p>
              </div>
              <button
                onClick={loadProducts}
                className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                ↻ Refresh Catalog
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsList.map((prod) => (
                <div key={prod.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
                  <div>
                    {prod.images && prod.images[0] && (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-44 object-contain rounded-xl bg-slate-950/40 mb-4 p-2"
                      />
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-amber-400 uppercase font-semibold">{prod.brand}</span>
                        <h3 className="text-lg font-bold text-white mt-0.5">{prod.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {prod.sku}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          prod.stockQuantity > 0
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {prod.stockQuantity > 0 ? `${prod.stockQuantity} in stock` : "Out of Stock"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-slate-800/60 pt-3 text-sm">
                      <span className="text-slate-400">Retail Price:</span>
                      <span className="text-lg font-extrabold text-white">{formatKobo(prod.priceKobo)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => {
                        setStockModalProduct(prod);
                        setStockDelta(1);
                        setStockReason("");
                      }}
                      className="flex-1 text-xs py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition"
                    >
                      ± Adjust Stock
                    </button>
                    <button
                      onClick={() => handleTogglePublish(prod)}
                      className={`text-xs py-2 px-4 font-semibold rounded-xl transition ${
                        prod.isPublished
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {prod.isPublished ? "Published" : "Draft"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERY ZONES */}
        {activeTab === "zones" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">City Delivery Zones</h1>
                <p className="text-sm text-slate-400 mt-1">Configured fixed fees in NGN kobo for Lagos and Abuja.</p>
              </div>
              <button
                onClick={loadZones}
                className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                ↻ Refresh Zones
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {zones.map((zone) => (
                <div key={zone.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{zone.cityName}</h3>
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{zone.cityCode}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-amber-400 mt-2">{formatKobo(zone.feeKobo)}</p>
                    <p className="text-xs text-slate-500 mt-1">Fixed delivery fee applied at guest checkout</p>
                  </div>

                  <button
                    onClick={() => handleToggleZone(zone)}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                      zone.isActive
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {zone.isActive ? "Active Zone" : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: OUTBOX MONITORING */}
        {activeTab === "outbox" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">PostgreSQL Outbox Background Worker</h1>
                <p className="text-sm text-slate-400 mt-1">Real-time transactional email jobs processed asynchronously via database worker.</p>
              </div>
              <button
                onClick={loadOutbox}
                className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              >
                ↻ Refresh Outbox
              </button>
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-6">Event Type</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Attempts</th>
                      <th className="py-3 px-6">Last Error</th>
                      <th className="py-3 px-6">Created At</th>
                      <th className="py-3 px-6">Processed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {outboxMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          No outbox jobs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      outboxMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-6 font-mono text-xs text-amber-400">{msg.eventType}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase border ${
                                msg.status === "completed"
                                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                  : msg.status === "pending"
                                  ? "bg-amber-950 text-amber-400 border-amber-800"
                                  : "bg-red-950 text-red-400 border-red-800"
                              }`}
                            >
                              {msg.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs">{msg.attempts}</td>
                          <td className="py-4 px-6 text-xs text-red-300 max-w-xs truncate">
                            {msg.lastError || "—"}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {msg.processedAt ? new Date(msg.processedAt).toLocaleTimeString() : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL 1: ORDER MANAGEMENT MODAL --- */}
      {orderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase">Order Receipt</span>
                <h2 className="text-xl font-bold text-white mt-1">#{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Customer & Product Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-sm">
              <div>
                <span className="text-xs uppercase text-slate-500 font-semibold">Customer Details</span>
                <p className="font-bold text-white mt-1">{selectedOrder.customerName}</p>
                <p className="text-slate-400 text-xs">{selectedOrder.customerEmail}</p>
                <p className="text-slate-400 text-xs">{selectedOrder.customerPhone}</p>
              </div>

              <div>
                <span className="text-xs uppercase text-slate-500 font-semibold">Timepiece Snapshot</span>
                <p className="font-bold text-white mt-1">{selectedOrder.snapshotProductName}</p>
                <p className="text-slate-400 text-xs">{selectedOrder.snapshotBrand} • SKU: {selectedOrder.snapshotSku}</p>
                <p className="text-amber-400 text-xs font-bold mt-1">Total: {formatKobo(selectedOrder.totalKobo)}</p>
              </div>
            </div>

            {/* ACTION 1: Update Fulfilment Status */}
            <div className="border border-slate-800 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-bold text-white mb-3">1. Update Fulfilment Lifecycle Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={statusUpdateTarget}
                  onChange={(e) => setStatusUpdateTarget(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="paid">Paid</option>
                  <option value="processing">Processing (Packaging)</option>
                  <option value="out_for_delivery">Out for Delivery (Rider Dispatched)</option>
                  <option value="delivered">Delivered (Handed to Customer)</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <input
                  type="text"
                  placeholder="Audit reason / courier notes (optional)"
                  value={statusUpdateReason}
                  onChange={(e) => setStatusUpdateReason(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 sm:col-span-2"
                />
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleUpdateStatus}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Save Status & Enqueue Notification
                </button>
              </div>
            </div>

            {/* ACTION 2: Pre-dispatch Address Modification */}
            <div className="border border-slate-800 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-white">2. Modify Delivery Address (Pre-dispatch)</h3>
                {selectedOrder.status !== "paid" && selectedOrder.status !== "processing" && (
                  <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    Locked: Order is already {selectedOrder.status.replaceAll("_", " ")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Street Address"
                  value={addressForm.streetAddress}
                  disabled={selectedOrder.status !== "paid" && selectedOrder.status !== "processing"}
                  onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="Area / Locality"
                  value={addressForm.areaLocality}
                  disabled={selectedOrder.status !== "paid" && selectedOrder.status !== "processing"}
                  onChange={(e) => setAddressForm({ ...addressForm, areaLocality: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white disabled:opacity-50"
                />
              </div>

              <input
                type="text"
                placeholder="Reason for modifying address (Required for audit history)*"
                value={addressForm.reason}
                disabled={selectedOrder.status !== "paid" && selectedOrder.status !== "processing"}
                onChange={(e) => setAddressForm({ ...addressForm, reason: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white mb-3 disabled:opacity-50"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleUpdateAddress}
                  disabled={selectedOrder.status !== "paid" && selectedOrder.status !== "processing"}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Save New Address
                </button>
              </div>
            </div>

            {/* ACTION 3: Refund Process */}
            <div className="border border-red-950/80 bg-red-950/20 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-bold text-red-300 mb-2">3. Issue Refund</h3>
              <p className="text-xs text-slate-400 mb-3">
                Initiates an automated reversal via Paystack to the customer's original payment method. The store absorbs transaction fees.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Mandatory refund approval reason*"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                />
                <button
                  onClick={handleProcessRefund}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Initiate Refund
                </button>
              </div>
            </div>

            {/* Audit History Log */}
            {selectedOrder.statusEvents && selectedOrder.statusEvents.length > 0 && (
              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Audit Trail History</h4>
                <div className="space-y-2">
                  {selectedOrder.statusEvents.map((evt) => (
                    <div key={evt.id} className="text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-300">
                          {evt.fromStatus ? `${evt.fromStatus} → ` : ""}
                          <span className="text-amber-400">{evt.toStatus}</span>
                        </span>
                        {evt.reason && <p className="text-slate-400 mt-0.5">{evt.reason}</p>}
                      </div>
                      <div className="text-right text-slate-500 font-mono">
                        <p>{evt.triggeredBy}</p>
                        <p>{new Date(evt.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: INVENTORY ADJUSTMENT MODAL --- */}
      {stockModalProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white">Adjust Watch Inventory</h3>
            <p className="text-sm text-slate-400 mt-1">
              {stockModalProduct.name} (Current Stock: {stockModalProduct.stockQuantity})
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Quantity Delta (+ or - units)</label>
                <input
                  type="number"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Mandatory Audit Reason*</label>
                <input
                  type="text"
                  placeholder="e.g. Received new shipment from Geneva distributor"
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="text-xs px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
              >
                Commit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
