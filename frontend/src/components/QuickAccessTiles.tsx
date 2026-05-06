import { Box, Card, CardActionArea, Stack, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, Alert } from '@mui/material';
import { Settings } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import {
  CalendarToday,
  AccessTime,
  Receipt,
  FilePresent,
} from '@mui/icons-material';

interface Tile {
  id: string;
  label: string;
  icon: string;
}

const ALLOWED_TILE_IDS = ['apply_leave', 'view_attendance', 'payment_history', 'my_documents'] as const;

const getTileIcon = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    calendar: <CalendarToday sx={{ fontSize: 40 }} />,
    clock: <AccessTime sx={{ fontSize: 40 }} />,
    receipt: <Receipt sx={{ fontSize: 40 }} />,
    document: <FilePresent sx={{ fontSize: 40 }} />,
  };
  return iconMap[iconName] || <CalendarToday sx={{ fontSize: 40 }} />;
};

const getTileRoute = (id: string) => {
  const routeMap: Record<string, string> = {
    apply_leave: '/leave',
    view_attendance: '/attendance',
    payment_history: '/payroll',
    my_documents: '/documents',
  };
  return routeMap[id] || '/';
};

const ALL_AVAILABLE_TILES: Tile[] = [
  { id: 'apply_leave', label: 'Apply Leave', icon: 'calendar' },
  { id: 'view_attendance', label: 'View Attendance', icon: 'clock' },
  { id: 'payment_history', label: 'Payment History', icon: 'receipt' },
  { id: 'my_documents', label: 'My Documents', icon: 'document' },
];

export const QuickAccessTiles = () => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConfig, setOpenConfig] = useState(false);
  const [selectedTileIds, setSelectedTileIds] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTiles = async () => {
      try {
        const response = await apiClient.get('/dashboard/quick-access-tiles');
        const allowedTiles = (response.data as Tile[]).filter((tile) =>
          ALLOWED_TILE_IDS.includes(tile.id as (typeof ALLOWED_TILE_IDS)[number]),
        );
        const defaultDisplay = allowedTiles.slice(0, 3);
        setTiles(defaultDisplay);
        setSelectedTileIds(defaultDisplay.map(t => t.id));
      } catch (error) {
        console.error('Failed to fetch quick-access tiles:', error);
        const defaultTiles = ALL_AVAILABLE_TILES.slice(0, 3);
        setTiles(defaultTiles);
        setSelectedTileIds(defaultTiles.map(t => t.id));
      } finally {
        setLoading(false);
      }
    };

    fetchTiles();
  }, []);

  const handleTileClick = (tileId: string) => {
    navigate(getTileRoute(tileId));
  };

  const handleOpenConfig = () => {
    setOpenConfig(true);
  };

  const handleCloseConfig = () => {
    setOpenConfig(false);
  };

  const handleTileToggle = (tileId: string) => {
    setSelectedTileIds((prev) => {
      if (prev.includes(tileId)) {
        return prev.filter(id => id !== tileId);
      } else if (prev.length < 3) {
        return [...prev, tileId];
      }
      return prev;
    });
  };

  const handleSavePreferences = async () => {
    try {
      const selectedTiles = ALL_AVAILABLE_TILES.filter(t => selectedTileIds.includes(t.id));
      setTiles(selectedTiles);
      setOpenConfig(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Quick Access
        </Typography>
        <IconButton
          size="small"
          onClick={handleOpenConfig}
          sx={{ color: '#667eea' }}
          title="Configure tiles"
        >
          <Settings />
        </IconButton>
      </Box>
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

      <Dialog open={openConfig} onClose={handleCloseConfig} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Quick Access Tiles</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select up to 3 tiles to display on your dashboard
          </Alert>
          <Stack spacing={1}>
            {ALL_AVAILABLE_TILES.map((tile) => (
              <FormControlLabel
                key={tile.id}
                control={
                  <Checkbox
                    checked={selectedTileIds.includes(tile.id)}
                    onChange={() => handleTileToggle(tile.id)}
                    disabled={selectedTileIds.length >= 3 && !selectedTileIds.includes(tile.id)}
                  />
                }
                label={tile.label}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfig}>Cancel</Button>
          <Button onClick={handleSavePreferences} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
