import { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [error, setError] = useState('');
  const { login, verifyLoginMfa, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isMfaStep) {
        if (!mfaCode || !mfaToken) {
          setError('Please enter MFA verification code');
          return;
        }
        await verifyLoginMfa(mfaToken, mfaCode);
        return;
      }

      if (!loginId || !password) {
        setError('Please enter username/email and password');
        return;
      }

      const result = await login(loginId, password);
      if (result.requiresMfa && result.mfaToken) {
        setIsMfaStep(true);
        setMfaToken(result.mfaToken);
        setMfaCode('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
            Hospital Employee Tracker
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mb: 2 }}>
            HR & Workforce Management Platform
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!isMfaStep ? (
              <>
                <TextField
                  fullWidth
                  label="Username or Email"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  margin="normal"
                  disabled={isLoading}
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  disabled={isLoading}
                  required
                />
              </>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  MFA is enabled for your account. Enter your authenticator code to continue.
                </Alert>
                <TextField
                  fullWidth
                  label="MFA Verification Code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  margin="normal"
                  disabled={isLoading}
                  required
                />
              </>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : isMfaStep ? 'Verify MFA' : 'Login'}
            </Button>

            {isMfaStep && (
              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1 }}
                disabled={isLoading}
                onClick={() => {
                  setIsMfaStep(false);
                  setMfaCode('');
                  setMfaToken('');
                  setError('');
                }}
              >
                Back to Login
              </Button>
            )}
          </Box>

          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            For security testing, use: demo@example.com / password123
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
