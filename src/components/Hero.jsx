

export const Hero = () => {
  return (
    <>
        <section className="relative min-h-[calc(100vh-80px)] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/paul-cuoco-hero.jpg')" }} >
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="relative z-10 max-w-7xl mx-auto px-6 min-h-[calc(100vh-80px)] flex items-center">
                <div className="max-w-xl text-white">
                    <p className="text-orange-400 uppercase tracking-[0.3em] text-sm font-medium mb-5">
                        Timeless Collection
                    </p>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                        Timepieces
                        <span className="block font-light">
                        made to last.
                        </span>
                    </h1>
                    <p className="mt-6 text-gray-300 text-lg leading-8 max-w-md">
                        Discover elegant timepieces crafted with precision
                        and designed for every occasion.
                    </p>
                    <button className="mt-8 px-8 py-4 bg-orange-400 text-black font-medium uppercase tracking-wider hover:bg-white transition duration-300">
                        Explore Collection
                    </button>
                </div>
            </div>
        </section>
    </>
  )
}
