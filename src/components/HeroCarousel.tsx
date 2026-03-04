import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeroCarouselProps {
  pagePath?: string;
}

const HeroCarousel = ({ pagePath = "/" }: HeroCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [carouselImages, setCarouselImages] = useState<{ src: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("page_banners")
          .select("image_url")
          .eq("page_path", pagePath);

        if (error) {
          console.error("Error fetching banners:", error);
        } else if (data) {
          const mappedImages = data.map((item) => ({
            src: item.image_url,
            alt: "Banner Image",
          }));
          setCarouselImages(mappedImages);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [pagePath]);

  const length = carouselImages.length;

  const nextSlide = () => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
  };

  // Auto-advance the carousel
  useEffect(() => {
    if (length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [current, length]);

  if (loading) {
    return <div className="w-full h-[300px] bg-gray-100 animate-pulse mt-16" />;
  }

  if (!carouselImages.length) {
    return null;
  }

  return (
    <div 
      className="relative w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Vignette overlay when hovered */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-20 pointer-events-none" />
      )}
      
      {/* Carousel Images - Using Grid to Stack for Natural Height */}
      <div className="grid grid-cols-1 grid-rows-1">
        {carouselImages.map((image, index) => (
          <div
            key={index}
            className={`col-start-1 row-start-1 w-full transition-opacity duration-700 ease-in-out ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-auto object-contain block" 
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Navigation buttons - only visible on hover */}
      {length > 1 && isHovered && (
        <>
          <button
            className="absolute left-4 top-1/2 z-30 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full p-3 transition-all duration-300 shadow-lg"
            onClick={prevSlide}
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>
          <button
            className="absolute right-4 top-1/2 z-30 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full p-3 transition-all duration-300 shadow-lg"
            onClick={nextSlide}
          >
            <ChevronRight size={24} className="text-gray-800" />
          </button>
        </>
      )}

      {/* Navigation dots - positioned inside at bottom */}
      {length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === current 
                  ? "bg-royal scale-125 shadow-md" 
                  : "bg-white/60 hover:bg-white"
              }`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
