const features = [
  {
    title: "FREE SHIPPING",
    description: "On orders over $75",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-10 h-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.75 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 15.75V6.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.375M15.75 9h2.25l2.25 2.25v4.5h-4.5V9Z"
        />
      </svg>
    ),
  },

  {
    title: "EASY RETURNS",
    description: "30-day hassle free returns",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-10 h-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992V4.356M20.995 9.348a8.25 8.25 0 1 0-1.68 7.883"
        />
      </svg>
    ),
  },

  {
    title: "SECURE PAYMENT",
    description: "100% secure checkout",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-10 h-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3.75 4.5 6.75v5.625c0 4.834 3.15 7.734 7.5 8.875 4.35-1.141 7.5-4.041 7.5-8.875V6.75L12 3.75Z"
        />
      </svg>
    ),
  },

  {
    title: "CUSTOMER SUPPORT",
    description: "We're here to help",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-10 h-10"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18.75a6.75 6.75 0 0 0 6.75-6.75V9a6.75 6.75 0 0 0-13.5 0v3A6.75 6.75 0 0 0 12 18.75Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.75 12.75h1.125A1.125 1.125 0 0 1 21 13.875v1.5A1.125 1.125 0 0 1 19.875 16.5h-1.125M5.25 12.75H4.125A1.125 1.125 0 0 0 3 13.875v1.5A1.125 1.125 0 0 0 4.125 16.5H5.25"
        />
      </svg>
    ),
  },
];

export const Features = () => {
  return (
    <section className="bg-black text-white border-y border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`
                flex items-center gap-5 py-6 px-4
                lg:border-r border-gray-800
                ${index === features.length - 1 ? "lg:border-r-0" : ""}
              `}
            >
              <div className="text-white shrink-0">
                {feature.icon}
              </div>

              <div>
                <h3 className="text-sm md:text-base font-semibold tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};
