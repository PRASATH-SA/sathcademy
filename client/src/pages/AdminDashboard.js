import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Visibility,
  Person,
  Class as ClassIcon,
  Dashboard as DashboardIcon,
  BarChart
} from '@mui/icons-material';
import axios from 'axios';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    type: 'recorded',
    videoUrl: '',
    thumbnail: '',
    duration: '',
    category: '',
    schedule: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, classesRes, usersRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/classes'),
        axios.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setClasses(classesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type);
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        description: '',
        instructor: '',
        type: 'recorded',
        videoUrl: '',
        thumbnail: '',
        duration: '',
        category: '',
        schedule: ''
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (dialogType === 'class') {
        if (editingItem) {
          await axios.put(`/admin/classes/${editingItem._id}`, formData);
          setSuccess('Class updated successfully');
        } else {
          await axios.post('/admin/classes', formData);
          setSuccess('Class created successfully');
        }
      } else if (dialogType === 'user') {
        if (editingItem) {
          await axios.put(`/admin/users/${editingItem._id}`, formData);
          setSuccess('User updated successfully');
        }
      }
      fetchData();
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (error) {
      console.error('Failed to save:', error);
      setError(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        if (type === 'class') {
          await axios.delete(`/admin/classes/${id}`);
          setSuccess('Class deleted successfully');
        } else if (type === 'user') {
          await axios.delete(`/admin/users/${id}`);
          setSuccess('User deleted successfully');
        }
        fetchData();
      } catch (error) {
        console.error('Failed to delete:', error);
        setError('Failed to delete');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your platform, classes, and users
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total Users</Typography>
                  <Typography variant="h4">{stats?.stats?.totalUsers || 0}</Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total Classes</Typography>
                  <Typography variant="h4">{stats?.stats?.totalClasses || 0}</Typography>
                </Box>
                <ClassIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>Live Classes</Typography>
                  <Typography variant="h4">{stats?.stats?.liveClasses || 0}</Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>Total Views</Typography>
                  <Typography variant="h4">{stats?.stats?.totalViews || 0}</Typography>
                </Box>
                <BarChart sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<ClassIcon />} label="Classes" />
          <Tab icon={<Person />} label="Users" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Users</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Joined</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats?.recentUsers?.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Popular Classes</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Views</TableCell>
                          <TableCell>Students</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats?.popularClasses?.map((cls) => (
                          <TableRow key={cls._id}>
                            <TableCell>{cls.title}</TableCell>
                            <TableCell>{cls.views}</TableCell>
                            <TableCell>{cls.enrolledStudents?.length || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Classes Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog('class')}
            >
              Add New Class
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Instructor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Students</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls._id}>
                    <TableCell>{cls.title}</TableCell>
                    <TableCell>{cls.instructor}</TableCell>
                    <TableCell>
                      <Chip
                        label={cls.type}
                        color={cls.type === 'live' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{cls.category}</TableCell>
                    <TableCell>{cls.views}</TableCell>
                    <TableCell>{cls.enrolledStudents?.length || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={cls.isActive ? 'Active' : 'Inactive'}
                        color={cls.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog('class', cls)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete('class', cls._id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Users Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Enrolled Classes</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === 'admin' ? 'secondary' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.enrolledClasses?.length || 0}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenDialog('user', user)} size="small">
                        <Edit />
                      </IconButton>
                      {user.role !== 'admin' && (
                        <IconButton onClick={() => handleDelete('user', user._id)} size="small" color="error">
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? `Edit ${dialogType}` : `Add New ${dialogType}`}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          {dialogType === 'class' && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={4}
                required
              />
              <TextField
                fullWidth
                label="Instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                margin="normal"
                required
              >
                <MenuItem value="recorded">Recorded</MenuItem>
                <MenuItem value="live">Live</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Video URL (YouTube)"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                margin="normal"
                required
                helperText="Paste YouTube video URL"
              />
              <TextField
                fullWidth
                label="Thumbnail URL"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                margin="normal"
                required
                placeholder="e.g., 45 minutes"
              />
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              {formData.type === 'live' && (
                <TextField
                  fullWidth
                  label="Schedule"
                  name="schedule"
                  type="datetime-local"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  required
                />
              )}
            </Box>
          )}

          {dialogType === 'user' && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                select
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                margin="normal"
                required
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;