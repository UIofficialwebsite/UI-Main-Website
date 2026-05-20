import React, { useEffect } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import AuthWrapper from "@/components/AuthWrapper";
import { ShimmerButton } from "./ui/shimmer-button";

interface NEETPYQTabProps {
  subject: string | null;
  year: string | null;
  session?: string | null;
}

const NEETPYQTab = ({ subject, year, session }: NEETPYQTabProps) => {
  const {
    handleDownload,
    downloadCounts,
    updateDownloadCount,
    pyqs,
    contentLoading,
  } = useBackend();
  
  // Filter pyqs by filters and exam type
  const filteredPyqs = pyqs.filter(pyq => 
    pyq.exam_type?.toLowerCase().includes('neet') &&
    (!subject || pyq.subject === subject) &&
    (!year || pyq.year?.toString() === year) &&
    (!session || pyq.session === session)
  );

  // Update download counts from database
  useEffect(() => {
    pyqs.forEach(pyq => {
      if (pyq.download_count && !downloadCounts[pyq.id]) {
        updateDownloadCount(pyq.id, pyq.download_count);
      }
    });
  }, [pyqs, downloadCounts, updateDownloadCount]);

  const handleDownloadClick = async (pyqId: string, fileUrl?: string) => {
    await handleDownload(pyqId, 'pyqs', fileUrl);
  };

  const currentDownloads = downloadCounts;

  return (
    <AuthWrapper>
      <div className="space-y-6">
        {contentLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPyqs.map((pyq) => (
              <Card key={pyq.id} className="border-none shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pyq.title}</CardTitle>
                      <CardDescription>{pyq.description || 'NEET previous year question paper'}</CardDescription>
                      {pyq.subject && (
                        <div className="mt-2">
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded">
                            {pyq.subject}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  <ShimmerButton
                    onClick={() => handleDownloadClick(pyq.id, pyq.file_link || undefined)}
                    background="rgba(26, 86, 219, 0.8)"
                    borderRadius="var(--radius)"
                  >
                    <span className="flex items-center text-white">
                        <Download className="h-4 w-4 mr-2" /> Download
                    </span>
                  </ShimmerButton>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{currentDownloads[pyq.id] || pyq.download_count || 0}</span>
                    <div className="ml-2 bg-gray-200 h-1.5 w-16 rounded-full overflow-hidden">
                      <div 
                        className="bg-royal h-full rounded-full" 
                        style={{ width: `${Math.min(100, ((currentDownloads[pyq.id] || pyq.download_count || 0) / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
            
            {filteredPyqs.length === 0 && (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No previous year papers available. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </AuthWrapper>
  );
};

export default NEETPYQTab;
