import { Box, Card, CardContent, Stack, Typography, Button, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Login, Logout, AccessTime } from '@mui/icons-material';

interface AttendanceSummary {
  todayCheckIn: string | null;
  todayCheckOut: string | null;
  todayWorkingHours: number | null;
  monthWorkingDays: number;
  monthTotalHours: string;
  monthAverageHours: string;
  last30Days: Array<{
    date: string;
    status: string;
    workingHours: number | null;
  }>;
}

export const AttendanceSummaryWidget = () => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceSummary = async () => {
    const response = await apiClient.get<AttendanceSummary>('/dashboard/attendance-summary');
    setSummary(response.data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAttendanceSummary();
      } catch (error) {
        console.error('Failed to fetch attendance summary:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleCheckIn = async () => {
    try {
      await apiClient.checkIn();
      await fetchAttendanceSummary();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiClient.checkOut();
      await fetchAttendanceSummary();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (!summary) {
    return null;
  }

  const checkInTime = summary.todayCheckIn
    ? format(new Date(summary.todayCheckIn), 'HH:mm')
    : 'Not checked in';
  const checkOutTime = summary.todayCheckOut
    ? format(new Date(summary.todayCheckOut), 'HH:mm')
    : 'Not checked out';
  const todayWorkingHours = Number(summary.todayWorkingHours || 0);

  const chartData = summary.last30Days
    .map((record) => ({
      date: format(new Date(record.date), 'dd MMM'),
      hours: record.workingHours || 0,
    }))
    .slice(0, 30);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Attendance Summary</Typography>

        {/* Today's Status */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: '#e3f2fd',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Login sx={{ color: '#1976d2', mb: 1 }} />
              <Typography variant="caption">Check In</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {checkInTime}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: '#f3e5f5',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Logout sx={{ color: '#7b1fa2', mb: 1 }} />
              <Typography variant="caption">Check Out</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {checkOutTime}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: '#f0f4c3',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <AccessTime sx={{ color: '#f57f17', mb: 1 }} />
              <Typography variant="caption">Today's Hours</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {todayWorkingHours.toFixed(1)} hrs
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: '#e8f5e9',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption">Month Avg</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {summary.monthAverageHours} hrs
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Month Statistics */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#fafafa', borderRadius: 1 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Working Days
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {summary.monthWorkingDays}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Total Hours
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {summary.monthTotalHours}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* 30-Day Chart */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
            Last 30 Days Working Hours
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#1976d2" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Check-In/Out Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={<Login />} sx={{ flex: 1 }} onClick={handleCheckIn}>
            Check In
          </Button>
          <Button variant="outlined" startIcon={<Logout />} sx={{ flex: 1 }} onClick={handleCheckOut}>
            Check Out
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
