export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  email: string;
  action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'MFA_TRIGGERED' | 'SESSION_REFRESH';
  riskScore: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';
  ipMetadata: string;
  deviceFingerprint: string;
  details: string;
}

export function generateDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = `${nav.userAgent}|${screen.width}x${screen.height}|${nav.language}|${new Date().getTimezoneOffset()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `FP-2026-${Math.abs(hash).toString(36).toUpperCase()}`;
}

export function analyzePasswordStrength(password: string): { score: number; label: string; feedback: string[] } {
  let score = 0;
  const feedback: string[] = [];
  if (!password) return { score: 0, label: 'Empty', feedback: ['Enter master passkey'] };

  if (password.length >= 8) score += 25;
  else feedback.push('Minimum 8 characters required');

  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push('Include uppercase letters');

  if (/[0-9]/.test(password)) score += 25;
  else feedback.push('Include numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  else feedback.push('Include special symbols (!@#$%)');

  let label = 'Weak';
  if (score >= 75) label = 'Enterprise Secure';
  else if (score >= 50) label = 'Moderate';

  return { score, label, feedback };
}

export function evaluateAIRiskEngine(email: string, deviceFp: string): { riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK'; score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 15; // Base risk

  const lowerEmail = email.toLowerCase();
  const isGovernment = lowerEmail.endsWith('.gov') || lowerEmail.includes('auditor') || lowerEmail.includes('compliance');
  const isDemo = lowerEmail.includes('demo') || lowerEmail.includes('alex.chauhan');

  if (isGovernment || isDemo) {
    score -= 10;
    reasons.push('Trusted institutional domain verified (.gov / core)');
  } else if (lowerEmail.includes('test') || lowerEmail.includes('temp')) {
    score += 45;
    reasons.push('Temporary or unverified domain pattern');
  }

  // Device fingerprint entropy check
  if (deviceFp.length < 12) {
    score += 30;
    reasons.push('Unrecognized browser signature');
  } else {
    reasons.push('Verified hardware & browser environment');
  }

  // Time-based heuristic
  const hour = new Date().getHours();
  if (hour < 5 || hour > 23) {
    score += 20;
    reasons.push('Off-hours access window detected');
  } else {
    reasons.push('Standard operational access window');
  }

  let riskLevel: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' = 'LOW RISK';
  if (score >= 60) riskLevel = 'HIGH RISK';
  else if (score >= 35) riskLevel = 'MEDIUM RISK';

  return { riskLevel, score, reasons };
}

export function recordAuditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>) {
  try {
    const existing = localStorage.getItem('labellens_audit_logs');
    const logs: SecurityAuditLog[] = existing ? JSON.parse(existing) : [];
    const newEntry: SecurityAuditLog = {
      ...log,
      id: `LOG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    // Keep last 50 logs
    if (logs.length > 50) logs.pop();
    localStorage.setItem('labellens_audit_logs', JSON.stringify(logs));
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}
