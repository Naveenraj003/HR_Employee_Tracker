import { Container, Box, CircularProgress, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { QuickAccessTiles } from '../components/QuickAccessTiles';
import { AttendanceSummaryWidget } from '../components/AttendanceSummaryWidget';
import { LeaveBalanceWidget } from '../components/LeaveBalanceWidget';
import { TeamLeaveAndCelebrationsWidget } from '../components/TeamLeaveAndCelebrationsWidget';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { isLoading } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading || isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header with Profile Info */}
        <DashboardHeader />

        {/* Quick Access Tiles */}
        <QuickAccessTiles />

        {/* Main Dashboard Widgets */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Attendance Summary (full width on mobile) */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <AttendanceSummaryWidget />
          </Box>

          {/* Leave Balance */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <LeaveBalanceWidget />
          </Box>

          {/* Team & Celebrations */}
          <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
            <TeamLeaveAndCelebrationsWidget />
          </Box>
        </Box>
      </Stack>
    </Container>
  );
};

