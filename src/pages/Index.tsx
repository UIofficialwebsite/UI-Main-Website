import React from "react";
import NavBar from "@/components/NavBar";
import HeroCarousel from "@/components/HeroCarousel";
import WelcomeSection from "@/components/WelcomeSection";
import CategoriesSection from "@/components/CategoriesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ResourceHubSection from "@/components/ResourceHubSection";
import Footer from "@/components/Footer";
import FloatingAnnouncementToggle from "@/components/FloatingAnnouncementToggle";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

const Index = () => {
  usePageSEO(SEO_TITLES.HOME, "/");
  return (
    <>
      <NavBar />
      <div className="mt-16">
        <HeroCarousel />
      </div>
      <WelcomeSection />
      <CategoriesSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <ResourceHubSection />
      <Footer />
      <FloatingAnnouncementToggle />
    </>
  );
};

export default Index;
