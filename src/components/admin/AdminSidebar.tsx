
import React from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FileText,
  Newspaper,
  Calendar,
  Briefcase,
  Users,
  Settings,
  GraduationCap,
  MessageSquare,
  UserCog,
  LayoutDashboard,
  Tag
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "content-management", label: "Content Management", icon: LayoutDashboard },
    { id: "courses", label: "Courses", icon: GraduationCap },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "pyqs", label: "Previous Year Questions", icon: FileText },
    { id: "study-groups", label: "Study Groups", icon: MessageSquare },
    { id: "communities", label: "Communities", icon: Users },
    { id: "news", label: "News Updates", icon: Newspaper },
    { id: "dates", label: "Important Dates", icon: Calendar },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "employees", label: "Employees", icon: UserCog },
    { id: "admins", label: "Admin Management", icon: Settings },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
      </div>
      <nav className="mt-6">
        <div className="px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors",
                  activeTab === item.id
                    ? "bg-royal text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
