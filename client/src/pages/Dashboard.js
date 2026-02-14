import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  PlayCircleOutline,
  LiveTv,
  TrendingUp,
  School,
  Whatshot
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentClasses, setRecentClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, classesRes, myClassesRes] = await Promise.all([
        axios.get('/classes/stats'),
        axios.get('/classes?limit=4'),
        axios.get('/user/classes')
      ]);
      setStats(statsRes.data);
      setRecentClasses(classesRes.data);
      setMyClasses(myClassesRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    { icon: <School sx={{ fontSize: 40 }} />, label: 'Total Classes', value: stats?.totalClasses || 0, color: '#1976d2' },
    { icon: <LiveTv sx={{ fontSize: 40 }} />, label: 'Live Classes', value: stats?.liveClasses || 0, color: '#dc004e' },
    { icon: <PlayCircleOutline sx={{ fontSize: 40 }} />, label: 'My Classes', value: stats?.enrolledClasses || 0, color: '#2e7d32' },
    { icon: <TrendingUp sx={{ fontSize: 40 }} />, label: 'Total Views', value: stats?.totalViews || 0, color: '#ed6c02' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}! 👋
        </Typography>
        <Typography variant="body1">
          Continue your learning journey with our latest classes
        </Typography>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.label}
                    </Typography>
                    <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* My Classes */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">My Enrolled Classes</Typography>
        <Button color="primary" onClick={() => navigate('/classes')}>
          View All Classes
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        {myClasses.slice(0, 4).map((classItem) => (
          <Grid item xs={12} sm={6} md={3} key={classItem._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' }
              }}
              onClick={() => navigate(`/class/${classItem._id}`)}
            >
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundImage: `url(${classItem.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {classItem.type === 'live' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      bgcolor: 'error.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    LIVE
                  </Box>
                )}
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="h3" noWrap>
                  {classItem.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  {classItem.instructor}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    {classItem.duration}
                  </Typography>
                  <Typography variant="caption" color="primary">
                    {classItem.views} views
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Popular Classes */}
      <Box mb={3}>
        <Typography variant="h5">Popular Classes</Typography>
      </Box>

      <Grid container spacing={3}>
        {recentClasses.map((classItem) => (
          <Grid item xs={12} sm={6} md={3} key={classItem._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' }
              }}
              onClick={() => navigate(`/class/${classItem._id}`)}
            >
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundImage: `url(${classItem.thumbnail})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Whatshot sx={{ fontSize: 14 }} /> {classItem.views}
                </Box>
              </Box>
              <CardContent>
                <Typography gutterBottom variant="h6" component="h3" noWrap>
                  {classItem.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  {classItem.instructor}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    {classItem.duration}
                  </Typography>
                  <Typography variant="caption" color="primary">
                    {classItem.category}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;