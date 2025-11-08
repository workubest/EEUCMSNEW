import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkActionsProps {
  selectedIds: string[];
  onComplete: () => void;
}

export default function BulkActions({ selectedIds, onComplete }: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<'status' | 'priority' | 'delete'>('status');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one complaint',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('complaints')
          .delete()
          .in('id', selectedIds);

        if (error) throw error;

        toast({
          title: 'Success',
          description: `${selectedIds.length} complaints deleted`,
        });
      } else {
        const updateData = action === 'status' 
          ? { status: value } 
          : { priority: value };

        const { error } = await supabase
          .from('complaints')
          .update(updateData)
          .in('id', selectedIds);

        if (error) throw error;

        toast({
          title: 'Success',
          description: `${selectedIds.length} complaints updated`,
        });
      }

      setIsOpen(false);
      onComplete();
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

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        disabled={selectedIds.length === 0}
      >
        Bulk Actions ({selectedIds.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Actions</DialogTitle>
            <DialogDescription>
              Apply actions to {selectedIds.length} selected complaint{selectedIds.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={action} onValueChange={(v: any) => setAction(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Update Status</SelectItem>
                <SelectItem value="priority">Update Priority</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>

            {action === 'status' && (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}

            {action === 'priority' && (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            )}

            {action === 'delete' && (
              <p className="text-sm text-destructive">
                Warning: This action cannot be undone.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              disabled={loading || (action !== 'delete' && !value)}
            >
              {loading ? 'Processing...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
