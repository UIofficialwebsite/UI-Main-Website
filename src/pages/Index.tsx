import React from "react";
import NavBar from "@/components/NavBar";
import HeroCarousel from "@/components/HeroCarousel";
import WelcomeSection from "@/components/WelcomeSection";
import CategoriesSection from "@/components/CategoriesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ResourceHubSection from "@/components/ResourceHubSection";
import ReachSection from "@/components/ReachSection";
import Footer from "@/components/Footer";
import HomepagePopup from "@/components/HomepagePopup";
import { useDocumentTitle, useCanonicalUrl, SEO_TITLES } from "@/utils/seoManager";

const Index = () => {
  useDocumentTitle(SEO_TITLES.HOME, false);
  useCanonicalUrl("/");
  return (
    <>
      <NavBar />
      <div className="mt-16">
        <HeroCarousel />
      </div>
      <WelcomeSection />
      <CategoriesSection />
      <WhyChooseUsSection />
      <ReachSection />
      <TestimonialsSection />
      <ResourceHubSection />
      <Footer />
      <HomepagePopup />
    </>
  );
};

export default Index;
