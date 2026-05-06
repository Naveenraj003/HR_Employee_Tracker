import { Box, Card, CardContent, Typography, Tabs, Tab, List, ListItem, ListItemText, Chip, Stack, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { Cake, Handshake, Event } from '@mui/icons-material';

interface TeamLeave {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}

interface Celebration {
  userName: string;
  celebrationType: 'birthday' | 'anniversary';
  date: string;
}

interface Holiday {
  [key: string]: Array<{
    date: string;
    name: string;
    description: string;
  }>;
}

interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

export const TeamLeaveAndCelebrationsWidget = () => {
  const [teamLeaves, setTeamLeaves] = useState<TeamLeave[]>([]);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [holidays, setHolidays] = useState<Holiday | null>(null);
  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamRes, celebRes, holidayRes, leaveRes] = await Promise.all([
          apiClient.get<TeamLeave[]>('/dashboard/team-leaves'),
          apiClient.get<Celebration[]>('/dashboard/celebrations'),
          apiClient.get<Holiday>('/dashboard/holidays'),
          apiClient.get<LeaveRequest[]>('/dashboard/recent-leave-requests'),
        ]);

        setTeamLeaves(teamRes.data);
        setCelebrations(celebRes.data);
        setHolidays(holidayRes.data);
        setRecentLeaveRequests(leaveRes.data);
      } catch (error) {
        console.error('Failed to fetch team leaves and celebrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return null;
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const leaveTypeColors: Record<string, string> = {
    privilege_leave: '#e3f2fd',
    sick_leave: '#fce4ec',
    casual_leave: '#e8f5e9',
    wfh: '#fff3e0',
    on_duty: '#f3e5f5',
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Team and Celebrations
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Team On Leave" />
            <Tab label="Celebrations" />
            <Tab label="Holidays" />
            <Tab label="My Requests" />
          </Tabs>
        </Box>

        {/* Team On Leave Tab */}
        {tabValue === 0 && (
          <Box>
            {teamLeaves.length > 0 ? (
              <List>
                {teamLeaves.map((leave, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      backgroundColor: leaveTypeColors[leave.leaveType] || '#f5f5f5',
                      mb: 1,
                      borderRadius: 1,
                      py: 1.5,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {leave.employeeName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {leave.leaveType.replace(/_/g, ' ').toUpperCase()} •{' '}
                          {format(new Date(leave.startDate), 'dd MMM')} -{' '}
                          {format(new Date(leave.endDate), 'dd MMM yyyy')}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                No team members on leave
              </Typography>
            )}
          </Box>
        )}

        {/* Celebrations Tab */}
        {tabValue === 1 && (
          <Box>
            {celebrations.length > 0 ? (
              <Grid container spacing={1}>
                {celebrations.map((celebration, index) => (
                  <Grid item xs={12} key={index}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor:
                          celebration.celebrationType === 'birthday'
                            ? '#ffe0b2'
                            : '#c8e6c9',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {celebration.celebrationType === 'birthday' ? (
                        <Cake sx={{ color: '#e65100' }} />
                      ) : (
                        <Handshake sx={{ color: '#2e7d32' }} />
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {celebration.userName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {celebration.celebrationType === 'birthday'
                            ? 'Birthday'
                            : 'Work Anniversary'}{' '}
                          - {format(new Date(celebration.date), 'dd MMM')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                No celebrations today
              </Typography>
            )}
          </Box>
        )}

        {/* Holidays Tab */}
        {tabValue === 2 && (
          <Box>
            {holidays && Object.keys(holidays).length > 0 ? (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {Object.entries(holidays).map(([month, monthHolidays]) => (
                  <Box key={month}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1, mb: 0.5 }}>
                      {month}
                    </Typography>
                    {monthHolidays.map((holiday, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          py: 0.5,
                          px: 0,
                          borderBottom: '1px solid #eee',
                          '&:last-child': { borderBottom: 'none' },
                        }}
                      >
                        <Event sx={{ fontSize: 18, mr: 1, color: '#1976d2' }} />
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: '500' }}>
                              {holiday.name}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption">
                              {format(new Date(holiday.date), 'dd MMM yyyy')}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                No holidays found
              </Typography>
            )}
          </Box>
        )}

        {/* My Requests Tab */}
        {tabValue === 3 && (
          <Box>
            {recentLeaveRequests.length > 0 ? (
              <List>
                {recentLeaveRequests.map((request) => (
                  <ListItem
                    key={request.id}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      mb: 1,
                      borderRadius: 1,
                      py: 1.5,
                    }}
                  >
                    <Stack sx={{ width: '100%' }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {request.leaveType.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Chip
                          label={request.status}
                          size="small"
                          variant="outlined"
                          sx={{
                            backgroundColor:
                              request.status === 'approved'
                                ? '#e8f5e9'
                                : request.status === 'rejected'
                                  ? '#ffebee'
                                  : '#fff3e0',
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        {format(new Date(request.startDate), 'dd MMM')} -{' '}
                        {format(new Date(request.endDate), 'dd MMM yyyy')} • Requested:{' '}
                        {format(new Date(request.createdAt), 'dd MMM')}
                      </Typography>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: '#999' }}>
                No recent leave requests
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
