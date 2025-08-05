import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import makuMascot from "@/assets/maku-mascot.png";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroSlides = [
    {
      image: hero1,
      title: "Tropical Paradise Awaits",
      subtitle: "Crystal waters, white sands, endless memories",
      location: "Maldives"
    },
    {
      image: hero2,
      title: "Mountain Adventures",
      subtitle: "Snow-capped peaks and alpine villages",
      location: "Swiss Alps"
    },
    {
      image: hero3,
      title: "Urban Explorations",
      subtitle: "City lights, culture, and modern marvels",
      location: "Tokyo"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Hero Carousel */}
      <div className="relative h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50"
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-6 max-w-4xl">
          {/* 3D Globe Concept */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-travel-ocean to-travel-adventure rounded-full flex items-center justify-center animate-float">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              </div>
              {/* Orbiting elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-travel-gold rounded-full animate-pulse-soft" />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-travel-coral rounded-full animate-pulse-soft" />
            </div>
          </div>

          <div className="animate-fadeIn">
            <div className="flex items-center justify-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-travel-coral" />
              <span className="text-lg font-medium tracking-wide">
                {heroSlides[currentSlide].location}
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 font-['Playfair_Display'] leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
              {heroSlides[currentSlide].subtitle}
            </p>
            
            <div className="relative mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 hero-text bg-white bg-clip-text text-transparent font-['Playfair_Display']">
                Build Your Life's Travel Story
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Discover amazing destinations across our four unique marketplaces
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="btn-primary text-lg px-8 py-4">
                Start Your Journey
              </Button>
              
              <Button variant="outline" className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-lg px-8 py-4">
                Watch Travel Stories
              </Button>
            </div>
          </div>

          {/* Maku Mascot */}
          <div className="absolute bottom-8 right-8 hidden md:block">
            <div className="relative group cursor-pointer">
              <img
                src={makuMascot}
                alt="Maku - Your Travel Companion"
                className="w-24 h-24 animate-float group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Hi, I'm Maku! 🐕
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;