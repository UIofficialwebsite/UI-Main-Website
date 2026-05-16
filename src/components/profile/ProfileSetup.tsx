
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [programType, setProgramType] = useState<'IITM_BS' | 'COMPETITIVE_EXAM' | ''>('');
  const [studentName, setStudentName] = useState('');
  
  // IITM BS fields
  const [branch, setBranch] = useState('');
  const [level, setLevel] = useState('');
  
  // Competitive exam fields
  const [examType, setExamType] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!studentName.trim()) {
      toast({
        title: "Student name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!programType) {
      toast({
        title: "Program type required",
        description: "Please select your program type",
        variant: "destructive",
      });
      return;
    }

    if (programType === 'IITM_BS') {
      if (!branch || !level) {
        toast({
          title: "Branch and level required",
          description: "Please select your branch and level",
          variant: "destructive",
        });
        return;
      }
    } else if (programType === 'COMPETITIVE_EXAM') {
      if (!examType || !studentStatus) {
        toast({
          title: "Exam type and status required",
          description: "Please select your exam type and student status",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      // Update the main profiles table
      const profileData: any = {
        id: user.id,
        student_name: studentName,
        full_name: studentName,
        email: user.email,
        program_type: programType,
        profile_completed: true,
        role: 'student'
      };

      if (programType === 'IITM_BS') {
        profileData.branch = branch;
        profileData.level = level;
      } else if (programType === 'COMPETITIVE_EXAM') {
        profileData.exam_type = examType;
        profileData.student_status = studentStatus;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile completed!",
        description: "Your profile has been successfully set up.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Please provide your details to access personalized content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Name - Always Required */}
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name *</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Program Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Educational Background</h3>
            
            <div className="space-y-2">
              <Label>Program Type *</Label>
              <Select value={programType} onValueChange={(value: 'IITM_BS' | 'COMPETITIVE_EXAM') => setProgramType(value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IITM_BS">IITM BS Program</SelectItem>
                  <SelectItem value="COMPETITIVE_EXAM">Competitive Exam Preparation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IITM BS Fields */}
            {programType === 'IITM_BS' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={branch} onValueChange={setBranch} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronic Systems">Electronic Systems</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Level *</Label>
                  <Select value={level} onValueChange={setLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Qualifier">Qualifier</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                      <SelectItem value="Degree">Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Competitive Exam Fields */}
            {programType === 'COMPETITIVE_EXAM' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Type *</Label>
                  <Select value={examType} onValueChange={setExamType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JEE">JEE</SelectItem>
                      <SelectItem value="NEET">NEET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Student Status *</Label>
                  <Select value={studentStatus} onValueChange={setStudentStatus} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class 11">Class 11</SelectItem>
                      <SelectItem value="Class 12">Class 12</SelectItem>
                      <SelectItem value="Dropper">Dropper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-royal hover:bg-royal-dark" 
            disabled={isLoading}
          >
            {isLoading ? "Setting up..." : "Complete Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup;
