import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminCheck from "@/components/admin/AdminCheck";
import ContentManagementTab from "@/components/admin/ContentManagementTab";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import CoursesManagerTab from "@/components/admin/CoursesManagerTab";
import CouponsManagerTab from "@/components/admin/CouponsManagerTab";
import PageBannersManagerTab from "@/components/admin/PageBannersManagerTab";
import CourseFAQsManagerTab from "@/components/admin/CourseFAQsManagerTab";
import BatchScheduleManagerTab from "@/components/admin/BatchScheduleManagerTab";
import NotesManagerTab from "@/components/admin/NotesManagerTab";
import PYQsManagerTab from "@/components/admin/PYQsManagerTab";
import StudyGroupsManagerTab from "@/components/admin/StudyGroupsManagerTab";
import CommunitiesManagerTab from "@/components/admin/CommunitiesManagerTab";
import NewsManagerTab from "@/components/admin/NewsManagerTab";
import DatesManagerTab from "@/components/admin/DatesManagerTab";
import JobsManagerTab from "@/components/admin/JobsManagerTab";
import UsersViewTab from "@/components/admin/UsersViewTab";
import EnrollmentsViewTab from "@/components/admin/EnrollmentsViewTab";
import PaymentsViewTab from "@/components/admin/PaymentsViewTab";
import CouponRedemptionsViewTab from "@/components/admin/CouponRedemptionsViewTab";
import PushNotificationsManagerTab from "@/components/admin/PushNotificationsManagerTab";
import EmployeeManagerTab from "@/components/admin/EmployeeManagerTab";
import AdminManagementTab from "@/components/admin/AdminManagementTab";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

const AdminDashboard = () => {
  usePageSEO(SEO_TITLES.ADMIN_DASHBOARD, "/admin/dashboard");
  const [activeTab, setActiveTab] = useState("content-management");
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <AdminCheck>
      <div className="flex h-screen bg-slate-50">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <AdminHeader />

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full max-w-[1400px] mx-auto">
              {activeTab === "content-management" && <ContentManagementTab />}
              {activeTab === "courses" && <CoursesManagerTab />}
              {activeTab === "page-banners" && <PageBannersManagerTab />}
              {activeTab === "course-faqs" && <CourseFAQsManagerTab />}
              {activeTab === "batch-schedule" && <BatchScheduleManagerTab />}
              {activeTab === "coupons" && <CouponsManagerTab />}
              {activeTab === "notes" && <NotesManagerTab />}
              {activeTab === "pyqs" && <PYQsManagerTab />}
              {activeTab === "study-groups" && <StudyGroupsManagerTab />}
              {activeTab === "communities" && <CommunitiesManagerTab />}
              {activeTab === "news" && <NewsManagerTab />}
              {activeTab === "dates" && <DatesManagerTab />}
              {activeTab === "jobs" && <JobsManagerTab />}
              {activeTab === "users" && <UsersViewTab />}
              {activeTab === "enrollments" && <EnrollmentsViewTab />}
              {activeTab === "payments" && <PaymentsViewTab />}
              {activeTab === "coupon-redemptions" && <CouponRedemptionsViewTab />}
              {activeTab === "push-notifications" && <PushNotificationsManagerTab />}

              {activeTab === "employees" && (
                <AdminCheck requireSuperAdmin>
                  <EmployeeManagerTab />
                </AdminCheck>
              )}

              {activeTab === "admins" && (
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
