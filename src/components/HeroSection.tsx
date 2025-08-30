import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Play, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/hooks/useAccessibility";
import { ImageOptimizer } from "@/components/media/ImageOptimizer";
import hero1 from "@/assets/hero-maldives.jpg";
import hero2 from "@/assets/hero-swiss-alps.jpg";
import hero3 from "@/assets/hero-tokyo.jpg";
const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useTranslation();
  const { prefersReducedMotion } = useAccessibility();
  const heroSlides = [{
    image: hero1,
    title: "Tropical Paradise Awaits",
    subtitle: "Crystal waters, white sands, endless memories",
    location: "Maldives"
  }, {
    image: hero2,
    title: "Mountain Adventures",
    subtitle: "Snow-capped peaks and alpine villages",
    location: "Swiss Alps"
  }, {
    image: hero3,
    title: "Urban Explorations",
    subtitle: "City lights, culture, and modern marvels",
    location: "Tokyo"
  }];
  useEffect(() => {
    // Respect user's motion preferences
    if (prefersReducedMotion()) return;
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % heroSlides.length);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  };
  return <section className="relative h-screen w-full overflow-hidden" role="banner" aria-label="Hero section">
      {/* Hero Carousel */}
      <div className="relative h-full" role="region" aria-label="Image carousel" aria-live="polite">
        {heroSlides.map((slide, index) => <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`} aria-hidden={index !== currentSlide}>
            <ImageOptimizer
              src={slide.image}
              alt={`${slide.title} - ${slide.subtitle}`}
              width={1400}
              height={1000}
              className="h-full w-full object-cover"
              lazy={false}
              fetchPriority={index === 0 ? "high" : "low"}
              quality={index === 0 ? 90 : 75}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          </div>)}
      </div>

      {/* Navigation Arrows */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30" 
        onClick={prevSlide}
        aria-label="Previous image"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30" 
        onClick={nextSlide}
        aria-label="Next image"
      >
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-3" role="tablist" aria-label="Carousel navigation">
        {heroSlides.map((slide, index) => (
          <button 
            key={index} 
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50"}`} 
            onClick={() => setCurrentSlide(index)}
            role="tab"
            aria-selected={index === currentSlide}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-6 max-w-4xl">

          <div className="animate-fadeIn">
            <div className="flex items-center justify-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-travel-coral" />
              <span className="text-lg font-medium tracking-wide">
                {heroSlides[currentSlide].location}
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 font-playfair leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
              {heroSlides[currentSlide].subtitle}
            </p>
            
            <div className="relative mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 hero-text bg-white bg-clip-text text-transparent font-playfair">
                {t('hero.title')}
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                {t('hero.subtitle')}
              </p>
            </div>
            
            
          </div>

        </div>
      </div>
    </section>;
};
export default HeroSection;