import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ModernComplaintCard from '@/components/ModernComplaintCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  FileText,
  Activity,
  Search,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import ActivityFeed from '@/components/ActivityFeed';
import StatCard from '@/components/StatCard';
import FilterPanel from '@/components/FilterPanel';
import { useNavigate } from 'react-router-dom';

// Using GAS proxy instead of Supabase
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allComplaints, setAllComplaints] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchDashboardData = async () => {
    try {
      console.log('🚀 Starting dashboard data fetch...');
      const startTime = performance.now();

      // Fetch complaints from GAS proxy
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
      const fetchTime = performance.now() - startTime;
      console.log(`✅ Dashboard data fetched in ${fetchTime.toFixed(2)}ms`);

      if (data.success && data.data) {
        const complaintsData = data.data.map((c: any, index: number) => ({
          id: c.id || c.ID || c.ticketNumber || c['Ticket Number'] || `temp-${index}`,
          ticketNumber: c.ticketNumber || c['Ticket Number'] || '',
          customerId: c.customerId || c['Customer ID'] || '',
          customerName: c.customerName || c['Customer Name'] || '',
          customerPhone: c.customerPhone || c['Customer Phone'] || '',
          customerEmail: c.customerEmail || c['Customer Email'] || '',
          category: (c.category || c.Category) as any,
          priority: (c.priority || c.Priority) as any,
          status: (c.status || c.Status) as any,
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

        setAllComplaints(complaintsData);
        setRecentComplaints(complaintsData.slice(0, 5));
        console.log(`📊 Loaded ${complaintsData.length} complaints`);
      } else {
        throw new Error(data.error || 'Failed to fetch complaints');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setAllComplaints([]);
      setRecentComplaints([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // No real-time updates for GAS backend - could implement polling if needed
  }, []);

  const filteredComplaints = useMemo(() => {
    return allComplaints.filter(complaint => {
      const matchesSearch = (complaint.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complaint.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (complaint.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;

      const matchesDateFrom = !dateFrom || new Date(complaint.createdAt) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(complaint.createdAt) <= new Date(dateTo + 'T23:59:59');

      return matchesSearch && matchesStatus && matchesPriority && matchesDateFrom && matchesDateTo;
    });
  }, [allComplaints, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo]);

  // Calculate stats from all complaints using useMemo for performance
  const stats = useMemo(() => ({
    total: allComplaints.length,
    open: allComplaints.filter(c => c.status === 'open').length,
    inProgress: allComplaints.filter(c => c.status === 'in_progress').length,
    resolved: allComplaints.filter(c => c.status === 'resolved').length,
    critical: allComplaints.filter(c => c.priority === 'critical').length,
  }), [allComplaints]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Welcome back, {user?.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              Here's what's happening with your complaints today.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={{
            status: statusFilter,
            priority: priorityFilter,
          }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
            if (key === 'priority') setPriorityFilter(value);
          }}
          filterOptions={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending', label: 'Pending' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ],
            },
            {
              key: 'priority',
              label: 'Priority',
              options: [
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
          ]}
          dateFilters={{
            from: dateFrom,
            to: dateTo,
            onFromChange: setDateFrom,
            onToChange: setDateTo,
          }}
          onClearAll={handleClearFilters}
          resultCount={filteredComplaints.length}
          totalCount={allComplaints.length}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Complaints"
          value={stats.total}
          icon={FileText}
          gradient="primary"
        />
        <StatCard
          title="Open"
          value={stats.open}
          icon={AlertCircle}
          gradient="warning"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Activity}
          gradient="primary"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          gradient="secondary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Complaints - Takes 2 columns */}
        <Card className="lg:col-span-2 card-modern">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Complaints
              </CardTitle>
              <Badge variant="secondary">{filteredComplaints.length} of {allComplaints.length} shown</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredComplaints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {allComplaints.length === 0 ? 'No complaints yet' : 'No complaints match your filters'}
                </p>
              ) : (
                filteredComplaints.map((complaint, index) => (
                  <ModernComplaintCard
                    key={`${complaint.id}-${index}`}
                    complaint={complaint}
                    isSelected={false}
                    onSelect={() => {}}
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed - Takes 1 column */}
        <ActivityFeed />
      </div>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5 card-modern">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Zap className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 text-destructive">
                  Critical Complaints Alert
                </h3>
                <p className="text-sm text-muted-foreground">
                  There are <strong className="text-foreground">{stats.critical}</strong> critical complaints that need immediate attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
