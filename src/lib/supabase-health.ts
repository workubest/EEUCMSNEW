// GAS backend health check
const GAS_PROXY_URL = import.meta.env.VITE_GAS_PROXY_URL || 'http://localhost:3001/api/health';

export interface HealthCheckResult {
  isHealthy: boolean;
  message: string;
  details?: any;
}

/**
 * Checks if the GAS backend is accessible
 */
export async function checkBackendHealth(): Promise<HealthCheckResult> {
  try {
    const response = await fetch(GAS_PROXY_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      return {
        isHealthy: true,
        message: 'GAS backend operational'
      };
    } else {
      return {
        isHealthy: false,
        message: 'GAS backend returned error',
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error: any) {
    return {
      isHealthy: false,
      message: 'Cannot connect to GAS backend',
      details: error
    };
  }
}

/**
 * Run diagnostics on the GAS configuration
 */
export async function runDiagnostics() {
  const results = {
    gasProxyUrl: GAS_PROXY_URL,
    networkConnectivity: false,
    gasBackendReachable: false,
    errors: [] as string[]
  };

  // Test network connectivity to GAS proxy
  try {
    const response = await fetch(GAS_PROXY_URL, { method: 'HEAD' });
    results.networkConnectivity = true;
    results.gasBackendReachable = response.ok;
    if (!response.ok) {
      results.errors.push(`GAS proxy returned ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    results.errors.push(`Cannot reach GAS proxy: ${error.message}`);
  }

  return results;
}

