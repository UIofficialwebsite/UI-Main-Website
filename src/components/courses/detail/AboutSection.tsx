import React from 'react';
import { Course } from '@/components/admin/courses/types';

interface AboutSectionProps {
  course: Course;
}

const AboutSection: React.FC<AboutSectionProps> = ({ course }) => {
  
  // Custom helper to render basic Markdown formatting (Bold, Italic, Links)
  const renderDescription = (text: string) => {
    if (!text) return null;

    // Regex to match URLs starting with http:// or https://
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // First, split by Bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    const formattedContent = parts.map((part, i) => {
      // Handle Bold
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={i} className="font-bold text-[#1a1f36]">{part.slice(2, -2)}</strong>;
      }
      
      // Handle Italics (_text_) within non-bold parts
      return part.split(/(_.*?_)/g).map((subPart, j) => {
        if (subPart.startsWith('_') && subPart.endsWith('_') && subPart.length >= 2) {
          return <em key={`${i}-${j}`} className="italic">{subPart.slice(1, -1)}</em>;
        }

        // Handle URLs within non-italic parts
        return subPart.split(urlRegex).map((urlPart, k) => {
          if (urlPart.match(urlRegex)) {
            return (
              <a 
                key={`${i}-${j}-${k}`} 
                href={urlPart} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-words"
              >
                {urlPart}
              </a>
            );
          }
          return urlPart;
        });
      });
    });

    return (
      <p className="text-[15px] md:text-[16px] leading-relaxed text-[#1a1f36] font-normal font-sans whitespace-pre-line">
        {formattedContent}
      </p>
    );
  };

  return (
    <section className="w-full">
      {/* Container "Holding" Section - Matches Features Design */}
      <div className="bg-white border border-[#e3e8ee] rounded-xl p-6 md:p-10 w-full shadow-sm">
        
        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#1a1f36]">
          About This Course
        </h2>
        
        {/* Description - Rendered with custom markdown formatter */}
        <div className="prose max-w-none">
          {renderDescription(course.description)}
        </div>

      </div>
    </section>
  );
};

export default AboutSection;
