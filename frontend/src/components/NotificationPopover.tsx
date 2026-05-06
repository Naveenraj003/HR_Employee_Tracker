import {
  Box,
  Popover,
  List,
  ListItemButton,
  Badge,
  IconButton,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useState } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ClearIcon from '@mui/icons-material/Clear';
import PaidIcon from '@mui/icons-material/Paid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CakeIcon from '@mui/icons-material/Cake';
import CelebrationIcon from '@mui/icons-material/Celebration';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { apiClient } from '../api/apiClient';
import { format } from 'date-fns';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  metadata: Record<string, any> | null;
  read: boolean;
  createdAt: string;
}

export const NotificationPopover = ({ unreadCount }: { unreadCount: number }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Notification[]>('/dashboard/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await apiClient.post(`/dashboard/notifications/${notificationId}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, { icon: JSX.Element; color: string }> = {
      payslip: { icon: <PaidIcon fontSize="small" />, color: '#4caf50' },
      leave_approval: { icon: <CheckCircleIcon fontSize="small" />, color: '#2196f3' },
      leave_rejection: { icon: <CancelIcon fontSize="small" />, color: '#f44336' },
      system_alert: { icon: <WarningAmberIcon fontSize="small" />, color: '#ff9800' },
      birthday: { icon: <CakeIcon fontSize="small" />, color: '#e91e63' },
      anniversary: { icon: <CelebrationIcon fontSize="small" />, color: '#9c27b0' },
    };
    return iconMap[type] || { icon: <MailOutlineIcon fontSize="small" />, color: '#757575' };
  };

  const formatAmount = (metadata: Record<string, any> | null): string => {
    if (!metadata) return '';
    const amount = metadata.amount || metadata.salary || metadata.value;
    if (!amount) return '';
    return ` • ${Number(amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.12)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px',
            border: '1px solid #e0e0e0',
          },
        }}
      >
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
            <IconButton size="small" onClick={handleClose} sx={{ color: 'white' }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress size={40} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
            {notifications.map((notification, index) => {
              const { icon, color } = getNotificationIcon(notification.type);
              const amount = formatAmount(notification.metadata);
              const timeAgo = format(new Date(notification.createdAt), 'MMM dd, HH:mm');

              return (
                <div key={notification.id}>
                  <ListItemButton
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : '#f5f7ff',
                      '&:hover': {
                        backgroundColor: notification.read ? '#fafafa' : '#eef2ff',
                      },
                      py: 1.5,
                      px: 2,
                      transition: 'background-color 0.2s',
                    }}
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                      <Box
                        sx={{
                          mt: 0.25,
                          flexShrink: 0,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${color}14`,
                          color,
                        }}
                      >
                        {icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: '#333',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {notification.title}
                            {amount && (
                              <span style={{ color, fontWeight: 700 }}>{amount}</span>
                            )}
                          </Typography>
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#667eea',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            mb: 0.75,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={notification.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            sx={{
                              height: 20,
                              backgroundColor: color,
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            {timeAgo}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>
                  </ListItemButton>
                  {index < notifications.length - 1 && <Divider sx={{ my: 0 }} />}
                </div>
              );
            })}
          </List>
        )}
      </Popover>
    </>
  );
};
