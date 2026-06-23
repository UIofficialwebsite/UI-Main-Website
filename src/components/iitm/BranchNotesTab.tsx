import React, { useMemo, useEffect } from "react";
import BranchNotesAccordion from "./BranchNotesAccordion";
import { useIITMBranchNotes } from "./hooks/useIITMBranchNotes";

export interface BranchNotesTabProps {
  branch: string;
  level: string;
  selectedSubjects: string[];
  specialization?: string | null;
  onSubjectsLoaded?: (subjects: string[]) => void;
}

const BranchNotesTab = ({ branch, level, selectedSubjects, specialization, onSubjectsLoaded }: BranchNotesTabProps) => {
  const branchSlug = branch.toLowerCase().replace(/\s+/g, '-');
  const levelSlug = level.toLowerCase();

  const { loading, groupedData } = useIITMBranchNotes(branchSlug, levelSlug);

  // When a specialization is selected, keep only its notes (and drop now-empty
  // subject groups). Subjects available for the multi-select reflect what's
  // visible after the specialization filter.
  const specializationData = useMemo(() => {
    if (!specialization) return groupedData;
    return groupedData
      .map(g => ({
        ...g,
        notes: g.notes.filter(n => (n.diploma_specialization ?? '') === specialization),
      }))
      .filter(g => g.notes.length > 0);
  }, [groupedData, specialization]);

  // Extract available subject names and notify parent
  useEffect(() => {
    if (specializationData.length > 0 && onSubjectsLoaded) {
      const subjects = specializationData.map(g => g.subjectName);
      onSubjectsLoaded(subjects);
    }
  }, [specializationData, onSubjectsLoaded]);

  const filteredData = useMemo(() => {
    // If no subject filter chosen, show all (post-specialization)
    if (selectedSubjects.length === 0) return specializationData;
    return specializationData.filter(g => selectedSubjects.includes(g.subjectName));
  }, [specializationData, selectedSubjects]);

  return (
    <div className="space-y-8">
      {/* Subject Multi-select Filter button list has been removed to Row 2 filter bar */}
      <BranchNotesAccordion
        groupedData={filteredData}
        loading={loading}
        branch={branchSlug}
        level={levelSlug}
      />
    </div>
  );
};

export default BranchNotesTab;
