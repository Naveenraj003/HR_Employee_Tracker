import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveSummary {
  [key: string]: LeaveBalance;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  privilege_leave: 'Privilege Leave',
  sick_leave: 'Sick Leave',
  casual_leave: 'Casual Leave',
  compensatory_leave: 'Compensatory Leave',
  bereavement_leave: 'Bereavement Leave',
  optional_leave: 'Optional Leave',
  paternity_leave: 'Paternity Leave',
  wfh: 'Work From Home',
  on_duty: 'On Duty',
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  privilege_leave: '#2e7d32',
  sick_leave: '#0288d1',
  casual_leave: '#f9a825',
  compensatory_leave: '#6a1b9a',
  bereavement_leave: '#546e7a',
  optional_leave: '#00897b',
  paternity_leave: '#ad1457',
  wfh: '#3949ab',
  on_duty: '#ef6c00',
};

export const LeaveBalanceWidget = () => {
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveSummary = async () => {
      try {
        const response = await apiClient.get<LeaveSummary>('/dashboard/leave-summary');
        setLeaveSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch leave summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveSummary();
  }, []);

  if (loading) {
    return null;
  }

  if (!leaveSummary || Object.keys(leaveSummary).length === 0) {
    return null;
  }

  const leaveEntries = Object.entries(leaveSummary).filter(([, balance]) => balance.totalDays > 0);

  // Prepare data for pie chart (showing remaining days)
  const chartData = leaveEntries
    .map(([type, balance]) => ({
      type,
      name: LEAVE_TYPE_LABELS[type] || type,
      value: balance.remainingDays,
      color: LEAVE_TYPE_COLORS[type] || '#757575',
    }))
    .filter((item) => item.value > 0);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Leave Balance
        </Typography>

        <Grid container spacing={3}>
          {/* Pie Chart */}
          {chartData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.type} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} days`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          )}

          {/* Leave Balance Table */}
          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Leave Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Used
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Remaining
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveEntries.map(([type, balance]) => (
                    <TableRow key={type} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: LEAVE_TYPE_COLORS[type] || '#757575',
                              flexShrink: 0,
                            }}
                          />
                        {LEAVE_TYPE_LABELS[type] || type}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.875rem' }}>
                        {balance.usedDays}/{balance.totalDays}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: balance.remainingDays > 5 ? '#4caf50' : '#ff9800',
                        }}
                      >
                        {balance.remainingDays}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
