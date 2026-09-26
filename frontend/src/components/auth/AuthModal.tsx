import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
} from '@mui/material';
import { X, Lock, Phone, UserCheck, Sparkles, KeyRound } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getGqlClient } from '../../services/graphql';
import {
  SEND_OTP_MUTATION,
  RESEND_OTP_MUTATION,
  VERIFY_OTP_MUTATION,
  REGISTER_MUTATION,
  LOGIN_MUTATION,
  RESET_PIN_MUTATION,
  GET_CART_QUERY,
} from '../../graphql/queries';
import { useQueryClient } from '@tanstack/react-query';

export const AuthModal: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAuthModalOpen, authModalMode, toggleAuthModal, sessionId } = useCartStore();
  const { setAuth } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register' | 'forgotPin'>(authModalMode || 'login');
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin'>('mobile');

  // Form Fields
  const [mobile, setMobile] = useState('');
  const [accountName, setAccountName] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [pin, setPin] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setMobile('');
    setAccountName('');
    setOtp('');
    setVerificationToken('');
    setPin('');
    setResendSeconds(0);
    setError(null);
    setSuccessMsg(null);
    setStep('mobile');
    setLoading(false);
  };

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const handleClose = () => {
    resetForm();
    toggleAuthModal(false);
  };

  const handleModeChange = (_: any, newMode: 'login' | 'register' | 'forgotPin') => {
    setMode(newMode);
    resetForm();
  };

  // 1. LOGIN (Mobile + 6-digit PIN)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await getGqlClient().request(LOGIN_MUTATION, {
        input: { mobile, pin },
      });

      if (res.login?.accessToken) {
        setAuth(res.login.accessToken, res.login.user);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        handleClose();
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Invalid mobile number or 6-digit PIN');
    } finally {
      setLoading(false);
    }
  };

  // 2. SEND OTP (Registration / Forgot PIN)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await getGqlClient().request(SEND_OTP_MUTATION, {
        input: { mobile },
      });

      if (res.sendOtp?.success) {
        setSuccessMsg(res.sendOtp.message);
        setVerificationToken('');
        setResendSeconds(30);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res: any = await getGqlClient().request(RESEND_OTP_MUTATION, { input: { mobile } });
      if (res.resendOtp?.success) {
        setSuccessMsg(res.resendOtp.message);
        setResendSeconds(30);
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // 3. VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await getGqlClient().request(VERIFY_OTP_MUTATION, {
        input: { mobile, otp },
      });

      if (res.verifyOtp?.success) {
        setSuccessMsg('OTP verified successfully!');
        setVerificationToken(res.verifyOtp.verificationToken || '');
        setStep('pin');
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // 4. REGISTER COMPLETE (Name + Mobile + OTP + 6-digit PIN)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await getGqlClient().request(REGISTER_MUTATION, {
        input: { mobile, otp, accountName, pin, verificationToken },
      });

      if (res.register?.accessToken) {
        setAuth(res.register.accessToken, res.register.user);
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        handleClose();
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 5. RESET PIN (Mobile + OTP + New 6-digit PIN)
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await getGqlClient().request(RESET_PIN_MUTATION, {
        input: { mobile, otp, newPin: pin, verificationToken },
      });

      if (res.resetPin?.success) {
        setSuccessMsg('PIN updated! Please log in with your new PIN.');
        setMode('login');
        setStep('mobile');
      }
    } catch (err: any) {
      setError(err?.response?.errors?.[0]?.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAuthModalOpen} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={22} color="#6C5CE7" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgotPin' && 'Forgot PIN'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <X size={20} />
        </IconButton>
      </Box>

      {mode !== 'forgotPin' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs value={mode} onChange={handleModeChange} variant="fullWidth">
            <Tab label="Login (Mobile + PIN)" value="login" sx={{ fontWeight: 700 }} />
            <Tab label="Register (Mobile + OTP)" value="register" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>
      )}

      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>{successMsg}</Alert>}

        {/* ==================================================================== */}
        {/* LOGIN FORM */}
        {/* ==================================================================== */}
        {mode === 'login' && (
          <Box component="form" onSubmit={handleLoginSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Mobile Number"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                fullWidth
                InputProps={{
                  startAdornment: <Phone size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                }}
              />

              <TextField
                label="6-Digit PIN"
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                fullWidth
                InputProps={{
                  startAdornment: <Lock size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                }}
              />

              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5, background: 'linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)' }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Button variant="text" size="small" onClick={() => setMode('forgotPin')} sx={{ color: '#6C5CE7', fontWeight: 600 }}>
                  Forgot 6-Digit PIN?
                </Button>
              </Box>

              <Alert severity="warning" sx={{ fontSize: '0.78rem', borderRadius: 2 }}>
                <strong>Dev Login Quick Tip:</strong><br />
                Customer: 9900000010 | PIN: 444444<br />
                Admin: 9900000004 | PIN: 222222
              </Alert>
            </Stack>
          </Box>
        )}

        {/* ==================================================================== */}
        {/* REGISTER FORM */}
        {/* ==================================================================== */}
        {mode === 'register' && (
          <Box>
            {step === 'mobile' && (
              <Box component="form" onSubmit={handleSendOtp}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Full Name"
                    placeholder="Enter your name"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <UserCheck size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                    }}
                  />
                  <TextField
                    label="Mobile Number"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Phone size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                    }}
                  />

                  <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5 }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
                  </Button>
                </Stack>
              </Box>
            )}

            {step === 'otp' && (
              <Box component="form" onSubmit={handleVerifyOtp}>
                <Stack spacing={2.5}>
                  <Typography variant="body2">
                    Enter the 6-digit OTP sent to <strong>+91 {mobile}</strong>:
                  </Typography>
                  <TextField
                    label="Enter OTP"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <KeyRound size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                    }}
                  />
                  <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    Development Mode OTP: <strong>123456</strong>
                  </Alert>

                  <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5 }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                  </Button>
                  <Button type="button" variant="text" disabled={loading || resendSeconds > 0} onClick={handleResendOtp}>
                    {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                  </Button>
                </Stack>
              </Box>
            )}

            {step === 'pin' && (
              <Box component="form" onSubmit={handleRegisterSubmit}>
                <Stack spacing={2.5}>
                  <Typography variant="body2">
                    Set a secure <strong>6-digit PIN</strong> for future logins:
                  </Typography>
                  <TextField
                    label="Create 6-Digit PIN"
                    type="password"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    fullWidth
                    InputProps={{
                      startAdornment: <Lock size={18} style={{ marginRight: 8, color: '#636E72' }} />,
                    }}
                  />

                  <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.5, background: 'linear-gradient(135deg, #00B894 0%, #009473 100%)' }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Registration'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* ==================================================================== */}
        {/* FORGOT PIN FORM */}
        {/* ==================================================================== */}
        {mode === 'forgotPin' && (
          <Box>
            {step === 'mobile' && (
              <Box component="form" onSubmit={handleSendOtp}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Registered Mobile Number"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    fullWidth
                  />
                  <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset OTP'}
                  </Button>
                  <Button variant="text" size="small" onClick={() => setMode('login')}>
                    Back to Login
                  </Button>
                </Stack>
              </Box>
            )}

            {step === 'otp' && (
              <Box component="form" onSubmit={handleVerifyOtp}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Enter OTP"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    fullWidth
                  />
                  <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    Development Mode OTP: <strong>123456</strong>
                  </Alert>
                  <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                  </Button>
                  <Button type="button" variant="text" disabled={loading || resendSeconds > 0} onClick={handleResendOtp}>
                    {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
                  </Button>
                </Stack>
              </Box>
            )}

            {step === 'pin' && (
              <Box component="form" onSubmit={handleResetPinSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="New 6-Digit PIN"
                    type="password"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    fullWidth
                  />
                  <Button type="submit" variant="contained" size="large" disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Update PIN'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
