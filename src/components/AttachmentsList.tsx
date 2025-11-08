import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, File, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploaded_by_name?: string;
}

interface AttachmentsListProps {
  complaintId: string;
  canDelete?: boolean;
  onUpdate?: () => void;
}

export default function AttachmentsList({ complaintId, canDelete = false, onUpdate }: AttachmentsListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttachments();
  }, [complaintId]);

  const fetchAttachments = async () => {
    try {
      // Use GAS proxy instead of Supabase
      const response = await fetch(`http://localhost:3001/api/complaints/${complaintId}/attachments`, {
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
        const attachmentsData = data.data.map((a: any) => ({
          id: a.id || a.ID,
          file_name: a.file_name || a['File Name'],
          file_path: a.file_path || a['File Path'],
          file_size: a.file_size || a['File Size'],
          file_type: a.file_type || a['File Type'],
          created_at: a.created_at || a['Uploaded At'],
          uploaded_by_name: a.uploaded_by_name || a['Uploaded By'] || 'Unknown'
        }));

        setAttachments(attachmentsData);
      } else {
        throw new Error(data.error || 'Failed to fetch attachments');
      }
    } catch (error: any) {
      console.error('Error fetching attachments:', error);
      toast({
        title: 'Error fetching attachments',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (attachment: Attachment) => {
    try {
      // Use GAS proxy to download file
      const response = await fetch(`http://localhost:3001/api/attachments/${attachment.id}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download started',
        description: `Downloading ${attachment.file_name}`,
      });
    } catch (error: any) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteFile = async (attachment: Attachment) => {
    try {
      // Use GAS proxy to delete file
      const response = await fetch(`http://localhost:3001/api/attachments/${attachment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'File deleted successfully'
        });

        fetchAttachments();
        onUpdate?.();
      } else {
        throw new Error(data.error || 'Failed to delete file');
      }
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading attachments...</div>;
  }

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">No attachments</p>;
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          {getFileIcon(attachment.file_type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {(attachment.file_size / 1024).toFixed(1)} KB • {new Date(attachment.created_at).toLocaleDateString()}
              {attachment.uploaded_by_name && ` • by ${attachment.uploaded_by_name}`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => downloadFile(attachment)}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteFile(attachment)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}