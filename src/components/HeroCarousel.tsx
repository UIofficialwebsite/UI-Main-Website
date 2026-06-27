import React, { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { cachedRead } from "@/utils/edgeCache";

interface HeroCarouselProps {
  pagePath?: string;
  fullWidth?: boolean;
}

const HeroCarousel = ({ pagePath = "/", fullWidth = false }: HeroCarouselProps) => {
  const [carouselImages, setCarouselImages] = useState<{ src: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false,
      duration: 30,
    },
    [
      Autoplay({
        delay: 2000,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }) as any,
    ]
  );

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Served from the Vercel edge cache (api/cached-reads), falling back to a
        // direct Supabase query if the cache route is unavailable.
        const data = await cachedRead<{ image_url: string }[]>(
          "page_banners",
          async () => {
            const { data, error } = await supabase
              .from("page_banners")
              .select("image_url")
              .eq("page_path", pagePath)
              .order("created_at", { ascending: false });
            if (error) throw error;
            return data ?? [];
          },
          undefined,
          pagePath
        );
        setCarouselImages(
          data.map((item) => ({ src: item.image_url, alt: "Banner Image" }))
        );
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [pagePath]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  if (loading) {
    return <div className="w-full h-[300px] bg-gray-100 animate-pulse" />;
  }

  if (!carouselImages.length) {
    return null;
  }

  return (
    <div className={`relative w-full ${fullWidth ? "" : "py-4"}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={
                fullWidth
                  ? "flex-[0_0_100%] min-w-0"
                  : "flex-[0_0_100%] md:flex-[0_0_80%] lg:flex-[0_0_72%] xl:flex-[0_0_68%] min-w-0 px-2 md:px-3"
              }
            >
              <div
                className={`overflow-hidden transition-all duration-500 ease-out ${
                  fullWidth ? "" : "rounded-xl shadow-md"
                } ${
                  fullWidth || index === selectedIndex
                    ? "opacity-100 scale-100"
                    : "opacity-60 scale-[0.97]"
                }`}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-auto object-contain block select-none"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {carouselImages.length > 1 && (
        <div className={`flex justify-center gap-2 ${fullWidth ? "mt-2" : "mt-4"}`}>
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-6 bg-royal"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
