import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { runDiagnostics } from '@/lib/supabase-health';

export default function BackendDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics = await runDiagnostics();
    setResults(diagnostics);
    setIsRunning(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backend Diagnostics</CardTitle>
        <CardDescription>
            Run comprehensive tests to identify GAS proxy and backend configuration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRunDiagnostics} disabled={isRunning} className="w-full">
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Diagnostics
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <DiagnosticItem
                  label="GAS Proxy URL"
                  status={!!results.gasProxyUrl}
                  value={results.gasProxyUrl}
                />
                <DiagnosticItem
                  label="Network Connectivity"
                  status={results.networkConnectivity}
                />
                <DiagnosticItem
                  label="GAS Backend Reachable"
                  status={results.gasBackendReachable}
                />
              </div>

              {results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Issues Found:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {results.errors.map((error: string, i: number) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Configuration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-medium mb-1">GAS Proxy URL:</div>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      {results.gasProxyUrl}
                    </code>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1">GAS Backend URL:</div>
                    <code className="text-xs bg-background p-2 rounded block break-all">
                      https://script.google.com/macros/s/AKfycbyTCR18_Ey6t1Ixi3Mzy1RMQJ8bnIxMcFmOoHnKtjqVIyrjhBLeDKosnY-N_SQ8hlb7/exec
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription className="text-xs space-y-2">
                  <div className="font-semibold">Troubleshooting Tips:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verify the GAS proxy server is running on port 3001</li>
                    <li>Check that the GAS script URL is correct and deployed</li>
                    <li>Ensure your Google Sheet has the required sheets (Profiles, Complaints, etc.)</li>
                    <li>Confirm your network allows connections to script.google.com</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosticItem({ 
  label, 
  status, 
  value 
}: { 
  label: string; 
  status: boolean; 
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        {status ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {value && (
        <Badge variant="secondary" className="text-xs">
          {value}
        </Badge>
      )}
    </div>
  );
}
