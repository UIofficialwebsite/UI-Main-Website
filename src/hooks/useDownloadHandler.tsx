import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { track } from '@/utils/analytics';

export const useDownloadHandler = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial download counts from database
  useEffect(() => {
    const loadDownloadCounts = async () => {
      try {
        // 1. Load generic notes download counts
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('id, download_count')
          .eq('is_active', true);

        // 2. Load PYQs download counts  
        const { data: pyqsData, error: pyqsError } = await supabase
          .from('pyqs')
          .select('id, download_count')
          .eq('is_active', true);

        // 3. Load IITM Branch Notes download counts (The fix for your specific issue)
        const { data: iitmNotesData, error: iitmNotesError } = await supabase
          .from('iitm_branch_notes')
          .select('id, download_count')
          .eq('is_active', true);

        if (notesError) console.error('Error loading notes download counts:', notesError);
        if (pyqsError) console.error('Error loading pyqs download counts:', pyqsError);
        if (iitmNotesError) console.error('Error loading iitm_branch_notes download counts:', iitmNotesError);

        // Combine all download counts into one dictionary
        const combinedCounts: Record<string, number> = {};
        
        if (notesData) {
          notesData.forEach(note => { combinedCounts[note.id] = note.download_count || 0; });
        }
        
        if (pyqsData) {
          pyqsData.forEach(pyq => { combinedCounts[pyq.id] = pyq.download_count || 0; });
        }

        if (iitmNotesData) {
          iitmNotesData.forEach(note => { combinedCounts[note.id] = note.download_count || 0; });
        }

        setDownloadCounts(combinedCounts);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading download counts:', error);
        setIsInitialized(true);
      }
    };

    loadDownloadCounts();
  }, []);

  // Updated to accept 'iitm_branch_notes' as a valid table name
  const handleDownload = async (contentId: string, tableName: 'notes' | 'pyqs' | 'iitm_branch_notes', fileUrl?: string) => {
    try {
      // Optimistically increment the local count first
      const currentCount = downloadCounts[contentId] || 0;
      setDownloadCounts(prev => ({
        ...prev,
        [contentId]: currentCount + 1
      }));

      // Increment download count in database
      const { error } = await supabase.rpc('increment_download_count', {
        table_name: tableName, // This now passes 'iitm_branch_notes' correctly
        content_id: contentId,
        user_email: user?.email || null
      });

      if (error) {
        console.error('Error incrementing download count:', error);
        // Revert the optimistic update on error
        setDownloadCounts(prev => ({
          ...prev,
          [contentId]: currentCount
        }));
        toast({
          title: "Download Error",
          description: "Failed to track download, but file will still open.",
          variant: "destructive"
        });
      } else {
        // Optional: Success toast (can be removed if too noisy)
        // toast({ title: "Download Started", description: "File download tracked successfully." });
      }

      // GA4: track study-material downloads (Enhanced Measurement misses these
      // because the file opens via JS, not as a direct <a href> to the file).
      track('file_download', { content_type: tableName, item_id: contentId });

      // Open file in new tab if URL provided
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }

    } catch (error) {
      console.error('Error handling download:', error);
      // Revert the optimistic update on error
      const currentCount = downloadCounts[contentId] || 0;
      setDownloadCounts(prev => ({
        ...prev,
        [contentId]: Math.max(0, currentCount - 1)
      }));
      toast({
        title: "Download Error",
        description: "Something went wrong with the download.",
        variant: "destructive"
      });
    }
  };

  const updateDownloadCount = (contentId: string, count: number) => {
    setDownloadCounts(prev => ({
      ...prev,
      [contentId]: count
    }));
  };

  return { 
    handleDownload, 
    downloadCounts, 
    updateDownloadCount,
    isInitialized
  };
};
