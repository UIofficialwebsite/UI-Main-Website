import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, X, Atom, Stethoscope, GraduationCap, BookOpen,
  ChevronRight, ArrowLeft, LogOut, ChevronDown, CircleUser,
  PencilLine, Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import { useLoginModal } from "@/context/LoginModalContext";
import { supabase } from "@/integrations/supabase/client";
import PushNotificationToggle from "@/components/PushNotificationToggle";

// --- STABLE PROFILE MENU COMPONENT ---
const ProfileMenu = ({ user, profile, handleSignOut, navigate, isDashboard, isAdmin }: any) => {
  // Priority: 1. Database Profile, 2. Google Metadata, 3. Fallback "User"
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const displayEmail = user?.email;
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none flex items-center gap-2 group outline-none">
          <Avatar className="h-9 w-9 border border-gray-200 cursor-pointer group-hover:ring-2 group-hover:ring-[#1d4ed8] transition-all">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="font-bold bg-[#1d4ed8] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-[#1d4ed8] transition-colors" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[250px] p-[10px_0] rounded-[12px] bg-white border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] z-[10005] mt-2"
      >
        <DropdownMenuLabel className="font-normal px-5 pb-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-[#344054]">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-[#f2f4f7] my-2 mx-0" />
        
        <DropdownMenuGroup className="flex flex-col">
          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="px-5 py-3.5 cursor-pointer hover:bg-[#f9fafb]">
            <CircleUser className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
            <span className="text-[16px] font-medium">My Profile</span>
          </DropdownMenuItem>

          {!isDashboard ? (
             <>
               <DropdownMenuItem onClick={() => navigate("/dashboard")} className="px-5 py-3.5 cursor-pointer hover:bg-[#f9fafb]">
                 <PencilLine className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
                 <span className="text-[16px] font-medium">Study</span>
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => navigate("/dashboard/regularBatches")} className="px-5 py-3.5 cursor-pointer hover:bg-[#f9fafb]">
                 <Monitor className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
                 <span className="text-[16px] font-medium">Batches</span>
               </DropdownMenuItem>
             </>
          ) : (
             <DropdownMenuItem onClick={() => navigate("/dashboard/enrollments")} className="px-5 py-3.5 cursor-pointer hover:bg-[#f9fafb]">
               <BookOpen className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
               <span className="text-[16px] font-medium">My Enrollments</span>
             </DropdownMenuItem>
          )}

          <PushNotificationToggle />
        </DropdownMenuGroup>

        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-[#f2f4f7] my-2 mx-0" />
            <DropdownMenuItem
              onClick={() => navigate("/admin/dashboard")}
              className="px-5 py-3.5 cursor-pointer text-[#1d4ed8] hover:bg-[#eff6ff]"
            >
              <span className="text-[16px] font-medium">Admin Panel</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-[#f2f4f7] my-2 mx-0" />

        <DropdownMenuItem onClick={handleSignOut} className="px-5 py-3.5 cursor-pointer text-[#dc2626] hover:bg-[#f9fafb]">
          <LogOut className="mr-4 h-[22px] w-[22px] stroke-[1.8]" />
          <span className="text-[16px] font-medium">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NavBar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { courses, loadCourses } = useBackend();
  useEffect(() => { loadCourses(); }, [loadCourses]);
  const { openLogin } = useLoginModal();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activePane, setActivePane] = useState<"main" | "courses" | "examprep">("main");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const isDashboard = location.pathname.startsWith("/dashboard");

  // --- PROFILE FETCH LOGIC ---
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;

      // 1. Try to get real profile from Supabase DB
      // We use maybeSingle() to avoid 406 errors if row is missing
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data) {
        setProfile({ full_name: data.full_name });
      } 
      // 2. Fallback to Google metadata if DB is empty
      else if (user.user_metadata?.full_name) {
        setProfile({ full_name: user.user_metadata.full_name });
      }
    };
    getProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const courseCategories = useMemo(() => {
    const categories = new Set<string>();
    if (courses && courses.length > 0) {
      courses.forEach(course => {
        if (course.exam_category) {
          categories.add(course.exam_category);
        }
      });
    }
    return Array.from(categories).sort();
  }, [courses]);

  const getCategoryStyle = (category: string) => {
    const normalize = category.toLowerCase();
    if (normalize.includes('jee')) return { icon: Atom, color: "text-[#3B82F6]", slug: 'jee' };
    if (normalize.includes('neet')) return { icon: Stethoscope, color: "text-[#EF4444]", slug: 'neet' };
    if (normalize.includes('iitm') || normalize.includes('bs')) return { icon: GraduationCap, color: "text-[#2ecc71]", slug: 'iitm-bs' };
    return { icon: BookOpen, color: "text-gray-600", slug: category.toLowerCase().replace(/\s+/g, '-') };
  };

  const examPrepItems = [
    { title: "IIT JEE", path: "/exam-preparation/jee", icon: Atom, color: "text-[#3B82F6]" },
    { title: "NEET", path: "/exam-preparation/neet", icon: Stethoscope, color: "text-[#EF4444]" },
    { title: "IITM BS", path: "/exam-preparation/iitm-bs", icon: GraduationCap, color: "text-[#2ecc71]" }
  ];

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-[10000] h-16 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        
        {/* DESKTOP LAYOUT */}
        <div className="hidden md:flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769193106/UI_Logo_yiput4.png" alt="Logo" className="h-10 w-auto" />
            </Link>
          </div>

          <div className="flex items-center justify-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-royal transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-royal transition-colors font-medium">About</Link>
            
            <NavigationMenu className="static">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-gray-700 hover:text-royal hover:bg-transparent focus:bg-transparent text-base font-medium h-auto p-0 transition-colors font-sans">
                    Courses
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!fixed !top-16 left-0 right-0 w-full flex justify-center z-[10001] !mt-0 bg-transparent border-none shadow-none p-0">
                    <div className="w-[700px] bg-white border border-[#e2e2e2] border-t-0 rounded-b-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-5">
                       <div className="grid grid-cols-2 gap-3">
                          {courseCategories.map((category) => {
                            const style = getCategoryStyle(category);
                            const IconComponent = style.icon;
                            return (
                              <NavigationMenuLink key={category} asChild>
                                <Link to={`/courses/category/${style.slug}`} className="flex items-center gap-4 p-4 bg-white border border-[#e2e2e2] rounded cursor-pointer hover:border-black transition-all">
                                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    <IconComponent className={`w-full h-full ${style.color}`} />
                                  </div>
                                  <span className="text-base font-semibold text-[#1a1a1a] font-sans">{category}</span>
                                </Link>
                              </NavigationMenuLink>
                            );
                          })}
                       </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <NavigationMenu className="static">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-gray-700 hover:text-royal hover:bg-transparent focus:bg-transparent text-base font-medium h-auto p-0 transition-colors font-sans">
                    Exam Prep
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!fixed !top-16 left-0 right-0 w-full flex justify-center z-[10001] !mt-0 bg-transparent border-none shadow-none p-0">
                    <div className="w-[700px] bg-white border border-[#e2e2e2] border-t-0 rounded-b-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] p-5">
                       <div className="grid grid-cols-2 gap-3">
                          {examPrepItems.map((item) => (
                            <NavigationMenuLink key={item.path} asChild>
                              <Link to={item.path} className="flex items-center gap-4 p-4 bg-white border border-[#e2e2e2] rounded cursor-pointer hover:border-black transition-all">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                  <item.icon className={`w-full h-full ${item.color}`} />
                                </div>
                                <span className="text-base font-semibold text-[#1a1a1a] font-sans">{item.title}</span>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                       </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            
            <Link to="/career" className="text-gray-700 hover:text-royal transition-colors font-medium">Career</Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <ProfileMenu
                user={user}
                profile={profile}
                handleSignOut={handleSignOut}
                navigate={navigate}
                isDashboard={isDashboard}
                isAdmin={isAdmin}
              />
            ) : (
              <Button 
                onClick={openLogin}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-6 font-medium"
              >
                Sign In/Register
              </Button>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="md:hidden flex items-center justify-between h-full">
          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={(open) => { setIsSheetOpen(open); if(!open) setActivePane("main"); }}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-0 hover:bg-transparent">
                  <Menu className="h-7 w-7 text-black" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-none p-0 flex flex-col z-[50000] border-none font-['Inter',sans-serif] !bg-white !opacity-100">
                <SheetHeader className="px-5 py-5 flex flex-row items-center justify-between border-b border-[#eeeeee] space-y-0 min-h-[73px] bg-white">
                  <div className="flex items-center gap-4">
                    {activePane === "main" ? (
                      <img src="/web-uploads/UI_logo.png" alt="Logo" className="h-9 w-auto" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => setActivePane("main")} className="text-black">
                          <ArrowLeft className="h-7 w-7 stroke-[2.5]" />
                        </button>
                        <span className="text-[19px] font-bold text-[#1a1a1a]">
                          {activePane === "courses" ? "Courses" : "Exam Preparation"}
                        </span>
                      </div>
                    )}
                  </div>
                  <SheetClose asChild>
                    <button className="text-black p-1"><X className="h-8 w-8 stroke-[2.5]" /></button>
                  </SheetClose>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                  {activePane === "main" && (
                    <div className="flex flex-col animate-in slide-in-from-right duration-200">
                      <Link to="/" className="px-5 py-5 text-[16px] font-medium text-[#1a1a1a] border-b border-[#f0f0f0]" onClick={() => setIsSheetOpen(false)}>Home</Link>
                      <Link to="/about" className="px-5 py-5 text-[16px] font-medium text-[#1a1a1a] border-b border-[#f0f0f0]" onClick={() => setIsSheetOpen(false)}>About Us</Link>
                      <button onClick={() => setActivePane("courses")} className="px-5 py-5 text-[16px] font-medium text-[#1a1a1a] flex items-center justify-between border-b border-[#f0f0f0] text-left">
                        All Courses <ChevronRight className="h-4 w-4 text-[#333]" />
                      </button>
                      <button onClick={() => setActivePane("examprep")} className="px-5 py-5 text-[16px] font-medium text-[#1a1a1a] flex items-center justify-between border-b border-[#f0f0f0] text-left">
                        Exam Preparation <ChevronRight className="h-4 w-4 text-[#333]" />
                      </button>
                      <Link to="/career" className="px-5 py-5 text-[16px] font-medium text-[#1a1a1a] border-b border-[#f0f0f0]" onClick={() => setIsSheetOpen(false)}>Career</Link>
                    </div>
                  )}

                  {(activePane === "courses" || activePane === "examprep") && (
                    <div className="p-5 grid grid-cols-2 gap-4 animate-in slide-in-from-left duration-200">
                      {(activePane === "courses" ? courseCategories : examPrepItems).map((item: any) => {
                        const style = activePane === "courses" ? getCategoryStyle(item) : item;
                        const label = activePane === "courses" ? item : item.title;
                        const path = activePane === "courses" ? `/courses/category/${style.slug}` : item.path;
                        return (
                          <Link key={label} to={path} className="flex items-center gap-3 px-3 py-4 bg-white border border-[#e2e2e2] rounded-[4px] hover:border-black transition-all" onClick={() => setIsSheetOpen(false)}>
                            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                              <style.icon className={`w-full h-full ${style.color || 'text-black'}`} />
                            </div>
                            <span className="text-[14px] font-semibold text-[#1a1a1a] leading-tight">{label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!user && (
                  <div className="p-6 bg-white border-t border-[#eeeeee] flex justify-center mt-auto">
                    <div className="w-full flex justify-center">
                       <Button 
                         onClick={() => {
                            setIsSheetOpen(false);
                            setTimeout(() => openLogin(), 150);
                         }}
                         className="w-[200px] h-12 bg-[#1d4ed8] hover:bg-[#1d4ed8] text-white rounded-lg text-[16px] font-bold shadow-none"
                       >
                         Login/Register
                       </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex-shrink-0">
              <img src="/web-uploads/UI_logo.png" alt="Logo" className="h-9 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <ProfileMenu
                user={user}
                profile={profile}
                handleSignOut={handleSignOut}
                navigate={navigate}
                isDashboard={isDashboard}
                isAdmin={isAdmin}
              />
            ) : (
              <Button 
                size="sm" 
                onClick={openLogin}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium text-sm h-9 px-4"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
