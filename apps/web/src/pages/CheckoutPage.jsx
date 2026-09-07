import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, getDeliveryZones, createCheckout, formatKobo } from "../lib/api";

export function CheckoutPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    deliveryZoneId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    streetAddress: "",
    areaLocality: "",
    landmark: "",
    deliveryNotes: "",
    termsAccepted: false,
  });

  useEffect(() => {
    if (!productId) return;
    Promise.all([getProduct(productId), getDeliveryZones()])
      .then(([prodData, zonesData]) => {
        setProduct(prodData);
        setZones(zonesData);
        if (zonesData.length > 0) {
          setFormData((prev) => ({ ...prev, deliveryZoneId: zonesData[0].id }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const selectedZone = zones.find((z) => z.id === formData.deliveryZoneId);
  const subtotalKobo = product?.priceKobo || 0;
  const deliveryFeeKobo = selectedZone?.feeKobo || 0;
  const totalKobo = subtotalKobo + deliveryFeeKobo;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setError("Please accept the Terms and Conditions to proceed.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createCheckout({
        productId: product.id,
        deliveryZoneId: formData.deliveryZoneId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        streetAddress: formData.streetAddress,
        areaLocality: formData.areaLocality,
        landmark: formData.landmark || undefined,
        deliveryNotes: formData.deliveryNotes || undefined,
        termsAccepted: true,
      });

      // Redirect directly to Paystack hosted checkout
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err.message || "Failed to initialize payment");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (!product || product.stockQuantity <= 0) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Unavailable for Purchase</h2>
          <p className="text-slate-400 mb-6">This watch is currently sold out or no longer in catalog.</p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
          >
            ← Return to All Watches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24">
      <header className="border-b border-slate-800 py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-lg font-bold tracking-wider text-white">
            HOURLANE <span className="text-amber-400 text-xs uppercase tracking-widest font-normal">Watches</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">🔒 Secure Checkout</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="mb-8">
          <Link to={`/product/${product.id}`} className="text-xs text-slate-400 hover:text-amber-400 transition">
            ← Cancel and return to watch details
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">Guest Checkout</h1>
          <p className="text-sm text-slate-400 mt-1">No account needed. Enter your Nigerian delivery details below.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-950/60 border border-red-800 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            {/* Contact Details */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-semibold text-white uppercase tracking-wider text-xs">
                1. Customer Contact
              </h2>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="e.g. Chidi Obi"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">Order receipt & tracking link will be sent here.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Nigerian Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">For delivery driver dispatch.</p>
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-base font-semibold text-white uppercase tracking-wider text-xs">
                2. Delivery Destination
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Delivery City Zone *
                </label>
                <select
                  name="deliveryZoneId"
                  value={formData.deliveryZoneId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                >
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.cityName} ({formatKobo(zone.feeKobo)} fixed delivery fee)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  placeholder="Plot 14, Adeola Odeku Street"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    name="areaLocality"
                    value={formData.areaLocality}
                    onChange={handleChange}
                    placeholder="e.g. Victoria Island, Lekki, Wuse 2"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Closest Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="e.g. Opposite Eko Hotel"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  name="deliveryNotes"
                  rows={2}
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                  placeholder="e.g. Call before arrival, leave at security gate"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition resize-none"
                />
              </div>
            </div>

            {/* Terms Acceptance */}
            <div className="p-4 bg-slate-800/20 rounded-xl border border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-400 leading-relaxed">
                  I accept the Terms and Conditions and understand that delivery takes 2–5 business days within Nigeria.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-8 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-xl text-center shadow-lg shadow-amber-500/20 transition text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Reserving watch & connecting to Paystack...</span>
                </>
              ) : (
                <span>Proceed to Paystack Payment • {formatKobo(totalKobo)}</span>
              )}
            </button>
          </form>

          {/* Order Summary Column */}
          <aside className="lg:col-span-5 bg-slate-800/50 p-6 rounded-2xl border border-slate-800 sticky top-8">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Order Summary
            </h2>

            <div className="flex gap-4 pb-6 border-b border-slate-700/60 mb-6">
              <div className="w-20 h-20 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700/50">
                <img
                  src={product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{product.brand}</p>
                <h3 className="text-sm font-bold text-white mt-0.5">{product.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Quantity: 1</p>
                <p className="text-sm font-semibold text-white mt-2">{formatKobo(product.priceKobo)}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm pb-6 border-b border-slate-700/60 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Watch Subtotal</span>
                <span className="text-white font-medium">{formatKobo(subtotalKobo)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery ({selectedZone?.cityName || "Select city"})</span>
                <span className="text-white font-medium">{formatKobo(deliveryFeeKobo)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mb-6">
              <span className="text-base font-bold text-white">Final Total</span>
              <span className="text-2xl font-extrabold text-amber-400">{formatKobo(totalKobo)}</span>
            </div>

            <div className="p-3.5 bg-slate-900/60 rounded-xl text-xs text-slate-400 leading-relaxed border border-slate-800">
              🛡️ <strong>15-Minute Reservation:</strong> Submitting checkout reserves this timepiece for 15 minutes while you complete payment on Paystack.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
