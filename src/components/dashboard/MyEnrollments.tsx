import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardTitle, 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// --- Define Types ---

type RawEnrollment = {
  id: string;
  course_id: string;
  subject_name: string | null;
  status: string | null;
  amount: number | null;
  courses: {
    id: string;
    title: string | null;
    start_date: string | null; 
    end_date: string | null;   
    image_url: string | null;
  } | null;
};

type GroupedEnrollment = {
  course_id: string;
  title: string;
  start_date: string | null; 
  end_date: string | null;   
  status: 'Ongoing' | 'Batch Expired' | 'Pending' | 'Unknown';
  subjects: string[]; 
  image_url: string | null;
  total_paid: number;
};

const EnrollmentListItem = ({ enrollment }: { enrollment: GroupedEnrollment }) => {
  
  const StatusIndicator = () => {
    if (enrollment.status === 'Pending') {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
          Payment Pending
        </Badge>
      );
    }

    if (enrollment.status === 'Ongoing') {
      return (
        <div className="flex items-center justify-end gap-1.5 sm:gap-2" title="Ongoing">
          <span className="text-xs sm:text-sm font-medium text-green-600">Ongoing</span>
          <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-green-500"></span>
          </span>
        </div>
      );
    }
    
    // Default to SUCCESS for Expired or Completed but previously purchased
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80 font-medium text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
        SUCCESS
      </Badge>
    );
  };

  const formattedEndDate = enrollment.end_date 
    ? new Date(enrollment.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, ' ')
    : 'No end date';

  const PriceDisplay = () => {
    if (enrollment.total_paid === 0) {
      return <span className="font-medium text-green-700 text-sm sm:text-base">Free</span>;
    }
    return <span className="font-medium text-gray-800 text-sm sm:text-base">{`₹${enrollment.total_paid}`}</span>;
  };

  return (
    <Link 
      to={`/dashboard/receipt?courseId=${enrollment.course_id}`} 
      className="block group"
    >
      <Card className="w-full relative overflow-hidden flex flex-col rounded-lg border border-gray-200 group-hover:border-black transition-all duration-200 shadow-sm sm:shadow-none">
        {/* Compact padding for mobile (p-3) vs regular for desktop (sm:p-5) */}
        <CardContent className="flex items-start sm:items-center gap-3 sm:gap-5 p-3 sm:p-5">
          {/* Smaller image on mobile (w-24 approx 96px) vs larger on desktop */}
          <div className="flex-shrink-0 w-24 sm:w-48 aspect-video overflow-hidden rounded-md sm:rounded-lg bg-gray-50 border border-gray-100">
            <img 
              src={enrollment.image_url || "/web-uploads/logo_ui_new.png"}
              alt={enrollment.title} 
              className="w-full h-full object-cover object-center"
            />
          </div>

          <div className="flex-grow space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-0 gap-1 sm:gap-0">
              {/* Reduced text size for mobile title */}
              <CardTitle className="text-base sm:text-xl font-bold text-gray-900 pr-0 sm:pr-4 leading-tight truncate">
                {enrollment.title}
              </CardTitle>
              <div className="flex-shrink-0 self-start sm:self-auto sm:mt-0">
                <StatusIndicator />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs sm:text-base text-gray-600">
              <div className="flex items-center gap-1.5">
                <span>{formattedEndDate}</span>
                <span className="hidden sm:inline">•</span>
              </div>
              <PriceDisplay />
            </div>
          </div>

          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 ml-auto sm:ml-2 flex-shrink-0 self-center" />
        </CardContent>
        
        {enrollment.status === 'Batch Expired' && (
          <div className="bg-red-50 text-red-700 text-xs sm:text-base p-2 sm:p-4 text-center border-t border-red-100">
            This batch got expired on {formattedEndDate}!
          </div>
        )}
      </Card>
    </Link>
  );
};

const NoEnrollmentsPlaceholder = () => {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      backgroundColor: '#f9f9f9',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh', // Adjusted height to look good within the dashboard
      color: '#1a1a1a',
      borderRadius: '12px',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '20px'
      }}>
        {/* SVG Illustration of the Box */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
            <svg style={{ width: '120px', height: 'auto' }} viewBox="0 0 162 142" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Front Face */}
                <path d="M76.5 137.5L20 110V54L76.5 81.5V137.5Z" fill="#F3BA86" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M76.5 137.5L133 110V54L76.5 81.5V137.5Z" fill="#E6A66E" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
                {/* Interior */}
                <path d="M76.5 81.5L20 54L76.5 26.5L133 54L76.5 81.5Z" fill="#D4935B" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
                {/* Flaps */}
                <path d="M20 54L10 32L66.5 4.5L76.5 26.5L20 54Z" fill="#F3BA86" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M133 54L143 32L86.5 4.5L76.5 26.5L133 54Z" fill="#F3BA86" stroke="black" strokeWidth="3" strokeLinejoin="round"/>
                {/* Highlight line on left */}
                <path d="M26 60V105" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
            </svg>
        </div>

        <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            letterSpacing: '-0.5px',
            color: '#1a1a1a'
        }}>No Purchases Yet</h1>
        <p style={{
            fontSize: '18px',
            color: '#4a4a4a',
            lineHeight: '1.4',
            marginBottom: '35px',
            padding: '0 20px'
        }}>Once you make a purchase, your transaction details will appear here.</p>
        
        <Link to="/courses" style={{ textDecoration: 'none' }}>
           <button 
             style={{
                backgroundColor: '#1a202c',
                color: 'white',
                border: 'none',
                padding: '14px 32px',
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-block'
             }}
             onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
             onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1a202c'}
             onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
             onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
           >
             Explore Batches
           </button>
        </Link>
      </div>
    </div>
  );
};

