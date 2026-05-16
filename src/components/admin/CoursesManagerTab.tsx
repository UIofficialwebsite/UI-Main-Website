import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Course } from "./courses/types";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import CourseForm from "./courses/CourseForm";
import CourseList from "./courses/CourseList";

const CoursesManagerTab = () => {
  const { courses, contentLoading: isLoading, createCourse, updateCourse, deleteCourse, loadAllCourses } = useBackend();
  useEffect(() => { loadAllCourses(); }, [loadAllCourses]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingCourse(null);
  };

  const handleSave = async (courseData: Course) => {
    setIsSaving(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
      } else {
        await createCourse(courseData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving course:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    await deleteCourse(courseId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Courses Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-royal hover:bg-royal-dark" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Add New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course details' : 'Fill in the course information'}
              </DialogDescription>
            </DialogHeader>
            <CourseForm
              initialData={editingCourse || undefined}
              onSave={handleSave}
              onClose={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>
      </div>

      <CourseList
        courses={courses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default CoursesManagerTab;
