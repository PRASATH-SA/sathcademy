import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  VideoLibrary,
  ExitToApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          📚 LearnStream
        </Typography>

        {user ? (
          <>
            <Button color="inherit" onClick={() => navigate('/classes')}>
              Classes
            </Button>
            {isAdmin && (
              <Button color="inherit" onClick={() => navigate('/admin')}>
                Admin
              </Button>
            )}
            <IconButton onClick={handleMenu} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigation('/profile')}>
                <AccountCircle sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={() => handleNavigation('/')}>
                <Dashboard sx={{ mr: 1 }} /> Dashboard
              </MenuItem>
              <MenuItem onClick={() => handleNavigation('/classes')}>
                <VideoLibrary sx={{ mr: 1 }} /> My Classes
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="primary" variant="contained" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;