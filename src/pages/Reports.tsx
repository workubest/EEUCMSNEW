import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, Filter, BarChart3, AlertCircle, Clock, Eye, EyeOff } from 'lucide-react';
import FilterPanel from '@/components/FilterPanel';
import type { Complaint } from '@/types';

export default function Reports() {
  const [timeRange, setTimeRange] = useState('all');
  const [statusData, setStatusData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalInTimeRange, setTotalInTimeRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const COLORS = ['#ea580c', '#16a34a', '#2563eb', '#ca8a04', '#dc2626', '#9333ea'];

  useEffect(() => {
    fetchData();

    // For GAS backend, we don't have real-time subscriptions
    // Could implement polling if needed
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [timeRange, searchQuery, statusFilter, priorityFilter, categoryFilter, dateFrom, dateTo]);

  const fetchData = async () => {
    try {
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

      if (data.success && data.data) {
        const mappedComplaints: Complaint[] = data.data.map((c: any) => ({
          id: c.ID || c.id,
          ticketNumber: c['Ticket Number'] || c.ticket_number,
          customerId: c['Customer ID'] || c.customer_id || '',
          customerName: c['Customer Name'] || c.customer_name,
          customerPhone: c['Customer Phone'] || c.customer_phone,
          customerEmail: c['Customer Email'] || c.customer_email,
          category: c.Category || c.category,
          priority: c.Priority || c.priority,
          status: c.Status || c.status,
          title: c.Title || c.title,
          description: c.Description || c.description,
          region: c.Region || c.region || '',
          serviceCenter: c['Service Center'] || c.service_center || '',
          assignedTo: c['Assigned To'] || c.assigned_to,
          createdAt: c['Created At'] || c.created_at,
          updatedAt: c['Updated At'] || c.updated_at,
          resolvedAt: c['Resolved At'] || c.resolved_at,
          notes: c.Notes || c.notes
        }));

        setComplaints(mappedComplaints);
      } else {
        throw new Error(data.error || 'Failed to fetch complaints');
      }
    } catch (error: any) {
      toast({
        title: 'Error fetching data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      // Fetch all complaints from GAS proxy (time range filtering will be done client-side)
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

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch complaints');
      }

      let complaints = data.data;

      // Apply time range filter client-side if not 'all'
      if (timeRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
        complaints = complaints.filter((c: any) => new Date(c['Created At'] || c.created_at) >= daysAgo);
      }

      // Apply filters to the complaints data
      const filteredComplaints = (complaints || []).filter(complaint => {
        const matchesSearch = (complaint['Ticket Number'] || complaint.ticket_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (complaint.Title || complaint.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (complaint['Customer Name'] || complaint.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (complaint.Description || complaint.description || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || (complaint.Status || complaint.status) === statusFilter;
        const matchesPriority = priorityFilter === 'all' || (complaint.Priority || complaint.priority) === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || (complaint.Category || complaint.category) === categoryFilter;

        const matchesDateFrom = !dateFrom || new Date(complaint['Created At'] || complaint.created_at) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(complaint['Created At'] || complaint.created_at) <= new Date(dateTo + 'T23:59:59');

        return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
      });

      // Calculate stats from filtered data
      const total = filteredComplaints.length;
      const open = filteredComplaints.filter(c => c.status === 'open').length;
      const resolved = filteredComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
      const inProgress = filteredComplaints.filter(c => c.status === 'in_progress').length;
      const critical = filteredComplaints.filter(c => c.priority === 'critical').length;

      // Store total count from time range for display
      setTotalInTimeRange((complaints || []).length);

      // Calculate average resolution time
      const resolvedComplaints = filteredComplaints.filter(c => c['Resolved At'] || c.resolved_at);
      const avgResolutionTime = resolvedComplaints.length > 0
        ? resolvedComplaints.reduce((acc, c) => {
            const created = new Date(c['Created At'] || c.created_at).getTime();
            const resolved = new Date(c['Resolved At'] || c.resolved_at).getTime();
            return acc + (resolved - created);
          }, 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Status distribution
      const statusCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value
      })));

      // Category distribution
      const categoryCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {});
      setCategoryData(Object.entries(categoryCounts).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value
      })));

      // Priority distribution
      const priorityCounts = filteredComplaints.reduce((acc: any, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {});
      setPriorityData(Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.toUpperCase(),
        value
      })));

      // Trend data (daily counts) - only show if time range is not 'all'
      if (timeRange !== 'all') {
        const trendMap = new Map();
        const days = parseInt(timeRange);
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          trendMap.set(dateStr, { date: dateStr, count: 0 });
        }

        filteredComplaints.forEach(c => {
          const dateStr = (c['Created At'] || c.created_at).split('T')[0];
          if (trendMap.has(dateStr)) {
            trendMap.get(dateStr).count++;
          }
        });

        setTrendData(Array.from(trendMap.values()));
      } else {
        // For 'all time', show monthly trend for the last 12 months
        const trendMap = new Map();
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
          trendMap.set(monthStr, { date: monthStr, count: 0 });
        }

        filteredComplaints.forEach(c => {
          const monthStr = (c['Created At'] || c.created_at).slice(0, 7);
          if (trendMap.has(monthStr)) {
            trendMap.get(monthStr).count++;
          }
        });

        setTrendData(Array.from(trendMap.values()));
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = ((complaint.ticketNumber || '') + '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((complaint.title || '') + '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((complaint.customerName || '') + '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((complaint.description || '') + '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;

    const matchesDateFrom = !dateFrom || new Date(complaint.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(complaint.createdAt) <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const stats = {
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'in_progress').length,
    resolved: filteredComplaints.filter(c => c.status === 'resolved').length,
    critical: filteredComplaints.filter(c => c.priority === 'critical').length,
    resolutionRate: filteredComplaints.length > 0
      ? Math.round((filteredComplaints.filter(c => c.status === 'resolved').length / filteredComplaints.length) * 100)
      : 0,
    avgResolutionTime: '2.4h' // Placeholder for now
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Loading reports and analytics...</p>
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
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold">
            Reports & Analytics
          </h1>
          <p className="text-lg text-muted-foreground">Comprehensive complaint insights and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
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
            category: categoryFilter,
          }}
          onFilterChange={(key, value) => {
            if (key === 'status') setStatusFilter(value);
            if (key === 'priority') setPriorityFilter(value);
            if (key === 'category') setCategoryFilter(value);
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
            {
              key: 'category',
              label: 'Category',
              options: [
                { value: 'power_outage', label: 'Power Outage' },
                { value: 'billing', label: 'Billing' },
                { value: 'connection', label: 'Connection' },
                { value: 'meter', label: 'Meter' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'other', label: 'Other' },
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
          totalCount={complaints.length}
        />
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{stats.resolutionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.resolved} resolved</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-xs text-muted-foreground mt-1">Being handled</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-xs text-destructive flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {stats.critical > 0 ? 'Requires attention' : 'All clear'}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Complaints by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Open</Badge>
                  <span className="text-sm text-muted-foreground">New complaints</span>
                </div>
                <span className="text-2xl font-bold">{stats.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">In Progress</Badge>
                  <span className="text-sm text-muted-foreground">Being handled</span>
                </div>
                <span className="text-2xl font-bold">{stats.inProgress}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Resolved</Badge>
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <span className="text-2xl font-bold">{stats.resolved}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Critical</Badge>
                  <span className="text-sm text-muted-foreground">Urgent</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'critical').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">High</Badge>
                  <span className="text-sm text-muted-foreground">Important</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'high').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Medium</Badge>
                  <span className="text-sm text-muted-foreground">Normal</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'medium').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Low</Badge>
                  <span className="text-sm text-muted-foreground">Minor</span>
                </div>
                <span className="text-2xl font-bold">{filteredComplaints.filter(c => c.priority === 'low').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-modern">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Complaints Trend</h3>
            <p className="text-sm text-muted-foreground">Daily complaint submissions over time</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Complaints"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-modern">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Status Distribution</h3>
            <p className="text-sm text-muted-foreground">Breakdown by complaint status</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-modern">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">By Category</h3>
            <p className="text-sm text-muted-foreground">Most common complaint types</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-modern">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">By Priority</h3>
            <p className="text-sm text-muted-foreground">Priority level distribution</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
