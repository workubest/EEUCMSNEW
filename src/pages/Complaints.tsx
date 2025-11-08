import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Download, Calendar, Filter, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { exportToCSV, exportToJSON } from '@/utils/export';
import BulkActions from '@/components/BulkActions';
import ModernComplaintCard from '@/components/ModernComplaintCard';
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types';

export default function Complaints() {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchComplaints();

    // TODO: Implement real-time updates via GAS proxy
    // For now, we'll poll every 30 seconds
    const interval = setInterval(fetchComplaints, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      // Use GAS proxy instead of Supabase
      const response = await fetch('http://localhost:3001/api/complaints', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        const complaintsData: Complaint[] = data.data.map((c: any, index: number) => ({
          id: c.id || c.ID || c.ticketNumber || c['Ticket Number'] || `temp-${index}`,
          ticketNumber: c.ticketNumber || c['Ticket Number'] || '',
          customerId: c.customerId || c['Customer ID'] || '',
          customerName: c.customerName || c['Customer Name'] || '',
          customerPhone: c.customerPhone || c['Customer Phone'] || '',
          customerEmail: c.customerEmail || c['Customer Email'] || '',
          category: (c.category || c.Category) as ComplaintCategory,
          priority: (c.priority || c.Priority) as ComplaintPriority,
          status: (c.status || c.Status) as ComplaintStatus,
          title: c.title || c.Title || '',
          description: c.description || c.Description || '',
          region: c.region || c.Region || '',
          serviceCenter: c.serviceCenter || c['Service Center'] || '',
          assignedTo: c.assignedTo || c['Assigned To'] || '',
          assignedToName: c.assignedTo || c['Assigned To'] || 'Unassigned',
          createdAt: c.createdAt || c['Created At'] || '',
          updatedAt: c.updatedAt || c['Updated At'] || '',
          resolvedAt: c.resolvedAt || c['Resolved At'] || '',
          notes: c.notes || c.Notes || ''
        }));

        setComplaints(complaintsData);
      } else {
        throw new Error(data.error || 'Failed to fetch complaints');
      }
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast({
        title: 'Error fetching complaints',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = (complaint.ticketNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (complaint.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (complaint.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (complaint.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;
    
    const matchesDateFrom = !dateFrom || new Date(complaint.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(complaint.createdAt) <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      in_progress: "default",
      pending: "outline",
      resolved: "secondary",
      closed: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      critical: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline"
    };
    return <Badge variant={variants[priority] || "default"}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">
            Complaints Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <BulkActions
            selectedIds={selectedIds}
            onComplete={() => {
              setSelectedIds([]);
              fetchComplaints();
            }}
          />
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredComplaints)}
            disabled={filteredComplaints.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToJSON(filteredComplaints)}
            disabled={filteredComplaints.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            JSON
          </Button>
          <Button onClick={() => navigate('/complaints/new')} className="gap-2 gradient-primary text-white">
            <Plus className="h-4 w-4" />
            New Complaint
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      {showFilters && (
        <Card className="card-modern">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Filters & Search</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket number, title, customer, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="power_outage">Power Outage</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="connection">Connection</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.length > 0 
                  ? `${selectedIds.length} selected` 
                  : 'Select all'}
              </span>
            </div>
            <Badge variant="secondary">
              {filteredComplaints.length} result{filteredComplaints.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
        
        {filteredComplaints.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No complaints found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint, index) => (
              <ModernComplaintCard
                key={`${complaint.id}-${index}`}
                complaint={complaint}
                isSelected={selectedIds.includes(complaint.id)}
                onSelect={() => toggleSelectOne(complaint.id)}
                onClick={() => navigate(`/complaints/${complaint.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
