import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockResetIcon from '@mui/icons-material/LockReset';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiClient';

export const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    handleMenuClose();
    navigate('/profile?section=password');
  };

  const handleMFASettings = () => {
    handleMenuClose();
    navigate('/profile?section=mfa');
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    handleMenuClose();
    try {
      await apiClient.logout();
    } catch {
      // Continue with local cleanup even if logout API fails.
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/login');
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.12)',
          },
        }}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
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
            minWidth: 200,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          },
        }}
      >
        <MenuItem onClick={handleChangePassword}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Password</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleMFASettings}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>MFA Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} disabled={logoutLoading}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{logoutLoading ? 'Logging out...' : 'Logout'}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
