
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContentManagementCard from './ContentManagementCard';
import { useBackend } from '@/components/BackendIntegratedWrapper';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const ContentManagementTab = () => {
  const { notes, pyqs, courses, contentLoading, updateNote, updatePyq, refreshNotes, refreshPyqs, loadAllNotes, loadAllPyqs, loadAllCourses } = useBackend();
  useEffect(() => {
    loadAllNotes();
    loadAllPyqs();
    loadAllCourses();
  }, [loadAllNotes, loadAllPyqs, loadAllCourses]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [examTypeFilter, setExamTypeFilter] = useState('all');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingContentType, setEditingContentType] = useState<'notes' | 'pyqs' | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title || '',
        description: editingItem.description || '',
        year: editingItem.year?.toString() || '',
        subject: editingItem.subject || '',
        exam_type: editingItem.exam_type || '',
        branch: editingItem.branch || '',
        level: editingItem.level || '',
        class_level: editingItem.class_level || '',
        file_link: editingItem.file_link || '',
        content_url: editingItem.content_url || '',
      });
    }
  }, [editingItem]);

  const handleEdit = (item: any, contentType: 'notes' | 'pyqs') => {
    setEditingItem(item);
    setEditingContentType(contentType);
    setIsEditDialogOpen(true);
  };
  
  const getSubjectOptions = (examType: string) => {
    switch (examType) {
      case 'JEE':
        return ['Physics', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Mathematics'];
      case 'NEET':
        return ['Physics', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Botany', 'Zoology'];
      case 'IITM_BS':
        return formData.branch === 'Data Science' 
          ? ['Mathematics', 'Statistics', 'Programming', 'Data Analysis']
          : ['Electronics', 'Signal Processing', 'Circuit Design', 'Digital Systems'];
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingContentType) return;
    setIsLoading(true);

    const updateData = {
      title: formData.title,
      description: formData.description,
      subject: formData.subject || null,
      exam_type: formData.exam_type || null,
      branch: formData.exam_type === 'IITM_BS' ? formData.branch : null,
      level: formData.exam_type === 'IITM_BS' ? formData.level : null,
      file_link: formData.file_link || null,
      content_url: formData.content_url || null,
      ...(editingContentType === 'notes' && { class_level: formData.class_level || null }),
      ...(editingContentType === 'pyqs' && { year: formData.year ? parseInt(formData.year) : null }),
    };

    try {
      let success = false;
      if (editingContentType === 'notes') {
        success = await updateNote(editingItem.id, updateData);
      } else if (editingContentType === 'pyqs') {
        success = await updatePyq(editingItem.id, updateData);
      }

      if (success) {
        toast({ title: "Success", description: "Content updated successfully." });
        setIsEditDialogOpen(false);
        setEditingItem(null);
        if (editingContentType === 'notes') await refreshNotes();
        if (editingContentType === 'pyqs') await refreshPyqs();
      }
    } catch (error) {
       toast({ title: "Error", description: "Failed to update content.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  const filterContent = (items: any[]) => {
    return items.filter(item => {
      const matchesSearch = (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                           (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = subjectFilter === 'all' || item.subject === subjectFilter;
      const matchesExamType = examTypeFilter === 'all' || (item.exam_type || item.exam_category) === examTypeFilter;
      
      return matchesSearch && matchesSubject && matchesExamType;
    });
  };

  const filteredNotes = filterContent(notes);
  const filteredPyqs = filterContent(pyqs);
  const filteredCourses = filterContent(courses || []);

  const allSubjects = [...new Set([...notes, ...pyqs, ...(courses || [])].map((item: any) => item.subject).filter(Boolean))];
  const allExamTypes = [...new Set([...notes, ...pyqs, ...(courses || [])].map((item: any) => item.exam_type || item.exam_category).filter(Boolean))];

  if (contentLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold mb-4">Content Management</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {allSubjects.filter(s => !!s && String(s).trim() !== '').map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by exam type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exam Types</SelectItem>
              {allExamTypes.filter(e => !!e && String(e).trim() !== '').map(examType => (
                <SelectItem key={examType} value={examType}>{examType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">Notes ({filteredNotes.length})</TabsTrigger>
            <TabsTrigger value="pyqs">PYQs ({filteredPyqs.length})</TabsTrigger>
            <TabsTrigger value="courses">Courses ({filteredCourses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No notes found matching your criteria.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredNotes.map(note => (
                  <ContentManagementCard
                    key={note.id}
                    item={note}
                    contentType="notes"
                    onEdit={(item) => handleEdit(item, 'notes')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pyqs" className="mt-6">
            {filteredPyqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No PYQs found matching your criteria.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredPyqs.map(pyq => (
                  <ContentManagementCard
                    key={pyq.id}
                    item={pyq}
                    contentType="pyqs"
                    onEdit={(item) => handleEdit(item, 'pyqs')}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No courses found matching your criteria.
              </div>
            ) : (
               <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Bestseller</TableHead>
                      <TableHead>Enrolled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.exam_category}</TableCell>
                        <TableCell>
                          {course.discounted_price ? (
                            <div className="flex items-center gap-2">
                              <span className="line-through text-gray-500">₹{course.price}</span>
                              <span className="font-semibold">₹{course.discounted_price}</span>
                            </div>
                          ) : `₹${course.price}`}
                        </TableCell>
                        <TableCell>{course.bestseller ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{course.students_enrolled || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingContentType === 'notes' ? 'Note' : 'PYQ'}</DialogTitle>
            <DialogDescription>
              Update the details for "{editingItem?.title}".
              <br />
              <small>Note: Session and Shift cannot be edited from this view. Please use the respective 'Notes' or 'PYQs' tabs for those fields.</small>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              {editingContentType === 'pyqs' && (
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="2024" />
                </div>
              )}
               {editingContentType === 'notes' && (
                <div>
                  <Label htmlFor="class_level">Class Level</Label>
                  <Input id="class_level" value={formData.class_level} onChange={(e) => setFormData({ ...formData, class_level: e.target.value })} placeholder="e.g., Class 11" />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exam_type">Exam Type *</Label>
                <Select value={formData.exam_type} onValueChange={(value) => setFormData({ ...formData, exam_type: value, subject: '', branch: '', level: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select exam type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JEE">JEE</SelectItem>
                    <SelectItem value="NEET">NEET</SelectItem>
                    <SelectItem value="IITM_BS">IITM BS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {getSubjectOptions(formData.exam_type).filter(s => !!s && String(s).trim() !== '').map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.exam_type === 'IITM_BS' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value, subject: '' })}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Electronic System">Electronic System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
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

            <div>
              <Label htmlFor="file_link">File Link</Label>
              <Input id="file_link" type="url" value={formData.file_link} onChange={(e) => setFormData({ ...formData, file_link: e.target.value })} placeholder="https://..." />
            </div>
            
            <div>
              <Label htmlFor="content_url">Content URL (Supabase Storage)</Label>
              <Input id="content_url" type="url" value={formData.content_url} onChange={(e) => setFormData({ ...formData, content_url: e.target.value })} placeholder="https://..." />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Update'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagementTab;
