import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CalendarDays, Languages, Check } from "lucide-react";
import { ShareButton } from "../ShareButton";
import { Button } from "@/components/ui/button";
import { Course } from "@/components/admin/courses/types";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

interface IITMCourseCardProps {
  course: Course;
}

const IITMCourseCard: React.FC<IITMCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const isPremium = course.course_type === 'Gold';
  const hasDiscount = course.discounted_price && course.discounted_price < course.price;

  // Enrollment status check
  const { isFullyEnrolled, isMainCourseOwned, hasRemainingAddons } = useEnrollmentStatus(course.id);

  const renderActionButton = () => {
    // Fully enrolled - show "Let's Study"
    if (isFullyEnrolled) {
      return (
        <Button
          onClick={() => navigate('/dashboard')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          LET'S STUDY
        </Button>
      );
    }

    // Main owned but addons available - show "Upgrade"
    if (isMainCourseOwned && hasRemainingAddons) {
      return (
        <Button
          onClick={() => navigate(`/courses/${course.id}/configure`)}
          className={isPremium ?
            "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white" :
            "bg-royal hover:bg-royal-dark text-white"}
        >
          UPGRADE
        </Button>
      );
    }

    // Normal enrollment flow -> Configure batch page
    return (
      <Button
        onClick={() => navigate(`/courses/${course.id}/configure`)}
        className={isPremium ?
          "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white" :
          "bg-royal hover:bg-royal-dark text-white"}
      >
        Enroll Now
      </Button>
    );
  };

  return (
    <Card
      className={`border-none shadow-md hover:shadow-xl transition-all relative overflow-hidden flex flex-col ${isPremium ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300' : 'bg-white'}`}
    >
      {/* ENROLLED Badge */}
      {isFullyEnrolled && (
        <div className="absolute top-3 right-3 z-10 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Check className="w-3 h-3" /> ENROLLED
        </div>
      )}

      <CardHeader className="pt-8">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl flex items-center flex-wrap">
            <span className="mr-2">{course.title}</span>
            {isPremium && (
              <Badge variant="default" className="bg-amber-500 text-white">
                <Star className="h-3 w-3 mr-1 fill-current" /> Premium
              </Badge>
            )}
          </CardTitle>
          <Badge variant="outline" className={`${course.level?.toLowerCase() === 'foundation' ? 'bg-blue-100 text-blue-700' : course.level?.toLowerCase() === 'diploma' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
            {course.level ? course.level.charAt(0).toUpperCase() + course.level.slice(1) : ''}
          </Badge>
        </div>
        <CardDescription className="text-base min-h-[60px]">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Batch Starts</p>
            <p className="font-medium">{course.start_date ? new Date(course.start_date).toLocaleDateString() : 'TBA'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 flex items-center"><Languages className="h-4 w-4 mr-2" /> Language</p>
            <p className="font-medium">{course.language || 'English'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Key Features:</p>
          <ul className="list-disc pl-5 space-y-1">
            {course.features?.map((feature, index) => (
              <li key={index} className="text-sm">{feature}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 bg-gray-50 p-4 mt-auto">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-baseline">
            {hasDiscount ? (
              <>
                <span className={`text-2xl font-bold ${isPremium ? 'text-amber-600' : 'text-royal'}`}>₹{course.discounted_price}</span>
                <span className="ml-2 text-gray-500 line-through">₹{course.price}</span>
              </>
            ) : (
              <span className={`text-2xl font-bold ${isPremium ? 'text-amber-600' : 'text-royal'}`}>₹{course.price}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
             {hasDiscount && (
               <Badge variant="destructive">
                 {Math.round(((course.price - course.discounted_price!) / course.price) * 100)}% OFF
               </Badge>
             )}
              <Link to={`/courses/${course.id}`}>
                  <Button variant="outline">Know More</Button>
              </Link>
              {renderActionButton()}
          </div>
        </div>
        <ShareButton
          url={`${window.location.origin}/courses/${course.id}`}
          title={course.title}
          description={course.description}
          variant="ghost"
          showText
          className="w-full"
        />
      </CardFooter>
    </Card>
  );
};

export default IITMCourseCard;
