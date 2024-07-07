import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user: initialUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageStats, setPageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.accessToken) {
      fetchPages();
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/me/accounts?access_token=${user.accessToken}`
      );
      setPages(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Error fetching pages. Please try again later.');
      setLoading(false);
    }
  };

  const fetchPageAccessToken = async (pageId) => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${pageId}`,
        {
          params: {
            fields: 'access_token',
            access_token: user.accessToken,
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error fetching page access token:', error);
      setError(`Error fetching page access token: ${error.response?.data?.error?.message || error.message}`);
      setLoading(false);
      return null;
    }
  };

  const fetchPageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageAccessToken = await fetchPageAccessToken(selectedPage);
  
      if (!pageAccessToken) {
        setLoading(false);
        return;
      }
  
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${selectedPage}/insights`,
        {
          params: {
            metric: 'page_impressions_unique,page_impressions_paid,page_fan_count,page_engaged_users,page_consumptions_by_consumption_type,page_consumptions,page_positive_feedback_by_type',
            access_token: pageAccessToken,
            period: 'day',
            date_preset: 'last_30d',
          },
        }
      );
  
      setPageStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching page stats:', error.response ? error.response.data : error.message);
      setError(`Error fetching page stats: ${error.response?.data?.error?.message || error.message}`);
      setLoading(false);
    }
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
  };

  useEffect(() => {
    if (selectedPage && user && user.accessToken) {
      fetchPageStats();
    }
  }, [selectedPage, user]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <img src={user.picture?.data?.url} alt={user.name} style={{ borderRadius: '50%', width: 50, height: 50 }} />
        </Grid>
        <Grid item>
          <Typography variant="h5">Welcome, {user.name}!</Typography>
        </Grid>
        <Grid item>
          <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>
        </Grid>
      </Grid>

      {loading ? (
        <CircularProgress style={{ marginTop: 20 }} />
      ) : error ? (
        <Typography color="error" style={{ marginTop: 20 }}>{error}</Typography>
      ) : pages.length === 0 ? (
        <Typography style={{ marginTop: 20 }}>
          You don't have admin access to any Facebook Pages. To use this feature, please create a Facebook Page or obtain admin access to an existing one.
        </Typography>
      ) : (
        <>
          <Select value={selectedPage} onChange={handlePageChange} style={{ marginTop: 20, marginBottom: 20, minWidth: 200 }}>
            {pages.map((page) => (
              <MenuItem key={page.id} value={page.id}>
                {page.name}
              </MenuItem>
            ))}
          </Select>

          {pageStats.length > 0 && (
            <Grid container spacing={2} style={{ marginTop: 20 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Followers / Fans</Typography>
                    <Typography variant="body2">
                      {pageStats.find(stat => stat.name === 'page_fan_count')?.values[0]?.value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Engagement</Typography>
                    <Typography variant="body2">
                      {pageStats.find(stat => stat.name === 'page_engaged_users')?.values[0]?.value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Impressions</Typography>
                    <Typography variant="body2">
                      {pageStats.find(stat => stat.name === 'page_impressions_unique')?.values[0]?.value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Reactions</Typography>
                    <Typography variant="body2">
                      {pageStats.find(stat => stat.name === 'page_positive_feedback_by_type')?.values[0]?.value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
