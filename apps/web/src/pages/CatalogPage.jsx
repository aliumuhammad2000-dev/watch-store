import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, formatKobo } from "../lib/api";

export function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Hero Header */}
      <section className="relative py-16 px-6 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-amber-400 font-medium tracking-widest text-sm uppercase mb-3">
            Official Store • Nigeria
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Curated Luxury Timepieces
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            100% authentic, brand-new watches. Hand-delivered across Lagos & Abuja within 2–5 business days.
          </p>
        </div>
      </section>

      {/* Catalog Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <h2 className="text-2xl font-semibold tracking-wide text-white">
            All Watches
          </h2>
          <span className="text-slate-400 text-sm">
            {products.length} {products.length === 1 ? "watch" : "watches"} available
          </span>
        </div>

        {loading && (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Loading catalog from vault...</p>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-950/50 border border-red-800/80 rounded-xl text-center text-red-200">
            <p className="font-medium">Could not load watches</p>
            <p className="text-sm text-red-300/80 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="py-20 text-center text-slate-400">
            <p className="text-xl">No watches currently in the catalog.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((watch) => {
            const isSoldOut = watch.stockQuantity <= 0;
            const primaryImage =
              watch.images[0] ||
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

            return (
              <div
                key={watch.id}
                className="group bg-slate-800/60 rounded-2xl border border-slate-800 hover:border-slate-700 transition overflow-hidden flex flex-col"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-950">
                  <img
                    src={primaryImage}
                    alt={watch.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                  />
                  {isSoldOut ? (
                    <span className="absolute top-4 right-4 bg-red-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      Sold out
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-emerald-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                      In Stock ({watch.stockQuantity})
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
                      {watch.brand}
                    </p>
                    <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                      {watch.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {watch.deliveryEstimate}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-2xl font-bold text-white">
                        {formatKobo(watch.priceKobo)}
                      </span>
                      <span className="text-xs text-slate-400 uppercase">
                        Brand New
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/product/${watch.id}`}
                        className="text-center py-3 px-4 rounded-xl text-sm font-medium border border-slate-700 hover:bg-slate-800 text-slate-200 transition"
                      >
                        Details
                      </Link>
                      {isSoldOut ? (
                        <button
                          disabled
                          className="py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 text-slate-500 cursor-not-allowed text-center"
                        >
                          Sold out
                        </button>
                      ) : (
                        <Link
                          to={`/checkout/${watch.id}`}
                          className="py-3 px-4 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 text-center transition shadow-lg shadow-amber-500/20"
                        >
                          Buy now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
