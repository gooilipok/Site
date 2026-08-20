/**
 * BauSquad — Universal Resilient API Client
 * Автоматически работает через /api/... и при любых сбоях веб-сервера (502, 503, 504, 404)
 * мгновенно и прозрачно переключается на прямой вызов /api.php?path=...
 */

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Extract path without /api prefix
  let apiSubPath = cleanEndpoint;
  if (cleanEndpoint.startsWith('/api/')) {
    apiSubPath = cleanEndpoint.slice(5); // e.g. "auth/login" or "orders/12/status"
  } else if (cleanEndpoint.startsWith('/api')) {
    apiSubPath = cleanEndpoint.slice(4);
  }
  apiSubPath = apiSubPath.replace(/^\/+/, '');

  const standardUrl = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api/${apiSubPath}`;
  const directScriptUrl = `/api.php?path=${encodeURIComponent(apiSubPath)}`;

  try {
    const response = await fetch(standardUrl, options);
    
    // If Apache/Nginx returned a Gateway Error (502, 503, 504) or 404 (misconfigured rewrite)
    if (response.status === 502 || response.status === 503 || response.status === 504 || response.status === 404) {
      console.warn(`[API Proxy Notice]: ${standardUrl} returned status ${response.status}. Retrying directly via ${directScriptUrl}...`);
      return await fetch(directScriptUrl, options);
    }
    
    return response;
  } catch (networkError) {
    console.warn(`[API Network Notice]: Failed to reach ${standardUrl}. Retrying directly via ${directScriptUrl}...`, networkError);
    try {
      return await fetch(directScriptUrl, options);
    } catch (directError) {
      throw directError;
    }
  }
}
