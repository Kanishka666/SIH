import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  Cpu,
  Fingerprint,
  Radio,
  Zap,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { UserProfile, AuthMode } from '../types';
import { backendApi, BackendApiError, toUserProfile } from '../services/backendApi';
import { AuthGatewayHUD } from './AuthGatewayHUD';
import { generateDeviceFingerprint, analyzePasswordStrength, evaluateAIRiskEngine, recordAuditLog } from '../utils/securityEngine';

function friendlyAuthError(error: BackendApiError, mode: AuthMode): string {
  if (error.status === 'NETWORK') return 'Cannot reach the backend. Make sure FastAPI is running and CORS allows this frontend.';
  if (error.status === 401) return mode === 'login' ? 'Wrong email or password.' : 'Authentication failed. Please try again.';
  if (error.status === 400) return mode === 'signup' ? 'This email is already registered.' : 'The request was rejected. Please check your details.';
  if (error.status === 422) return 'Please check the form fields and enter valid information.';
  return `The backend returned an error (HTTP ${error.status}). Please try again.`;
}

interface AuthModalProps {
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess: (user: UserProfile, mode: AuthMode) => void;
}

const REGULATORY_DOMAINS = [
  'Packaged Food & FMCG',
  'Pharmaceuticals & Medical',
  'Consumer Electronics',
  'Cosmetics & Personal Care',
  'General Retail Goods'
];

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [viewGatewayHUD, setViewGatewayHUD] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Brute-force & lockouts simulation state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // MFA verification state
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [mfaMethod, setMfaMethod] = useState<'otp' | 'app' | 'backup'>('otp');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('auditor.lm@labellens.gov');
  const [loginPassword, setLoginPassword] = useState('LM-Passkey2026!');

  // Signup Form State
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [org, setOrg] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(REGULATORY_DOMAINS[0]);
  const [agreed, setAgreed] = useState(true);

  // Device fingerprint & security analysis
  const [deviceFp, setDeviceFp] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const pwdAnalysis = analyzePasswordStrength(mode === 'login' ? loginPassword : signupPassword);

  useEffect(() => {
    setDeviceFp(generateDeviceFingerprint());
  }, []);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((t) => (t > 1 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  const validateEmailFormat = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const response = await backendApi.login({ email: loginEmail, password: loginPassword });
      localStorage.setItem('access_token', response.access_token);
      onSuccess(toUserProfile(response), 'login');
    } catch (err) {
      const error = err as BackendApiError;
      setError(friendlyAuthError(error, 'login'));
    } finally {
      setLoading(false);
    }
    return;

    if (lockoutTimer > 0) {
      setError(`Security Lockout active. Please wait ${lockoutTimer}s due to failed attempts.`);
      return;
    }

    if (!loginEmail || !loginPassword) {
      setError('Please provide valid credentials.');
      return;
    }

    if (!validateEmailFormat(loginEmail)) {
      setEmailValid(false);
      setError('Invalid email syntax or insecure domain.');
      return;
    }
    setEmailValid(true);

    setLoading(true);

    // AI Risk Engine evaluation & Zero Trust check
    const riskEval = evaluateAIRiskEngine(loginEmail, deviceFp);
    
    // Record audit log
    recordAuditLog({
      email: loginEmail,
      action: 'LOGIN_ATTEMPT',
      riskScore: riskEval.riskLevel,
      ipMetadata: '192.168.4.15 (Gov-Secure-Node)',
      deviceFingerprint: deviceFp,
      details: `Risk Score: ${riskEval.score} (${riskEval.reasons.join(', ')})`
    });

    setTimeout(() => {
      setLoading(false);

      // Check for brute-force simulation on incorrect password
      if (loginPassword.length < 6 || (loginEmail.includes('unauthorized') || loginPassword === 'wrong')) {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        if (nextFailed >= 3) {
          setLockoutTimer(30);
          setError('Brute-force defense triggered: 30s security lockout.');
        } else {
          setError(`Invalid credentials. Security warning: attempt ${nextFailed}/3 before lockout.`);
        }
        recordAuditLog({
          email: loginEmail,
          action: 'LOGIN_FAILED',
          riskScore: 'HIGH RISK',
          ipMetadata: '192.168.4.15',
          deviceFingerprint: deviceFp,
          details: `Failed authentication attempt #${nextFailed}`
        });
        return;
      }

      setFailedAttempts(0);

      // Trigger MFA if High Risk or Medium Risk or randomly on new device
      if (riskEval.riskLevel === 'HIGH RISK' || riskEval.riskLevel === 'MEDIUM RISK' || Math.random() > 0.6) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setRequiresMfa(true);
        recordAuditLog({
          email: loginEmail,
          action: 'MFA_TRIGGERED',
          riskScore: riskEval.riskLevel,
          ipMetadata: '192.168.4.15',
          deviceFingerprint: deviceFp,
          details: `Multi-factor authentication challenged (Simulated OTP: ${otp})`
        });
        return;
      }

      completeSuccessfulAuth(loginEmail, 'National Metrology Directorate', 'Senior Compliance Auditor', 'LEVEL-4 ENFORCEMENT');
    }, 600);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mfaCode || mfaCode.length < 6) {
      setError('Please provide a valid 6-digit MFA verification code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      completeSuccessfulAuth(loginEmail, 'National Metrology Directorate', 'Senior Compliance Auditor', 'LEVEL-4 ENFORCEMENT');
    }, 450);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const response = await backendApi.register({ name, email: signupEmail, password: signupPassword, role: 'inspector' });
      localStorage.setItem('access_token', response.access_token);
      onSuccess(toUserProfile(response), 'signup');
    } catch (err) {
      const error = err as BackendApiError;
      setError(friendlyAuthError(error, 'signup'));
    } finally {
      setLoading(false);
    }
    return;

    if (!name.trim()) {
      setError('Full legal name or auditor callsign is required.');
      return;
    }
    if (!signupEmail.trim() || !validateEmailFormat(signupEmail)) {
      setError('Please provide a valid work or corporate email.');
      return;
    }
    if (signupPassword.length < 8) {
      setError('Master passkey must be at least 8 characters for enterprise security.');
      return;
    }
    if (!agreed) {
      setError('You must accept the Legal Metrology Audit Protocol.');
      return;
    }

    setLoading(true);
    const riskEval = evaluateAIRiskEngine(signupEmail, deviceFp);

    recordAuditLog({
      email: signupEmail,
      action: 'LOGIN_ATTEMPT',
      riskScore: riskEval.riskLevel,
      ipMetadata: '192.168.4.15 (Gov-Secure-Node)',
      deviceFingerprint: deviceFp,
      details: 'Auditor account provisioning requested'
    });

    setTimeout(() => {
      setLoading(false);
      completeSuccessfulAuth(signupEmail, org.trim() || 'Autonomous Retail Compliance', `${selectedDomain} Specialist`, 'LEVEL-3 VERIFIED INSPECTOR');
    }, 600);
  };

  const completeSuccessfulAuth = (email: string, orgName: string, roleName: string, clearance: string) => {
    const tokenJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ email, org: orgName, role: roleName, fp: deviceFp, exp: Date.now() + 86400000 }))}.${Math.random().toString(36).substring(2, 10)}`;
    
    const user: UserProfile = {
      name: email.split('@')[0].toUpperCase(),
      email: email,
      organization: orgName,
      role: roleName,
      clearanceLevel: clearance,
      token: tokenJwt,
      lastLogin: new Date().toISOString()
    };

    recordAuditLog({
      email,
      action: 'LOGIN_SUCCESS',
      riskScore: 'LOW RISK',
      ipMetadata: '192.168.4.15',
      deviceFingerprint: deviceFp,
      details: 'Zero-trust cryptographic token issued successfully'
    });

    setPendingUser(user);
    setViewGatewayHUD(true);
  };

  const handleQuickDemo = () => {
    setMode('login');
    setError('Demo login is disabled. Enter credentials for a real FastAPI user.');
  };

  const handleGatewayHUDComplete = () => {
    const userToLogin = pendingUser || {
      name: 'A. CHAUHAN',
      email: loginEmail || 'auditor.lm@labellens.gov',
      organization: 'Legal Metrology Enforcement Bureau',
      role: 'Chief Verification Officer',
      clearanceLevel: 'LEVEL-4 ENFORCEMENT',
      token: `LM_TKN_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      lastLogin: new Date().toISOString()
    };
    onSuccess(userToLogin, mode);
  };

  // If user opened or triggered Gateway HUD
  if (viewGatewayHUD) {
    return (
      <AuthGatewayHUD
        user={pendingUser}
        mode={mode}
        onComplete={handleGatewayHUDComplete}
        onClose={onClose}
        onSwitchToForm={() => setViewGatewayHUD(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Outer Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl bg-[#141414] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/10 bg-[#181818]/60">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-white">
              LABELLENS ACCESS GATEWAY
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setError('The authentication HUD is visual-only. Use the real login form to authenticate with FastAPI.')}
              className="px-3 py-1.5 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Launch HUD Gateway</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Left Visual Info + Right Sliding Form Track */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Left Side: Editorial Context & Realtime Security Spec */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#0f0f0f] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div>
                <span className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest block mb-1.5">
                  Protocol LM-2009 / Zero-Trust v4.2
                </span>
                <h3 className="text-xl sm:text-2xl font-light tracking-tight text-white uppercase font-sans">
                  Autonomous Label Compliance
                </h3>
                <p className="text-xs text-white/60 font-mono mt-2 leading-relaxed">
                  Real-time OCR ingestion, mandatory declarations validator, and automated violation flagging.
                </p>
              </div>

              {/* Security Indicators (Exact requested badges) */}
              <div className="space-y-2.5 pt-2 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white/90 font-bold block text-[11px]">✓ Secure Connection Established</span>
                    <span className="text-white/50 text-[10px]">TLS 1.3 / AES-256 Bit Encryption</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <Fingerprint className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white/90 font-bold block text-[11px]">✓ AI Threat Monitoring Active</span>
                    <span className="text-white/50 text-[10px]">Continuous device & behavior fingerprinting</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo & Direct HUD Launch Buttons */}
            <div className="relative z-10 pt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2.5 px-4 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-mono flex items-center justify-center gap-2 transition-all hover:border-yellow-400 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>1-Click Test Inspector Login</span>
              </button>

              <button
                type="button"
                onClick={() => setError('The authentication HUD is visual-only. Use the real login form to authenticate with FastAPI.')}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
                <span>Enter Authentication HUD Directly</span>
              </button>
            </div>
          </div>

          {/* Right Side: Animated Slider Toggle & Forms */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Slider Mode Switcher */}
              <div className="relative flex p-1 rounded-xl bg-[#0c0c0c] border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setRequiresMfa(false);
                  }}
                  className={`relative flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors z-10 cursor-pointer ${
                    mode === 'login' ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {mode === 'login' && (
                    <motion.div
                      layoutId="auth-slider-pill"
                      className="absolute inset-0 bg-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setRequiresMfa(false);
                  }}
                  className={`relative flex-1 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors z-10 cursor-pointer ${
                    mode === 'signup' ? 'text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {mode === 'signup' && (
                    <motion.div
                      layoutId="auth-slider-pill"
                      className="absolute inset-0 bg-yellow-400 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">Create Account</span>
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Sliding Form Panels Container */}
              <div className="overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {requiresMfa ? (
                    <motion.form
                      key="mfa-form"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onSubmit={handleMfaSubmit}
                      className="space-y-4 py-2"
                    >
                      <div className="p-4 rounded-xl bg-yellow-400/5 border border-yellow-400/30 space-y-2">
                        <div className="flex items-center gap-2 text-yellow-300 text-xs font-bold font-mono">
                          <KeyRound className="w-4 h-4 text-yellow-400" />
                          <span>Multi-Factor Authentication Required</span>
                        </div>
                        <p className="text-[11px] text-white/70 font-mono">
                          Zero-trust risk engine detected an unrecognized device signature or session context. Enter your 6-digit verification code.
                        </p>
                        {generatedOtp && (
                          <div className="mt-2 p-2 rounded bg-black/60 border border-yellow-400/40 text-[11px] font-mono text-yellow-300 flex items-center justify-between">
                            <span>Simulated Secure OTP:</span>
                            <span className="font-bold tracking-widest px-2 py-0.5 bg-yellow-400/25 rounded text-white">{generatedOtp}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-widest text-white/70 mb-1.5">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-[#0a0a0a] border border-yellow-400/50 rounded-xl px-4 py-3 text-center text-lg text-yellow-300 placeholder:text-white/25 focus:outline-none transition-colors font-mono tracking-[0.3em]"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-bold uppercase tracking-widest text-xs font-mono shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              Validating MFA Token...
                            </span>
                          ) : (
                            <>
                              <span>Verify & Authorize Session</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  ) : mode === 'login' ? (
                    <motion.form
                      key="login-form"
                      initial={{ opacity: 0, x: -25 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 25 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleLoginSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-widest text-white/70">
                            Auditor ID / Work Email
                          </label>
                          <span className={`text-[10px] font-mono transition-all duration-300 flex items-center gap-1 ${
                            loginEmail.length > 0 ? 'text-yellow-400 font-bold scale-105' : 'text-emerald-400'
                          }`}>
                            <Lock className={`w-3 h-3 ${loginEmail.length > 0 ? 'animate-pulse text-yellow-400' : ''}`} />
                            {loginEmail.length > 0 ? 'Encrypted Live' : 'Encrypted Channel'}
                          </span>
                        </div>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="auditor@organization.gov"
                            className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl px-10 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                          />
                          {loginEmail.length > 0 && (
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded text-[9px] font-mono text-yellow-300">
                              <Lock className="w-2.5 h-2.5 text-yellow-400 animate-pulse" /> ENCRYPTED
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-widest text-white/70">
                            Passkey / Password
                          </label>
                          <span className={`text-[10px] font-mono transition-all duration-300 flex items-center gap-1 ${
                            loginPassword.length > 0 ? 'text-yellow-400 font-bold' : 'text-yellow-400/80'
                          }`}>
                            {loginPassword.length > 0 && (
                              <span className="flex items-center gap-1 text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 mr-1 animate-pulse">
                                <Lock className="w-2.5 h-2.5 text-yellow-400" /> SECURE KEY
                              </span>
                            )}
                            Strength: <span className="text-yellow-300 font-bold">{pwdAnalysis.label}</span>
                          </span>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl pl-10 pr-16 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                          />
                          {loginPassword.length > 0 && (
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          type="submit"
                          disabled={loading || lockoutTimer > 0}
                          className="w-full py-3 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-bold uppercase tracking-widest text-xs font-mono shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              Verifying Cryptographic Credentials...
                            </span>
                          ) : lockoutTimer > 0 ? (
                            <span>Lockout Active ({lockoutTimer}s)</span>
                          ) : (
                            <>
                              <span>Authenticate & Enter Gateway</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup-form"
                      initial={{ opacity: 0, x: 25 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -25 }}
                      transition={{ duration: 0.25 }}
                      onSubmit={handleSignupSubmit}
                      className="space-y-3.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">
                            Auditor Legal Name
                          </label>
                          <div className="relative">
                            <User className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Alex Chauhan"
                              className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl px-9 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">
                            Organization / Lab
                          </label>
                          <div className="relative">
                            <Building2 className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={org}
                              onChange={(e) => setOrg(e.target.value)}
                              placeholder="e.g. CPG Verification Dept"
                              className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl px-9 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">
                          Official Work Email
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="inspector@company.com"
                            className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl px-9 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70 mb-1">
                          Regulatory Focus
                        </label>
                        <select
                          value={selectedDomain}
                          onChange={(e) => setSelectedDomain(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-colors font-mono cursor-pointer"
                        >
                          {REGULATORY_DOMAINS.map((domain) => (
                            <option key={domain} value={domain} className="bg-[#141414] text-white">
                              {domain}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/70">
                            Create Master Passkey
                          </label>
                          <span className="text-[10px] font-mono text-yellow-400">
                            {pwdAnalysis.label} ({pwdAnalysis.score}%)
                          </span>
                        </div>
                        <div className="relative">
                          <Lock className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Minimum 8 characters with symbol"
                            className="w-full bg-[#0a0a0a] border border-white/15 focus:border-yellow-400 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="agree"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="w-3.5 h-3.5 accent-yellow-400 rounded cursor-pointer"
                        />
                        <label htmlFor="agree" className="text-[10px] text-white/70 font-mono cursor-pointer">
                          Accept Legal Metrology (LM-2009) compliance charter
                        </label>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-2.5 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98] text-black font-bold uppercase tracking-widest text-xs font-mono shadow-[0_0_20px_rgba(250,204,21,0.25)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              Provisioning ID...
                            </span>
                          ) : (
                            <>
                              <span>Register & Run Gateway HUD</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Switcher Caption */}
            <div className="pt-4 border-t border-white/5 text-center">
              <span className="text-[10px] font-mono text-white/40">
                {mode === 'login' ? "Don't have an auditor clearance ID yet? " : 'Already registered with Legal Metrology? '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                    setRequiresMfa(false);
                  }}
                  className="text-yellow-400 hover:underline font-bold cursor-pointer"
                >
                  {mode === 'login' ? 'Create Account' : 'Sign In'}
                </button>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
