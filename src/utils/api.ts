/**
 * BauSquad — Universal Resilient API Client
 * Автоматически работает через /api/... и при любых сбоях веб-сервера (502, 503, 504, 404)
 * мгновенно и прозрачно переключается на прямой вызов /api.php?path=...
 */

export interface SystemHealthReport {
  status: 'ok' | 'warning' | 'error';
  php_version?: string;
  database?: {
    status: string;
    host?: string;
    database?: string;
    tables_count?: number;
    error?: string;
    ping_ms?: number;
  };
  telegram?: {
    status: string;
    proxy?: string;
    bot_token_set?: boolean;
  };
  filesystem?: {
    uploads_writable?: boolean;
    status?: string;
  };
  scripts?: Record<string, { exists: boolean; status: string }>;
  timestamp: string;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Split URL into pathname and query string
  const [urlPath, queryString] = cleanEndpoint.split('?');
  
  let apiSubPath = urlPath;
  if (apiSubPath.startsWith('/api/')) {
    apiSubPath = apiSubPath.slice(5);
  } else if (apiSubPath.startsWith('/api')) {
    apiSubPath = apiSubPath.slice(4);
  }
  apiSubPath = apiSubPath.replace(/^\/+/, '');

  // Prepare standard URL
  const queryPart = queryString ? `?${queryString}` : '';
  const standardUrl = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api/${apiSubPath}${queryPart}`;

  // Prepare direct PHP script URL with path parameter
  const searchParams = new URLSearchParams(queryString || '');
  searchParams.set('path', apiSubPath);
  const directScriptUrl = `/api.php?${searchParams.toString()}`;

  // Prepare headers with auto Bearer token if not provided
  const headers = new Headers(options.headers || {});
  if (!headers.has('Authorization')) {
    try {
      const rawTokens = localStorage.getItem('bau_tokens');
      if (rawTokens) {
        const parsed = JSON.parse(rawTokens);
        if (parsed?.access_token) {
          headers.set('Authorization', `Bearer ${parsed.access_token}`);
        }
      }
    } catch {}
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers
  };

  try {
    const response = await fetch(standardUrl, enhancedOptions);
    
    // If Apache/Nginx returned a Gateway Error (502, 503, 504) or 404 (misconfigured rewrite)
    if (response.status === 502 || response.status === 503 || response.status === 504 || response.status === 404) {
      console.warn(`[API Proxy Notice]: ${standardUrl} returned status ${response.status}. Retrying directly via ${directScriptUrl}...`);
      return await fetch(directScriptUrl, enhancedOptions);
    }
    
    return response;
  } catch (networkError) {
    console.warn(`[API Network Notice]: Failed to reach ${standardUrl}. Retrying directly via ${directScriptUrl}...`, networkError);
    try {
      return await fetch(directScriptUrl, enhancedOptions);
    } catch (directError) {
      throw directError;
    }
  }
}

export async function fetchSystemDiagnostics(): Promise<SystemHealthReport | null> {
  try {
    // Try /api/diag first
    let res = await apiFetch('/api/diag');
    if (!res.ok) {
      // Try /diag.php?format=json directly
      res = await fetch('/diag.php?format=json');
    }
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[Diagnostics Fetch Error]:', e);
  }
  return null;
}

