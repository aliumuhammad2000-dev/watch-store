import { FiShoppingCart, FiSearch, FiUser, FiChevronDown } from "react-icons/fi";

export const Navbar = () => {
  return (
    <>
        <nav className="bg-gray-900 p-4">
            <div className="container flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-gray-200 font-serif text-3xl uppercase">Timepiece Hub</h1>
                    <p className="text-orange-200 text-xs">Your one-stop destination for luxury timepieces</p>
                </div>
                <ul className="flex space-x-12 font-bold text-xs uppercase">
                    <li><a href="#" className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Home</a></li>
                    <li className="flex items-center space-x-1">
                        <a href="#" className="relative flex items-center text-gray-300 hover:text-white pb-1 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Shop</a>
                        <FiChevronDown className="text-gray-300 hover:text-white cursor-pointer" />
                    </li>
                    <li className="flex items-center space-x-1">
                        <a href="#" className="relative flex items-center text-gray-300 hover:text-white pb-1 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Collections</a>
                        <FiChevronDown className="text-gray-300 hover:text-white cursor-pointer" />
                    </li>
                    <li><a href="#" className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Brands</a></li>
                    <li><a href="#" className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">About Us</a></li>
                    <li><a href="#" className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Blog</a></li>
                    <li><a href="#" className="relative text-gray-300 hover:text-white pb-1.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:w-0 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full">Contact</a></li>
                </ul>
                <div className="flex items-center space-x-8 text-2xl">
                    <FiSearch className="text-gray-300 hover:text-white cursor-pointer" />
                    <FiUser className="text-gray-300 hover:text-white cursor-pointer" />
                    <div className="relative">
                        <FiShoppingCart className="text-gray-300 hover:text-white cursor-pointer" />
                        <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-2 -right-2">0</span>
                    </div>
                </div>
            </div>
        </nav>
    </>
  )
}

export default Navbar