import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, User, Phone, Mail, Calendar, Clock, FileText, Paperclip, Trash2 } from 'lucide-react';
import type { Complaint, ComplaintStatus, ComplaintCategory, ComplaintPriority, User as UserType } from '@/types';
import FileUpload from '@/components/FileUpload';
import AttachmentsList from '@/components/AttachmentsList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notes, setNotes] = useState('');

  const canEdit = userRole && ['admin', 'manager', 'staff', 'technician'].includes(userRole);
  const canDelete = userRole && ['admin', 'manager'].includes(userRole);

  useEffect(() => {
    fetchComplaintDetails();
    fetchHistory();
    if (canEdit) {
      fetchStaffList();
    }

    // GAS doesn't support real-time subscriptions yet
    // Could implement polling if needed
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      // Fetch complaint details from GAS proxy
      const response = await fetch(`http://localhost:3001/api/complaints/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`Fetching complaint details for ID: ${id}`);
      console.log(`API Response Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response Data:', data);

      if (data.success && data.data) {
        const complaint = data.data;
        const complaintData: Complaint = {
          id: complaint.ID || complaint.id,
          ticketNumber: complaint['Ticket Number'] || complaint.ticket_number,
          customerId: complaint['Customer ID'] || complaint.customer_id || '',
          customerName: complaint['Customer Name'] || complaint.customer_name,
          customerPhone: complaint['Customer Phone'] || complaint.customer_phone,
          customerEmail: complaint['Customer Email'] || complaint.customer_email,
          category: complaint.Category || complaint.category,
          priority: complaint.Priority || complaint.priority,
          status: complaint.Status || complaint.status,
          title: complaint.Title || complaint.title,
          description: complaint.Description || complaint.description,
          region: complaint.Region || complaint.region || '',
          serviceCenter: complaint['Service Center'] || complaint.service_center || '',
          assignedTo: complaint['Assigned To'] || complaint.assigned_to,
          assignedToName: 'Unassigned', // GAS doesn't have profile joins
          createdAt: complaint['Created At'] || complaint.created_at,
          updatedAt: complaint['Updated At'] || complaint.updated_at,
          resolvedAt: complaint['Resolved At'] || complaint.resolved_at,
          notes: complaint.Notes || complaint.notes
        };

        setComplaint(complaintData);
      } else {
        throw new Error(data.error || 'Failed to fetch complaint details');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      // GAS doesn't support history tracking yet, so we'll skip this
      console.log('History tracking not available with GAS backend');
      setHistory([]);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchStaffList = async () => {
    try {
      // GAS doesn't support user management yet, so we'll use demo staff
      const demoStaff: UserType[] = [
        {
          id: 'staff1',
          email: 'staff@eeu.com',
          name: 'John Staff',
          role: 'staff',
          region: 'North',
          serviceCenter: 'Center A',
          active: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'staff2',
          email: 'manager@eeu.com',
          name: 'Jane Manager',
          role: 'manager',
          region: 'South',
          serviceCenter: 'Center B',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];

      setStaffList(demoStaff);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
    }
  };

  const updateStatus = async (newStatus: ComplaintStatus) => {
    if (!complaint) return;

    setUpdating(true);
    try {
      // Update complaint status via GAS proxy
      const response = await fetch(`http://localhost:3001/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update complaint status');
      }

      toast({
        title: 'Success',
        description: 'Complaint status updated successfully'
      });

      setNotes('');
      fetchComplaintDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const assignStaff = async (staffId: string) => {
    if (!complaint) return;

    setUpdating(true);
    try {
      // Update complaint assignment via GAS proxy
      const response = await fetch(`http://localhost:3001/api/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_to: staffId,
          updated_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to assign staff');
      }

      toast({
        title: 'Success',
        description: 'Staff assigned successfully'
      });

      fetchComplaintDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!complaint) return;

    setDeleting(true);
    try {
      // Delete complaint via GAS proxy
      const response = await fetch(`http://localhost:3001/api/complaints/${complaint.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete complaint');
      }

      toast({
        title: 'Success',
        description: 'Complaint deleted successfully'
      });

      navigate('/complaints');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: 'default',
      in_progress: 'secondary',
      pending: 'outline',
      resolved: 'default',
      closed: 'secondary'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'default',
      high: 'default',
      critical: 'destructive'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">Complaint not found</p>
          <Button onClick={() => navigate('/complaints')} className="mt-4 mx-auto block">
            Back to Complaints
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/complaints')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Complaint Details</h1>
          <p className="text-muted-foreground">Ticket #{complaint.ticketNumber}</p>
        </div>
        {getStatusBadge(complaint.status)}
        {getPriorityBadge(complaint.priority)}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete complaint #{complaint.ticketNumber}? 
                  This action cannot be undone and will permanently delete all complaint data, 
                  history, and attachments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting...' : 'Delete Complaint'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{complaint.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{complaint.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1 capitalize">{complaint.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <p className="mt-1">{complaint.region}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service Center</label>
                  <p className="mt-1">{complaint.serviceCenter}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {complaint.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Internal Notes</label>
                  <p className="mt-1">{complaint.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {canEdit && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatus('in_progress')}
                    disabled={updating || complaint.status === 'in_progress'}
                    variant={complaint.status === 'in_progress' ? 'default' : 'outline'}
                  >
                    In Progress
                  </Button>
                  <Button
                    onClick={() => updateStatus('pending')}
                    disabled={updating || complaint.status === 'pending'}
                    variant={complaint.status === 'pending' ? 'default' : 'outline'}
                  >
                    Pending
                  </Button>
                  <Button
                    onClick={() => updateStatus('resolved')}
                    disabled={updating || complaint.status === 'resolved'}
                    variant={complaint.status === 'resolved' ? 'default' : 'outline'}
                  >
                    Resolved
                  </Button>
                  <Button
                    onClick={() => updateStatus('closed')}
                    disabled={updating || complaint.status === 'closed'}
                    variant={complaint.status === 'closed' ? 'default' : 'outline'}
                  >
                    Closed
                  </Button>
                </div>
                
                <Textarea
                  placeholder="Add notes about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="relative pl-6 pb-3 border-l-2 border-primary">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        Status changed to <span className="text-primary capitalize">{entry.new_status.replace('_', ' ')}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {entry.changed_by_profile?.name || 'Unknown'} • {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.notes && (
                        <p className="mt-2 text-sm bg-muted p-2 rounded italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Attachments</h3>
            </div>
            <AttachmentsList complaintId={id!} canDelete={canEdit} />
          </Card>

          {canEdit && (
            <FileUpload 
              complaintId={id!} 
              onUploadComplete={fetchComplaintDetails}
            />
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{complaint.customerName}</p>
                  <p className="text-sm text-muted-foreground">Customer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{complaint.customerPhone}</p>
                  <p className="text-sm text-muted-foreground">Phone</p>
                </div>
              </div>
              {complaint.customerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{complaint.customerEmail}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {canEdit && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Assignment</h3>
              <Select
                value={complaint.assignedTo || ''}
                onValueChange={assignStaff}
                disabled={updating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {complaint.assignedToName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Currently assigned to: {complaint.assignedToName}
                </p>
              )}
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-muted-foreground">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p className="text-muted-foreground">{new Date(complaint.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              {complaint.resolvedAt && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Resolved</p>
                    <p className="text-muted-foreground">{new Date(complaint.resolvedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
