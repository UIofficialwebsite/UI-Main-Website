export const generateSEOTitle = (exam: string, tab: string, params: string[] = []): string => {
  const examName = exam.toUpperCase();
  const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);
  
  if (params.length === 0) {
    return `${examName} ${tabName} - Comprehensive Study Materials`;
  }
  
  const paramString = params.join(' ');
  return `${examName} ${tabName} - ${paramString} - Study Materials & Resources`;
};

export const generateSEODescription = (exam: string, tab: string, params: string[] = []): string => {
  const examName = exam.toUpperCase();
  const descriptions = {
    notes: `Access comprehensive ${examName} study notes`,
    pyqs: `Download ${examName} previous year question papers`,
    syllabus: `View detailed ${examName} syllabus and curriculum`,
    tools: `Use ${examName} preparation tools and calculators`,
    courses: `Explore ${examName} preparation courses`,
    news: `Stay updated with latest ${examName} news and announcements`,
    dates: `Important ${examName} dates and deadlines`
  };
  
  let baseDescription = descriptions[tab as keyof typeof descriptions] || `${examName} preparation resources`;
  
  if (params.length > 0) {
    const paramText = params.join(', ');
    baseDescription += ` for ${paramText}`;
  }
  
  return `${baseDescription}. Best quality study materials for competitive exam preparation.`;
};

export const generateCanonicalUrl = (pathname: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}${pathname}`;
};