interface MyEnrollmentsProps {
  onSelectCourse?: (courseId: string) => void;
}

const MyEnrollments = ({ onSelectCourse }: MyEnrollmentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groupedEnrollments, setGroupedEnrollments] = useState<GroupedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessEnrollments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // 1. Fetch raw enrollments WITH amount and status
        // Expanded status check to include expired/completed/inactive so purchased history persists
        const { data: rawData, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            course_id,
            subject_name,
            amount,
            status,
            courses (
              id,
              title, 
              start_date,
              end_date,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .in('status', [
            'success', 'active', 'paid', 'completed', 'expired', 'inactive',
            'SUCCESS', 'ACTIVE', 'PAID', 'COMPLETED', 'EXPIRED', 'INACTIVE'
          ]); 

        if (error) throw error;

        if (!rawData) {
          setGroupedEnrollments([]);
          return;
        }

        // 2. Process and group
        const today = new Date();
        const enrollmentsMap = new Map<string, GroupedEnrollment>();

        for (const enrollment of rawData as unknown as RawEnrollment[]) {
          if (!enrollment.courses) continue; 
          const course_id = enrollment.course_id;
          
          const endDate = enrollment.courses.end_date ? new Date(enrollment.courses.end_date) : null;
          const dbStatus = enrollment.status?.toLowerCase() || 'pending';
          
          // Determine Status Priority
          let calculatedStatus: GroupedEnrollment['status'] = 'Pending';
          
          // Consider all these statuses as "Purchased" (Active row)
          const isRowActive = [
            'success', 'paid', 'active', 'completed', 'expired', 'inactive'
          ].includes(dbStatus);
          
          if (isRowActive) {
             if (endDate && today > endDate) {
               calculatedStatus = 'Batch Expired';
             } else {
               calculatedStatus = 'Ongoing';
             }
          }

          if (!enrollmentsMap.has(course_id)) {
            enrollmentsMap.set(course_id, {
              course_id: course_id,
              title: enrollment.courses.title || 'Unnamed Batch',
              start_date: enrollment.courses.start_date,
              end_date: enrollment.courses.end_date,
              status: calculatedStatus,
              subjects: [],
              image_url: enrollment.courses.image_url,
              total_paid: 0,
            });
          }

          const groupedEntry = enrollmentsMap.get(course_id)!;

          // If we find an active enrollment for this course, it overrides "Pending"
          if (calculatedStatus === 'Ongoing') {
             groupedEntry.status = 'Ongoing';
          } else if (calculatedStatus === 'Batch Expired' && groupedEntry.status !== 'Ongoing') {
             groupedEntry.status = 'Batch Expired';
          }

          groupedEntry.total_paid += (enrollment.amount || 0);

          if (enrollment.subject_name && !groupedEntry.subjects.includes(enrollment.subject_name)) {
            groupedEntry.subjects.push(enrollment.subject_name);
          }
        }

        const processedEnrollments = Array.from(enrollmentsMap.values());
        setGroupedEnrollments(processedEnrollments);

      } catch (error: any) {
        console.error('Enrollment fetch error:', error);
        toast({
          title: "Error",
          description: "Could not fetch enrollments.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessEnrollments();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-royal" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 px-2 sm:px-0">
      
      {/* Mobile-Only Header Row */}
      <div className="flex items-center gap-2 sm:hidden pt-2 pb-1 border-b border-gray-100">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 -ml-1 text-gray-600" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-gray-900">My Enrollments</h1>
      </div>

      {/* Desktop-Only Header (Hidden on Mobile) */}
      {/* ONLY SHOW THIS IF THERE ARE ENROLLMENTS */}
      {groupedEnrollments.length > 0 && (
        <div className="hidden sm:block px-2 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">My Enrollments</h1>
          <p className="text-base text-gray-600">All the courses you are currently enrolled in.</p>
        </div>
      )}

      {groupedEnrollments.length === 0 ? (
        <NoEnrollmentsPlaceholder />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {groupedEnrollments.map((enrollment) => (
            <EnrollmentListItem key={enrollment.course_id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEnrollments;
