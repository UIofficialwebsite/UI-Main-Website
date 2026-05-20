import React from "react";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import ChapterList from "./ChapterList";

interface SubjectBlockProps {
  subjects: string[]; // Changed from single subject to array
  selectedClass: string;
  examType: 'JEE' | 'NEET';
}

const SubjectBlock = ({ subjects, selectedClass, examType }: SubjectBlockProps) => {
  const { notes, handleDownload, downloadCounts, contentLoading } = useBackend();

  // Filter notes that match any of the selected subjects
  const chapters = notes.filter(
    note => {
      const matchesExam = note.exam_type === examType;
      // If subjects array is empty, match ALL subjects. Otherwise check if subject is in the list.
      const matchesSubject = subjects.length === 0 || subjects.includes(note.subject || '');
      // If selectedClass is empty, match ALL classes. Otherwise check exact match.
      const matchesClass = !selectedClass || note.class_level === selectedClass;

      return matchesExam && matchesSubject && matchesClass;
    }
  ).sort((a, b) => (a.display_order_no || 0) - (b.display_order_no || 0));

  const handleDownloadClick = async (noteId: string, fileUrl?: string) => {
    await handleDownload(noteId, 'notes', fileUrl);
  };

  if (contentLoading) {
    return (
        <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal"></div>
        </div>
    );
  }

  return (
    <ChapterList
      chapters={chapters}
      downloadCounts={downloadCounts}
      onDownload={handleDownloadClick}
      contentType="notes"
    />
  );
};

export default SubjectBlock;
