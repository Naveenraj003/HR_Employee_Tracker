import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import {
  CalendarToday,
  AccessTime,
  Receipt,
} from '@mui/icons-material';

interface Tile {
  id: string;
  label: string;
  icon: string;
}

const ALLOWED_TILE_IDS = ['apply_leave', 'view_attendance', 'payment_history'] as const;

const getTileIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    calendar: <CalendarToday sx={{ fontSize: 40 }} />,
    clock: <AccessTime sx={{ fontSize: 40 }} />,
    receipt: <Receipt sx={{ fontSize: 40 }} />,
  };
  return iconMap[iconName] || <CalendarToday sx={{ fontSize: 40 }} />;
};

const getTileRoute = (id: string) => {
  const routeMap: Record<string, string> = {
    apply_leave: '/leave',
    view_attendance: '/attendance',
    payment_history: '/payroll',
  };
  return routeMap[id] || '/';
};

export const QuickAccessTiles = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        const response = await apiClient.get('/dashboard/quick-access-tiles');
        const allowedTiles = (response.data as Tile[]).filter((tile) =>
          ALLOWED_TILE_IDS.includes(tile.id as (typeof ALLOWED_TILE_IDS)[number]),
        );
        setTiles(allowedTiles);
      } catch (error) {
        console.error('Failed to fetch quick-access tiles:', error);
        // Set default tiles on error
        setTiles([
          { id: 'apply_leave', label: 'Apply Leave', icon: 'calendar' },
          { id: 'view_attendance', label: 'View Attendance', icon: 'clock' },
          { id: 'payment_history', label: 'Payment History', icon: 'receipt' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTiles();
  }, []);

  const handleTileClick = (tileId: string) => {
    navigate(getTileRoute(tileId));
  };

  if (loading) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Quick Access
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
        {tiles.map((tile) => (
          <Card
            key={tile.id}
            sx={{
              flex: '1 1 calc(33.33% - 16px)',
              minWidth: '150px',
              backgroundColor: '#f5f7fa',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3,
                backgroundColor: '#667eea',
              },
              '&:hover .MuiTypography-root, &:hover .MuiSvgIcon-root': {
                color: 'white',
              },
            }}
          >
            <CardActionArea
              onClick={() => handleTileClick(tile.id)}
              sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}
            >
              <Box sx={{ color: '#667eea', mb: 1 }}>
                {getTileIcon(tile.icon)}
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'center', color: '#333' }}>
                {tile.label}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};
