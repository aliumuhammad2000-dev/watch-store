import { useState } from "react";
import {
  FiShoppingCart,
  FiSearch,
  FiUser,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  return (
    <>
      <nav className="bg-gray-950 p-4 sticky top-0 z-50 border-b border-gray-900">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Mobile Menu Button (visible on screens smaller than lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-gray-300 hover:text-white text-2xl focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>

          {/* Logo & Subtitle */}
          <div className="flex flex-col">
            <h1 className="text-gray-200 font-serif text-2xl sm:text-3xl uppercase tracking-wider">
              Timepiece Hub
            </h1>
            <p className="text-orange-200 text-xs hidden sm:block">
              Your one-stop destination for luxury timepieces
            </p>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, visible on lg+) */}
          <ul className="hidden lg:flex space-x-8 xl:space-x-12 font-bold text-xs uppercase">
            <li>
              <a
                href="#"
                className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Home
              </a>
            </li>

            {/* Shop Dropdown */}
            <li
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setIsShopOpen(true)}
              onMouseLeave={() => setIsShopOpen(false)}
            >
              <a
                href="#"
                className="relative flex items-center text-gray-300 hover:text-white pb-1 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Shop
              </a>
              <FiChevronDown
                className={`text-gray-300 hover:text-white transition-transform duration-200 ${
                  isShopOpen ? "rotate-180" : ""
                }`}
              />

              {isShopOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50 animate-fadeIn">
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    All Watches
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    New Arrivals
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Bestsellers
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Limited Editions
                  </a>
                </div>
              )}
            </li>

            {/* Collections Dropdown */}
            <li
              className="relative flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setIsCollectionsOpen(true)}
              onMouseLeave={() => setIsCollectionsOpen(false)}
            >
              <a
                href="#"
                className="relative flex items-center text-gray-300 hover:text-white pb-1 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Collections
              </a>
              <FiChevronDown
                className={`text-gray-300 hover:text-white transition-transform duration-200 ${
                  isCollectionsOpen ? "rotate-180" : ""
                }`}
              />

              {isCollectionsOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2 z-50 animate-fadeIn">
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Men's Collection
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Women's Collection
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Sport & Diver
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-orange-400 text-xs transition"
                  >
                    Automatic Skeleton
                  </a>
                </div>
              )}
            </li>

            <li>
              <a
                href="#"
                className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Brands
              </a>
            </li>
            <li>
              <a
                href="#"
                className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Blog
              </a>
            </li>
            <li>
              <a
                href="#"
                className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              >
                Contact
              </a>
            </li>
          </ul>

          {/* Action Icons */}
          <div className="flex items-center space-x-6 sm:space-x-8 text-xl sm:text-2xl">
            <FiSearch className="text-gray-300 hover:text-white cursor-pointer transition" />
            <FiUser className="text-gray-300 hover:text-white cursor-pointer transition" />
            <div className="relative">
              <FiShoppingCart className="text-gray-300 hover:text-white cursor-pointer transition" />
              <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2 font-sans font-bold">
                0
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu (Drawer) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gray-900 border-t border-gray-800 mt-4 px-6 py-6 space-y-4 text-xs uppercase font-bold tracking-wider animate-fadeIn">
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-orange-400 py-1"
            >
              Home
            </a>

            {/* Mobile Shop section */}
            <div className="space-y-2">
              <button
                onClick={() => setIsShopOpen(!isShopOpen)}
                className="flex items-center justify-between w-full text-gray-200 hover:text-orange-400 py-1 uppercase font-bold"
              >
                <span>Shop</span>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isShopOpen ? "rotate-180 text-orange-400" : ""
                  }`}
                />
              </button>
              {isShopOpen && (
                <div className="pl-4 space-y-2 border-l border-gray-800 font-normal text-gray-400 normal-case">
                  <a href="#" className="block hover:text-orange-400">All Watches</a>
                  <a href="#" className="block hover:text-orange-400">New Arrivals</a>
                  <a href="#" className="block hover:text-orange-400">Bestsellers</a>
                  <a href="#" className="block hover:text-orange-400">Limited Editions</a>
                </div>
              )}
            </div>

            {/* Mobile Collections section */}
            <div className="space-y-2">
              <button
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                className="flex items-center justify-between w-full text-gray-200 hover:text-orange-400 py-1 uppercase font-bold"
              >
                <span>Collections</span>
                <FiChevronDown
                  className={`transition-transform duration-200 ${
                    isCollectionsOpen ? "rotate-180 text-orange-400" : ""
                  }`}
                />
              </button>
              {isCollectionsOpen && (
                <div className="pl-4 space-y-2 border-l border-gray-800 font-normal text-gray-400 normal-case">
                  <a href="#" className="block hover:text-orange-400">Men's Collection</a>
                  <a href="#" className="block hover:text-orange-400">Women's Collection</a>
                  <a href="#" className="block hover:text-orange-400">Sport & Diver</a>
                  <a href="#" className="block hover:text-orange-400">Automatic Skeleton</a>
                </div>
              )}
            </div>

            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-orange-400 py-1"
            >
              Brands
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-orange-400 py-1"
            >
              About Us
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-orange-400 py-1"
            >
              Blog
            </a>
            <a
              href="#"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-200 hover:text-orange-400 py-1"
            >
              Contact
            </a>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;