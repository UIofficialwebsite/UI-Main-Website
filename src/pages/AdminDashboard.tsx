import React, { useState } from "react";
// Import for Tabs is removed, as it's the cause of the error.
import { useAuth } from "@/hooks/useAuth";
import AdminCheck from "@/components/admin/AdminCheck";
import ContentManagementTab from "@/components/admin/ContentManagementTab";

// Import admin components
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import CoursesManagerTab from "@/components/admin/CoursesManagerTab";
import CouponsManagerTab from "@/components/admin/CouponsManagerTab";
import NotesManagerTab from "@/components/admin/NotesManagerTab";
import PYQsManagerTab from "@/components/admin/PYQsManagerTab";
import StudyGroupsManagerTab from "@/components/admin/StudyGroupsManagerTab";
import CommunitiesManagerTab from "@/components/admin/CommunitiesManagerTab";
import NewsManagerTab from "@/components/admin/NewsManagerTab";
import DatesManagerTab from "@/components/admin/DatesManagerTab";
import JobsManagerTab from "@/components/admin/JobsManagerTab";
import EmployeeManagerTab from "@/components/admin/EmployeeManagerTab";
import AdminManagementTab from "@/components/admin/AdminManagementTab";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

const AdminDashboard = () => {
  usePageSEO(SEO_TITLES.ADMIN_DASHBOARD, "/admin/dashboard");
  const [activeTab, setActiveTab] = useState("content-management");
  const { isLoading, user, isAdmin } = useAuth();

  console.log('AdminDashboard - Auth state:', { isLoading, user: user?.email, isAdmin });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <AdminCheck>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader />
          
          {/* --- THIS IS THE FIX ---
            The <Tabs> and <TabsContent> wrappers were removed.
            We now use simple conditional rendering based on the 'activeTab' state,
            which is already being managed by the AdminSidebar.
            This eliminates the 'React.Children.only' error.
          */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full">
              {activeTab === 'content-management' && <ContentManagementTab />}
              {activeTab === 'courses' && <CoursesManagerTab />}
              {activeTab === 'coupons' && <CouponsManagerTab />}
              {activeTab === 'notes' && <NotesManagerTab />}
              {activeTab === 'pyqs' && <PYQsManagerTab />}
              {activeTab === 'study-groups' && <StudyGroupsManagerTab />}
              {activeTab === 'communities' && <CommunitiesManagerTab />}
              {activeTab === 'news' && <NewsManagerTab />}
              {activeTab === 'dates' && <DatesManagerTab />}
              {activeTab === 'jobs' && <JobsManagerTab />}
              
              {activeTab === 'employees' && (
                <AdminCheck requireSuperAdmin>
                  <EmployeeManagerTab />
                </AdminCheck>
              )}
              
              {activeTab === 'admins' && (
                <AdminCheck requireSuperAdmin>
                  <AdminManagementTab />
                </AdminCheck>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminCheck>
  );
};

export default AdminDashboard;
