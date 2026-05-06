import { Box, Card, CardContent, Typography, Avatar, Stack, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { NotificationPopover } from './NotificationPopover';
import { UserMenu } from './UserMenu';

interface HeaderData {
  profilePicture: string | null;
  employeeCode: string;
  fullName: string;
  role: string;
  workLocation: string;
  reportingManager: string;
  currentDate: Date;
  unreadNotificationsCount: number;
}

export const DashboardHeader = () => {
  const [headerData, setHeaderData] = useState<HeaderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const response = await apiClient.get('/dashboard/header');
        setHeaderData(response.data);
      } catch (error) {
        console.error('Failed to fetch header data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderData();
  }, []);

  if (loading) {
    return null;
  }

  if (!headerData) {
    return null;
  }

  const now = new Date();
  const time = format(now, 'HH:mm');
  const dayOfWeek = format(now, 'EEEE');
  const date = format(now, 'dd MMM yyyy');

  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Stack direction="row" spacing={3} alignItems="flex-start">
          {/* Profile Picture */}
          <Box>
            <Avatar
              src={headerData.profilePicture || undefined}
              sx={{ width: 80, height: 80, backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {headerData.fullName.charAt(0)}
            </Avatar>
          </Box>

          {/* Employee Info */}
          <Box flex={1}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Welcome, {headerData.fullName.split(' ')[0]}!
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <Chip
                label={`ID: ${headerData.employeeCode}`}
                variant="outlined"
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />
              <Chip
                label={headerData.role}
                variant="outlined"
                size="small"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
              />
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              📍 {headerData.workLocation} | 👔 Manager: {headerData.reportingManager}
            </Typography>
          </Box>

          {/* Notifications, Date & Time */}
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {time}
            </Typography>
            <Typography variant="body2">{dayOfWeek}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {date}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: 'flex-end' }}>
              <NotificationPopover unreadCount={headerData.unreadNotificationsCount} />
              <UserMenu />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};