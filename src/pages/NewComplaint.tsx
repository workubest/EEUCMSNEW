import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import type { ComplaintCategory, ComplaintPriority } from '@/types';

const REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'SNNPR',
  'Tigray',
];

const SERVICE_CENTERS = [
  'Addis Ababa Central',
  'Addis Ababa East',
  'Addis Ababa West',
  'Addis Ababa North',
  'Addis Ababa South',
  'Bahir Dar',
  'Dire Dawa',
  'Mekelle',
  'Hawassa',
  'Adama',
  'Jimma',
  'Gondar',
  'Dessie',
  'Harar',
  'Sodo',
  'Arba Minch',
  'Assosa',
  'Gambella',
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    contractAccountNumber: '',
    businessPartnerNumber: '',
    title: '',
    description: '',
    category: 'power_outage' as ComplaintCategory,
    priority: 'medium' as ComplaintPriority,
    region: '',
    serviceCenter: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a complaint',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Generate ticket number
      const { count } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true });

      const ticketNumber = `EEU-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('complaints')
        .insert([
          {
            ticket_number: ticketNumber,
            customer_id: user.id,
            customer_name: formData.customerName,
            customer_phone: formData.customerPhone,
            customer_email: formData.customerEmail || null,
            customer_address: formData.customerAddress || null,
            contract_account_number: formData.contractAccountNumber || null,
            business_partner_number: formData.businessPartnerNumber || null,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
            status: 'open',
            region: formData.region,
            service_center: formData.serviceCenter,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Complaint ${ticketNumber} created successfully`,
      });

      navigate(`/complaints/${data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/complaints')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Complaint</h1>
          <p className="text-muted-foreground">Create a new customer complaint</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => handleChange('customerPhone', e.target.value)}
                    placeholder="+251911234567"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleChange('customerEmail', e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address (Optional)</Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={(e) => handleChange('customerAddress', e.target.value)}
                  placeholder="Customer address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractAccountNumber">Contract Account Number (Optional)</Label>
                  <Input
                    id="contractAccountNumber"
                    value={formData.contractAccountNumber}
                    onChange={(e) => handleChange('contractAccountNumber', e.target.value)}
                    placeholder="CA-XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPartnerNumber">Business Partner Number (Optional)</Label>
                  <Input
                    id="businessPartnerNumber"
                    value={formData.businessPartnerNumber}
                    onChange={(e) => handleChange('businessPartnerNumber', e.target.value)}
                    placeholder="BP-XXXXXX"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Brief description of the complaint"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description of the issue"
                  rows={5}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange('category', value)}
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="power_outage">Power Outage</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="connection">Connection</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleChange('priority', value)}
                    required
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">
                    Region <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => handleChange('region', value)}
                    required
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCenter">
                  Service Center <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.serviceCenter}
                  onValueChange={(value) => handleChange('serviceCenter', value)}
                  required
                >
                  <SelectTrigger id="serviceCenter">
                    <SelectValue placeholder="Select service center" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CENTERS.map((center) => (
                      <SelectItem key={center} value={center}>
                        {center}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/complaints')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Complaint'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}