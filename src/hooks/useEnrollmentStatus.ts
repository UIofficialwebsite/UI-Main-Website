import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnrollmentStatus {
  isMainCourseOwned: boolean;
  isFullyEnrolled: boolean;
  hasRemainingAddons: boolean;
  isLoading: boolean;
}

export const useEnrollmentStatus = (courseId: string | undefined) => {
  const [status, setStatus] = useState<EnrollmentStatus>({
    isMainCourseOwned: false,
    isFullyEnrolled: false,
    hasRemainingAddons: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (!courseId) {
        setStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus({
            isMainCourseOwned: false,
            isFullyEnrolled: false,
            hasRemainingAddons: false,
            isLoading: false,
          });
          return;
        }

        // Fetch user's enrollments for this course
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('subject_name, status')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .or('status.eq.active,status.eq.paid,status.eq.success,status.eq.SUCCESS,status.eq.ACTIVE');

        // Fetch all addons for this course
        const { data: addons } = await supabase
          .from('course_addons')
          .select('id, subject_name')
          .eq('course_id', courseId);

        if (enrollments && enrollments.length > 0) {
          // Main course owned = enrollment with null subject_name
          const mainOwned = enrollments.some(e => !e.subject_name);

          // Get owned addon subject names
          const ownedSubjectNames = enrollments
            .filter(e => e.subject_name)
            .map(e => e.subject_name);

          // Check if all addons are owned (or if no addons exist)
          const allAddonsOwned = addons && addons.length > 0
            ? addons.every(addon =>
                ownedSubjectNames.includes(addon.id) ||
                ownedSubjectNames.includes(addon.subject_name)
              )
            : true; // No addons = considered "all owned"

          setStatus({
            isMainCourseOwned: mainOwned,
            isFullyEnrolled: mainOwned && allAddonsOwned,
            hasRemainingAddons: mainOwned && !allAddonsOwned,
            isLoading: false,
          });
        } else {
          setStatus({
            isMainCourseOwned: false,
            isFullyEnrolled: false,
            hasRemainingAddons: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking enrollment status:', error);
        setStatus({
          isMainCourseOwned: false,
          isFullyEnrolled: false,
          hasRemainingAddons: false,
          isLoading: false,
        });
      }
    };

    checkEnrollmentStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkEnrollmentStatus();
    });

    // Listen for enrollment updates (e.g., after free enrollment)
    const handleEnrollmentUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.courseId || detail.courseId === courseId) {
        checkEnrollmentStatus();
      }
    };
    window.addEventListener('enrollment-updated', handleEnrollmentUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('enrollment-updated', handleEnrollmentUpdate);
    };
  }, [courseId]);

  return status;
};
