import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PASSWORD_SECTION = 'password';
const MFA_SECTION = 'mfa';

type Section = 'password' | 'mfa';
type MfaMethod = 'totp' | 'sms' | 'email';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { changePassword, setupMfa, verifyMfaSetup, user, isLoading } = useAuth();

  const selectedSection = (searchParams.get('section') || PASSWORD_SECTION) as Section;
  const section: Section = useMemo(() => {
    return selectedSection === MFA_SECTION ? MFA_SECTION : PASSWORD_SECTION;
  }, [selectedSection]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [mfaMethod, setMfaMethod] = useState<MfaMethod>('totp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaSetupResponse, setMfaSetupResponse] = useState<{ method?: string; qrCode?: string } | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setSuccessMessage('');
    setErrorMessage('');
  }, [section]);

  const handleSectionChange = (_: React.SyntheticEvent, nextSection: Section) => {
    setSearchParams({ section: nextSection });
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password changed successfully.');
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Unable to change password.');
    }
  };

  const handleSetupMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (mfaMethod === 'sms' && !phoneNumber.trim()) {
      setErrorMessage('Phone number is required for SMS MFA setup.');
      return;
    }

    try {
      const response = await setupMfa(mfaMethod, phoneNumber.trim() || undefined);
      setMfaSetupResponse(response);
      setSuccessMessage('MFA setup initiated. Enter the verification code to enable MFA.');
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Unable to setup MFA.');
    }
  };

  const handleVerifyMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!verificationCode.trim()) {
      setErrorMessage('Verification code is required.');
      return;
    }

    try {
      await verifyMfaSetup(verificationCode.trim());
      setVerificationCode('');
      setMfaSetupResponse(null);
      setSuccessMessage('MFA enabled successfully.');
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'MFA verification failed.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Profile Settings
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Stack>

        <Card>
          <CardContent>
            <Tabs value={section} onChange={handleSectionChange} aria-label="profile settings tabs">
              <Tab value={PASSWORD_SECTION} label="Change Password" />
              <Tab value={MFA_SECTION} label="MFA Settings" />
            </Tabs>
          </CardContent>
        </Card>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {section === PASSWORD_SECTION ? (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change Password
              </Typography>
              <Box component="form" onSubmit={handleChangePassword}>
                <Stack spacing={2}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    fullWidth
                  />
                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    fullWidth
                    helperText="Minimum 8 characters"
                  />
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    fullWidth
                  />
                  <Button type="submit" variant="contained" disabled={isLoading}>
                    Update Password
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Multi-Factor Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Current status: {user?.mfaRequired ? 'Enabled' : 'Not enabled'}
                </Typography>
                <Box component="form" onSubmit={handleSetupMfa}>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel id="mfa-method-label">MFA Method</InputLabel>
                      <Select
                        labelId="mfa-method-label"
                        label="MFA Method"
                        value={mfaMethod}
                        onChange={(event) => setMfaMethod(event.target.value as MfaMethod)}
                      >
                        <MenuItem value="totp">Authenticator App (TOTP)</MenuItem>
                        <MenuItem value="sms">SMS</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                      </Select>
                    </FormControl>

                    {mfaMethod === 'sms' && (
                      <TextField
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        required
                        fullWidth
                        placeholder="+91XXXXXXXXXX"
                      />
                    )}

                    <Button type="submit" variant="contained" disabled={isLoading}>
                      Setup MFA
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {mfaSetupResponse && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Verify MFA Setup
                  </Typography>
                  {mfaSetupResponse.qrCode && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Scan QR in your authenticator app, then enter the generated code.
                    </Alert>
                  )}
                  <Box component="form" onSubmit={handleVerifyMfa}>
                    <Stack spacing={2}>
                      <TextField
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(event) => setVerificationCode(event.target.value)}
                        required
                        fullWidth
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      />
                      <Button type="submit" variant="contained" disabled={isLoading}>
                        Verify and Enable MFA
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
