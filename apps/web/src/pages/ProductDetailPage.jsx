import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, formatKobo } from "../lib/api";

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading timepiece specifications...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Watch Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "This timepiece is no longer available."}</p>
          <Link
            to="/"
            className="inline-block py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition"
          >
            ← Back to All Watches
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = product.stockQuantity <= 0;
  const images = product.images.length > 0 ? product.images : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <Link
          to="/"
          className="text-sm font-medium text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1 mb-8"
        >
          ← Back to All Watches
        </Link>
      </div>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div>
          <div className="aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 mb-4">
            <img
              src={images[selectedImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                    selectedImageIndex === idx ? "border-amber-400" : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Buy Now */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                {product.brand}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-3xl font-extrabold text-white">
                {formatKobo(product.priceKobo)}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded uppercase">
                Brand New
              </span>
            </div>

            {/* Delivery Promise */}
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 mb-8 flex items-center gap-3">
              <span className="text-xl">🚚</span>
              <div>
                <p className="text-sm font-medium text-white">{product.deliveryEstimate}</p>
                <p className="text-xs text-slate-400">Available across Lagos & Abuja city zones</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Overview
              </h3>
              <p className="text-slate-400 leading-relaxed whitespace-pre-line text-sm">
                {product.description}
              </p>
            </div>

            {/* Technical Specifications Table */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">
                Specifications
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Movement</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.movementType}</dd>
                </div>
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Case Size</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.caseSizeMm} mm</dd>
                </div>
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Case Material</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.caseMaterial}</dd>
                </div>
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Strap</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.strapMaterial}</dd>
                </div>
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Water Resistance</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.waterResistance}</dd>
                </div>
                <div className="border-b border-slate-800 pb-2">
                  <dt className="text-slate-500 text-xs">Warranty</dt>
                  <dd className="font-medium text-slate-200 mt-0.5">{product.warranty}</dd>
                </div>
              </dl>
            </div>

            {/* In the Box */}
            <div className="mb-8 p-4 bg-slate-800/30 rounded-xl border border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Included in the Box</p>
              <p className="text-sm text-slate-200">{product.includedInBox}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-slate-800">
            {isSoldOut ? (
              <div className="p-4 bg-slate-800/80 rounded-xl text-center">
                <p className="font-semibold text-red-400">Sold out</p>
                <p className="text-xs text-slate-400 mt-1">This watch is currently out of stock.</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to={`/checkout/${product.id}`}
                  className="flex-1 py-4 px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-center shadow-lg shadow-amber-500/25 transition text-lg"
                >
                  Buy now • {formatKobo(product.priceKobo)}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
