
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useProfileForm = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [exam, setExam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const classOptions = ["11th", "12th", "Dropper", "College student"];
  const examOptions = ["JEE", "NEET", "IITM BS Data Science", "IITM BS Electronic Systems"];

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };
  
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/auth');
          return;
        }
        
        setUser(data.session.user);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (profileData) {
          setFullName(profileData.full_name || '');
          setPhone(profileData.phone || '');
          setStudentClass(profileData.class || '');
          setExam(profileData.exam || '');
        }
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/auth');
      }
    };
    
    getUserData();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }
    
    if (!isValidPhone(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }
    
    if (!studentClass) {
      toast({
        title: "Class required",
        description: "Please select your class",
        variant: "destructive",
      });
      return;
    }
    
    if (!exam) {
      toast({
        title: "Exam required",
        description: "Please select your exam",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update main profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          phone,
          class: studentClass,
          exam
        });
        
      if (error) throw error;
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated."
      });
      
      navigate('/');
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: error.message || "An error occurred while saving your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
    studentClass,
    setStudentClass,
    exam,
    setExam,
    isLoading,
    handleSubmit,
    isValidPhone,
    classOptions,
    examOptions,
  };
};
