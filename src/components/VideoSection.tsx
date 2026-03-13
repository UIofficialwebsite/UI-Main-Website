
import React, { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="py-16 bg-[#0F172A] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          {!isPlaying ? (
            <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden">
              {/* Thumbnail image */}
              <img
                src="/web-uploads/762c4371-c234-41a8-89e6-0c0563f920b2.png"
                alt="Video thumbnail"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-20 h-20 bg-white/25 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                >
                  <div className="w-16 h-16 bg-royal rounded-full flex items-center justify-center">
                    <Play size={36} className="text-white ml-1" fill="white" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Unknown IITians Introduction"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>
        
        <div className="flex justify-center mt-8">
          <Button 
            onClick={() => setIsPlaying(true)}
            className="bg-white text-[#0F172A] hover:bg-gray-100 px-8"
          >
            Watch More Videos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
