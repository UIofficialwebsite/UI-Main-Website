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
  Tag,
  Image as ImageIcon,
  HelpCircle,
  CalendarRange,
  ClipboardList,
  CreditCard,
  Receipt,
  Bell,
  MailWarning,
  FileDown,
  Share2,
  LucideIcon,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const groups: MenuGroup[] = [
  {
    label: "Overview",
    items: [
      { id: "content-management", label: "Content Management", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { id: "courses", label: "Courses", icon: GraduationCap },
      { id: "page-banners", label: "Page Banners", icon: ImageIcon },
      { id: "course-faqs", label: "Course FAQs", icon: HelpCircle },
      { id: "batch-schedule", label: "Batch Schedule", icon: CalendarRange },
      { id: "coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    label: "Library",
    items: [
      { id: "notes", label: "Notes", icon: BookOpen },
      { id: "pyqs", label: "Previous Year Questions", icon: FileText },
      { id: "study-groups", label: "Study Groups", icon: MessageSquare },
      { id: "communities", label: "Communities", icon: Users },
    ],
  },
  {
    label: "Outreach",
    items: [
      { id: "news", label: "News Updates", icon: Newspaper },
      { id: "dates", label: "Important Dates", icon: Calendar },
      { id: "jobs", label: "Jobs", icon: Briefcase },
      { id: "push-notifications", label: "Push Notifications", icon: Bell },
      { id: "cart-recovery", label: "Cart Recovery", icon: MailWarning },
    ],
  },
  {
    label: "Reports",
    items: [
      { id: "users", label: "Users", icon: Users },
      { id: "enrollments", label: "Enrollments", icon: ClipboardList },
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "coupon-redemptions", label: "Coupon Redemptions", icon: Receipt },
      { id: "download-logs", label: "Download Logs", icon: FileDown },
      { id: "shares", label: "Shares", icon: Share2 },
    ],
  },
  {
    label: "System",
    items: [
      { id: "employees", label: "Employees", icon: UserCog },
      { id: "admins", label: "Admin Management", icon: Settings },
    ],
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col">
      <div className="px-6 py-5 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          Admin Panel
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Unknown IITians</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-6 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {group.label}
              </span>
            </div>
            <div className="px-3 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-royal text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "mr-3 h-4 w-4 shrink-0",
                        isActive ? "text-white" : "text-slate-400"
                      )}
                    />
                    <span className="truncate text-left">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
