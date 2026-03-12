import React, { useState } from 'react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, Calendar, Building, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  position: string;
  department: string;
  employee_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

const EmployeeVerification = () => {
  usePageSEO(SEO_TITLES.EMPLOYEE_VERIFICATION, "/employee-verification");
  const [employeeCode, setEmployeeCode] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleVerification = async () => {
    if (!employeeCode.trim()) {
      toast({
        title: "Employee Code Required",
        description: "Please enter an employee code to verify",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .rpc('verify_employee', { p_employee_code: employeeCode.trim() })
        .maybeSingle();

      if (error) {
        throw error;
      }

      setEmployee(data || null);

      if (!data) {
        toast({
          title: "Employee Not Found",
          description: "No employee found with the provided code",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error verifying employee:', error);
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the employee",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmployeeCode('');
    setEmployee(null);
    setSearched(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Employee Verification Portal</h1>
            <p className="text-xl text-gray-600">Verify employee credentials with Unknown IITians</p>
          </div>

          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Employee Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="employee-code">Employee Code</Label>
                  <Input
                    id="employee-code"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Enter employee code (e.g., UI001)"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <Button 
                    onClick={handleVerification} 
                    disabled={loading || !employeeCode.trim()}
                    className="bg-royal hover:bg-royal-dark"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {searched && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {employee ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      Employee Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-5 w-5 text-red-600" />
                      Employee Not Found
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employee ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Full Name</p>
                            <p className="text-lg font-semibold">{employee.full_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Position</p>
                            <p className="text-lg font-semibold">{employee.position}</p>
                          </div>
                        </div>

                        {employee.department && (
                          <div className="flex items-center space-x-3">
                            <Building className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Department</p>
                              <p className="text-lg font-semibold">{employee.department}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Employee Code</p>
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {employee.employee_code}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Employee Type</p>
                          <Badge variant="secondary">
                            {employee.employee_type?.charAt(0).toUpperCase() + employee.employee_type?.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-500">Start Date</p>
                            <p className="font-semibold">{formatDate(employee.start_date)}</p>
                          </div>
                        </div>
                        
                        {employee.end_date && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">End Date</p>
                              <p className="font-semibold">{formatDate(employee.end_date)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <p className="text-green-800 font-medium">
                          This employee is {employee.is_active ? 'currently active' : 'not active'} with Unknown IITians.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Not Found</h3>
                    <p className="text-gray-600">
                      The employee code "{employeeCode}" could not be found in our records. 
                      Please verify the code and try again.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmployeeVerification;
