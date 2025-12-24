import { Link } from 'react-router-dom'

const Home = () => (
  <div className="min-h-screen bg-slate-50/30 ml-56 flex items-center">
    <section className="w-full">
      <div className="container mx-auto">
        <div
          className="banner-box text-center max-w-6xl mx-auto bg-cover bg-center bg-no-repeat relative rounded-lg overflow-hidden"
          style={{
            backgroundImage:
              "url('https://www.harriscountycitizencorps.com/portals/34/Images/backgrounds/imgs/cert-rotator-01.jpg?ver=2016-08-18-111230-997')",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg"></div>
          <div className="relative z-10 py-32 px-8">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
                Save Lives with
                <span className="block text-gray-200">Confidence</span>
              </h1>
              <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8 leading-relaxed">
                Master essential first aid skills through our carefully designed interactive training modules.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/modules"
                  className="bg-white/30 backdrop-blur-md text-white px-8 py-4 rounded-2xl hover:bg-white/40 border border-white/40 hover:border-white/60 transition-all duration-300 font-medium text-sm tracking-wide"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  Explore Training Modules
                </Link>
                <Link
                  to="/achievements"
                  className="bg-white/5 backdrop-blur-md text-white px-8 py-4 rounded-2xl hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 font-medium text-sm tracking-wide"
                  onClick={() => {
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                  }}
                >
                  View Achievements
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
)

export default Home
