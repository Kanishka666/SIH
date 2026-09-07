const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export interface BackendUser { id: string; name: string; email: string; role: string; }
export interface AuthResponse { access_token: string; token_type: string; user: BackendUser; }
export interface BackendScan {
  scan_id: string; status: string; progress?: number; compliance_score?: number;
  overall_status?: string; extracted_information?: Record<string, string>;
  violations?: Array<{ id: string; title: string; rule_number: string; reason: string; severity: string; recommendation: string }>;
  recommendations?: string[];
}

export class BackendApiError extends Error {
  constructor(public status: number | string, public details: unknown) {
    super(typeof (details as { detail?: unknown })?.detail === 'string' ? (details as { detail: string }).detail : 'Backend request failed');
  }
}

function authHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new BackendApiError(response.status, data);
    return data as T;
  } catch (error) {
    if (error instanceof BackendApiError) throw error;
    throw new BackendApiError('NETWORK', { detail: 'Could not reach the FastAPI backend. Check that it is running and CORS allows this frontend.' });
  }
}

export const backendApi = {
  register: (payload: { name: string; email: string; password: string; role: string }) => request<AuthResponse>('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) => request<AuthResponse>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  me: () => request<BackendUser>('/api/auth/me'),
  health: () => request<{ status: string }>('/health'),
  uploadScan: (file: File) => { const form = new FormData(); form.append('file', file); return request<{ scan_id: string; status: string; message: string }>('/api/scans', { method: 'POST', body: form }); },
  getScan: (scanId: string) => request<BackendScan>(`/api/scans/${encodeURIComponent(scanId)}`),
  getReport: (scanId: string) => request<Record<string, unknown>>(`/api/scans/${encodeURIComponent(scanId)}/report`),
  downloadReport: async (scanId: string) => { const response = await fetch(`${API_BASE_URL}/api/scans/${encodeURIComponent(scanId)}/report/pdf`, { headers: authHeaders() }); if (!response.ok) throw new BackendApiError(response.status, await response.text()); return response.blob(); },
};

export function toUserProfile(response: AuthResponse): import('../types').UserProfile {
  return { name: response.user.name, email: response.user.email, role: response.user.role, organization: undefined, clearanceLevel: response.user.role, token: response.access_token, lastLogin: new Date().toISOString() };
}
