import { FiArrowRight } from "react-icons/fi";
import menWatches from "../assets/images/mens-watches.png";
import womenWatches from "../assets/images/women-watch.png";
import sportWatches from "../assets/images/sport-watch.png";

const categories = [
  {
    id: 1,
    image: menWatches,
    name: "Men's Watches",
  },
  {
    id: 2,
    image: womenWatches,
    name: "Women's Watches",
  },
  {
    id: 3,
    image: sportWatches,
    name: "Sport Watches",
  },
  {
    id: 4,
    image: menWatches,
    name: "Men's Watches",
  },
  {
    id: 5,
    image: womenWatches,
    name: "Women's Watches",
  },
  {
    id: 6,
    image: sportWatches,
    name: "Sport Watches",
  }
];

export const Categories = () => {
  return (
    <section className="px-8 py-4">
      <div className="relative uppercase tracking-wide mb-6">
        <h1 className="font-medium text-2xl">
          Shop By Category
        </h1>
        <span className="absolute top-0 right-0 flex items-center gap-4 cursor-pointer text-sm hover:font-medium transition duration-300">
          View All <FiArrowRight />
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        {categories.map((item) => (
          <div
            key={item.id}
            className="bg-black w-48 h-auto rounded-3xl"
          >
            <div className="'h-auto p-2">
              <img
                src={item.image}
                alt={item.name}
                className="w-46 h-46 object-contain"
              />
            </div>
            <div className="text-center py-4">
              <h3 className="text-xl font-semibold text-white mb-3">
                {item.name}
              </h3>
              <button className="bg-transparent px-4 py-2 text-white text-sm mb-4 uppercase tracking-wider hover:bg-orange-400 hover:text-black transition duration-300">
                Shop Now
              </button>
            </div>

          </div>
        ))}

      </div>
    </section>
  );
};
